package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/HarutoKitagawa/emotional_sns/backend/graphdb"
	"github.com/google/uuid"
)

type PostRequest struct {
	UserID  string `json:"userId"`
	Content string `json:"content"`
}

type EmotionResponse struct {
	Emotion string  `json:"emotion"`
	Score   float64 `json:"score"`
}

type PostResponse struct {
	PostID string `json:"postId"`
	Status string `json:"status"`
}

type GetPostResponse struct {
	PostID         string               `json:"postId"`
	UserID         string               `json:"userId"`
	Content        string               `json:"content"`
	CreatedAt      string               `json:"createdAt"`
	EmotionTags    []graphdb.EmotionTag `json:"emotionTags"`
	ReactionCounts map[string]int       `json:"reactionCounts"`
}

type ReactionRequest struct {
	UserID string `json:"userId"`
	Type   string `json:"type"`
}

type ReplyRequest struct {
	UserID  string `json:"userId"`
	Content string `json:"content"`
}

type ReplyResponse struct {
	ReplyID string `json:"replyId"`
	Status  string `json:"status"`
}

type GetRepliesResponse struct {
	Replies []graphdb.ReplyItem `json:"replies"`
}

type FeedResponse struct {
	Posts []graphdb.FeedPost `json:"posts"`
}

type EmotionTagsResponse struct {
	EmotionTags []graphdb.EmotionTagOnly `json:"emotionTags"`
}

type FollowRequest struct {
	TargetUserID string `json:"targetUserId"`
}

type FollowResponse struct {
	Status string `json:"status"`
}

func main() {
	// Initialize Neo4j client
	client, err := graphdb.NewNeo4jClient(os.Getenv("NEO4J_URI"), "neo4j", "password")
	if err != nil {
		log.Fatal("Failed to create Neo4j client:", err)
	}
	defer client.Close()

	http.HandleFunc("/posts", handleCreatePost(client))
	http.HandleFunc("/posts/", func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/replies"):
			if r.Method == http.MethodPost {
				handleAddReply(client)(w, r)
			} else if r.Method == http.MethodGet {
				handleGetReplies(client)(w, r)
			} else {
				http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			}
		case strings.HasSuffix(r.URL.Path, "/reactions"):
			handleAddReaction(client)(w, r)
		default:
			handleGetPost(client)(w, r)
		}
	})
	http.HandleFunc("/users/", func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/feed"):
			handleUserFeed(client)(w, r)
		case strings.HasSuffix(r.URL.Path, "/follow"):
			handleFollowUser(client)(w, r)
		default:
			http.NotFound(w, r)
		}
	})
	http.HandleFunc("/emotion-tags", handleGetAllEmotionTags(client))

	fmt.Println("🚀 Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleCreatePost(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		var req PostRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" || req.Content == "" {
			http.Error(w, "Missing userId or content", http.StatusBadRequest)
			return
		}

		// Call emotion analysis API
		emotions, err := analyzeEmotionOfPost(req.Content)
		if err != nil {
			http.Error(w, "Emotion analysis failed", http.StatusInternalServerError)
			return
		}
		log.Printf("Emotions: %v", emotions)

		// Create post in Neo4j
		postId := uuid.New().String()
		err = client.CreatePostWithEmotions(req.UserID, postId, req.Content, emotions)
		if err != nil {
			log.Printf("Failed to create post in database: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		// 過去24時間に影響を受けた投稿を取得
		influencedPosts, err := client.GetInfluencedPostsLast24Hours(req.UserID)
		if err != nil {
			log.Printf("Failed to get influenced posts: %v", err)
			// エラーがあっても処理は続行
		} else {
			// 各投稿について、同じトピックかどうかを判断
			for _, post := range influencedPosts {
				isSameTopic, err := analyzeTopicSimilarity(req.Content, post.Content)
				if err != nil {
					log.Printf("Failed to analyze topic similarity: %v", err)
					continue
				}

				if isSameTopic {
					// 同じトピックであれば、SAME_TOPICリレーションを作成
					if err := client.AddSameTopicRelation(postId, post.PostID); err != nil {
						log.Printf("Failed to add SAME_TOPIC relation: %v", err)
					}
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(PostResponse{
			PostID: postId,
			Status: "created",
		})
	}
}

func handleGetPost(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		postId := strings.TrimPrefix(r.URL.Path, "/posts/")

		userId, content, createdAt, emotions, err := client.GetPostWithEmotions(postId)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		if userId == "" {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		reactions, err := client.GetReactions(postId)
		if err != nil {
			http.Error(w, "Failed to get reactions", http.StatusInternalServerError)
			return
		}

		resp := GetPostResponse{
			PostID:         postId,
			UserID:         userId,
			Content:        content,
			EmotionTags:    emotions,
			CreatedAt:      createdAt,
			ReactionCounts: reactions,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

func handleAddReaction(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		postId := strings.TrimPrefix(r.URL.Path, "/posts/") // 超簡易ルーティング
		postId = strings.TrimSuffix(postId, "/reactions")

		var req ReactionRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" || req.Type == "" {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// 簡易バリデーション
		validTypes := map[string]bool{"like": true, "love": true, "cry": true, "angry": true, "wow": true}
		if !validTypes[req.Type] {
			http.Error(w, "Invalid reaction type", http.StatusBadRequest)
			return
		}

		if err := client.AddReaction(postId, req.UserID, req.Type); err != nil {
			log.Printf("Failed to add reaction: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		// Register influence
		if err := client.AddInfluence(req.UserID, postId, req.Type); err != nil {
			log.Printf("Failed to register influence: %v", err)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"status": "reaction added"})
	}
}

func handleAddReply(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		postId := strings.TrimPrefix(r.URL.Path, "/posts/")
		postId = strings.TrimSuffix(postId, "/replies")

		var req ReplyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" || req.Content == "" {
			http.Error(w, "Missing userId or content", http.StatusBadRequest)
			return
		}

		replyId, err := client.AddReply(postId, req.UserID, req.Content)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		postConstent, err := client.GetPostContent(postId)
		if err != nil {
			http.Error(w, "Failed to get post content", http.StatusInternalServerError)
			return
		}
		emotionResp, err := analyzeEmotionOfReply(postConstent, req.Content)
		if err != nil {
			http.Error(w, "Emotion analysis failed", http.StatusInternalServerError)
			return
		}

		// Register influence for each emotion
		for _, emotion := range emotionResp {
			if err := client.AddInfluence(req.UserID, postId, emotion.Type); err != nil {
				log.Printf("Failed to register influence: %v", err)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(ReplyResponse{
			ReplyID: replyId,
			Status:  "reply created",
		})
	}
}

func handleGetReplies(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		postId := strings.TrimPrefix(r.URL.Path, "/posts/")
		postId = strings.TrimSuffix(postId, "/replies")

		replies, err := client.GetReplies(postId)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GetRepliesResponse{Replies: replies})
	}
}

func handleUserFeed(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// `/users/{userId}/feed` から userId を抽出（使わないが確保）
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 3 || parts[0] != "users" || parts[2] != "feed" {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}
		// userId := parts[1] // 将来的に使う想定

		emotion := r.URL.Query().Get("emotion")
		posts, err := client.GetFeed(emotion)
		if err != nil {
			log.Printf("Failed to get feed: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(FeedResponse{Posts: posts})
	}
}

func handleGetAllEmotionTags(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		tags, err := client.GetAllEmotionTags()
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		resp := EmotionTagsResponse{
			EmotionTags: tags,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

func handleFollowUser(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 3 || parts[0] != "users" || parts[2] != "follow" {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}
		userId := parts[1]

		var req FollowRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.TargetUserID == "" {
			http.Error(w, "Missing targetUserId", http.StatusBadRequest)
			return
		}

		if err := client.FollowUser(userId, req.TargetUserID); err != nil {
			log.Printf("Failed to follow: %v", err)
			http.Error(w, "Failed to follow", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(FollowResponse{Status: "followed"})
	}
}

func analyzeEmotionOfPost(content string) ([]graphdb.EmotionTag, error) {
	api := os.Getenv("EMOTION_API")
	body, _ := json.Marshal(map[string]string{"content": content})
	resp, err := http.Post(api+"/analyze_post", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result []graphdb.EmotionTag
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

func analyzeEmotionOfReply(post string, reply string) ([]graphdb.EmotionTag, error) {
	api := os.Getenv("EMOTION_API")
	body, _ := json.Marshal(map[string]string{"post": post, "reply": reply})
	resp, err := http.Post(api+"/analyze_reply", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result []graphdb.EmotionTag
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

func analyzeTopicSimilarity(content1, content2 string) (bool, error) {
	api := os.Getenv("EMOTION_API")
	body, _ := json.Marshal(map[string]string{
		"post1": content1,
		"post2": content2,
	})

	resp, err := http.Post(api+"/analyze_topic_similarity", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	var result struct {
		IsSameTopic bool    `json:"is_same_topic"`
		Confidence  float64 `json:"confidence"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, err
	}

	// 確信度が0.7以上の場合に同じトピックと判断（閾値は調整可能）
	return result.IsSameTopic && result.Confidence >= 0.7, nil
}
