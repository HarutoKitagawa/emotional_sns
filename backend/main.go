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

// JWT secret key
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

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

type PostInfluenceResponse struct {
	PostID       string                  `json:"postId"`
	FirstDegree  []graphdb.InfluenceUser `json:"firstDegree"`
	SecondDegree []graphdb.InfluenceUser `json:"secondDegree"`
	ThirdDegree  []graphdb.InfluenceUser `json:"thirdDegree"`
	Summary      PostInfluenceSummary    `json:"summary"`
}

type PostInfluenceSummary struct {
	TotalUsers int            `json:"totalUsers"`
	ByType     map[string]int `json:"byType"`
	ByDegree   map[string]int `json:"byDegree"`
}

// Auth related types
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Token    string `json:"token"`
}

func main() {
	// Initialize Neo4j client
	client, err := graphdb.NewNeo4jClient(os.Getenv("NEO4J_URI"), "neo4j", "password")
	if err != nil {
		log.Fatal("Failed to create Neo4j client:", err)
	}
	defer client.Close()

	// Set JWT secret
	if os.Getenv("JWT_SECRET") == "" {
		log.Println("Warning: JWT_SECRET not set, using default secret")
		jwtSecret = []byte("default_secret_key_for_development")
	}

	// Post related endpoints
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
		case strings.HasSuffix(r.URL.Path, "/influence"):
			handleGetPostInfluence(client)(w, r)
		default:
			handleGetPost(client)(w, r)
		}
	})

	// User related endpoints
	http.HandleFunc("/users/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.Trim(r.URL.Path, "/")
		parts := strings.Split(path, "/")

		switch {
		case strings.HasSuffix(r.URL.Path, "/feed"):
			handleUserFeed(client)(w, r)
		case strings.HasSuffix(r.URL.Path, "/follow"):
			handleFollowUser(client)(w, r)
		case strings.HasSuffix(r.URL.Path, "/posts"):
			handleUserPosts(client)(w, r)
		case strings.HasSuffix(r.URL.Path, "/followers"):
			handleUserFollowers(client)(w, r)
		case len(parts) == 4 && parts[0] == "users" && parts[2] == "following":
			// Route: /users/{userId}/following/{targetId}
			handleUnfollowUser(client)(w, r)
		case strings.HasSuffix(r.URL.Path, "/following"):
			// Route: /users/{userId}/following
			handleUserFollowing(client)(w, r)
		default:
			// Check if it's a direct user ID request
			if len(parts) == 2 && parts[0] == "users" {
				handleGetUser(client)(w, r)
			} else {
				http.NotFound(w, r)
			}
		}
	})

	// Auth related endpoints
	http.HandleFunc("/auth/register", handleRegister(client))
	http.HandleFunc("/auth/login", handleLogin(client))
	http.HandleFunc("/auth/me", handleGetCurrentUser(client))

	// Other endpoints
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

		replyId, err := client.AddReplyWithEmotions(postId, req.UserID, req.Content, emotionResp)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
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

func handleGetPostInfluence(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		postId := strings.TrimPrefix(r.URL.Path, "/posts/")
		postId = strings.TrimSuffix(postId, "/influence")

		influence, err := client.GetPostInfluence(postId)
		if err != nil {
			log.Printf("Failed to get post influence: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		// 集計情報を作成
		totalUsers := len(influence.FirstDegree) + len(influence.SecondDegree) + len(influence.ThirdDegree)
		byType := make(map[string]int)
		byDegree := map[string]int{
			"first":  len(influence.FirstDegree),
			"second": len(influence.SecondDegree),
			"third":  len(influence.ThirdDegree),
		}

		// 影響タイプごとの集計
		for _, user := range influence.FirstDegree {
			byType[user.Type]++
		}
		for _, user := range influence.SecondDegree {
			byType[user.Type]++
		}
		for _, user := range influence.ThirdDegree {
			byType[user.Type]++
		}

		response := PostInfluenceResponse{
			PostID:       postId,
			FirstDegree:  influence.FirstDegree,
			SecondDegree: influence.SecondDegree,
			ThirdDegree:  influence.ThirdDegree,
			Summary: PostInfluenceSummary{
				TotalUsers: totalUsers,
				ByType:     byType,
				ByDegree:   byDegree,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

// handleGetUser handles getting user details by ID
func handleGetUser(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 2 || parts[0] != "users" {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}
		userId := parts[1]

		userDetails, err := client.GetUserWithDetails(userId)
		if err != nil {
			log.Printf("Failed to get user details: %v", err)
			http.Error(w, "Failed to get user details", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(userDetails)
	}
}

// handleUserPosts handles getting posts by a specific user
func handleUserPosts(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 3 || parts[0] != "users" || parts[2] != "posts" {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}
		userId := parts[1]

		posts, err := client.GetUserPosts(userId)
		if err != nil {
			log.Printf("Failed to get user posts: %v", err)
			http.Error(w, "Failed to get user posts", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"posts": posts,
		})
	}
}

// Authentication handlers

// handleRegister handles user registration
func handleRegister(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate input
		if req.Username == "" || req.Email == "" || req.Password == "" {
			http.Error(w, "Username, email and password are required", http.StatusBadRequest)
			return
		}

		// Create user in database
		userId, err := client.CreateUser(req.Username, req.Email, req.Password)
		if err != nil {
			if err.Error() == "email already exists" {
				http.Error(w, "Email already registered", http.StatusConflict)
				return
			}
			log.Printf("Failed to create user: %v", err)
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}

		// Generate JWT token
		token := "dummy-token-" + userId // Replace with actual JWT token generation

		// Return response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(AuthResponse{
			UserID:   userId,
			Username: req.Username,
			Email:    req.Email,
			Token:    token,
		})
	}
}

// handleLogin handles user login
func handleLogin(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate input
		if req.Email == "" || req.Password == "" {
			http.Error(w, "Email and password are required", http.StatusBadRequest)
			return
		}

		// Validate credentials
		userId, err := client.ValidateUserCredentials(req.Email, req.Password)
		if err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Get user details
		user, err := client.GetUserByEmail(req.Email)
		if err != nil {
			log.Printf("Failed to get user: %v", err)
			http.Error(w, "Failed to get user details", http.StatusInternalServerError)
			return
		}

		// Generate JWT token
		token := "dummy-token-" + userId // Replace with actual JWT token generation

		// Return response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AuthResponse{
			UserID:   userId,
			Username: user.Username,
			Email:    user.Email,
			Token:    token,
		})
	}
}

// handleGetCurrentUser handles getting the current user from the token
// handleUserFollowers handles getting followers of a user
func handleUserFollowers(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 3 || parts[0] != "users" || parts[2] != "followers" {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}
		userId := parts[1]

		// In a real implementation, we would use the userId to get the followers
		log.Printf("Getting followers for user: %s", userId)

		// For now, we'll return an empty array
		// In a real implementation, we would get the followers from the database
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]graphdb.UserDetails{})
	}
}

// handleUserFollowing handles getting users that a user is following
func handleUserFollowing(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			// Get users that a user is following
			parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
			if len(parts) != 3 || parts[0] != "users" || parts[2] != "following" {
				http.Error(w, "Invalid path", http.StatusBadRequest)
				return
			}
			userId := parts[1]

			// In a real implementation, we would use the userId to get the following users
			log.Printf("Getting following users for user: %s", userId)

			// For now, we'll return an empty array
			// In a real implementation, we would get the following users from the database
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode([]graphdb.UserDetails{})
		} else if r.Method == http.MethodPost {
			// Follow a user
			parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
			if len(parts) != 3 || parts[0] != "users" || parts[2] != "following" {
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
		} else {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	}
}

// handleUnfollowUser handles unfollowing a user
func handleUnfollowUser(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 4 || parts[0] != "users" || parts[2] != "following" {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}
		userId := parts[1]
		targetUserId := parts[3]

		if err := client.UnfollowUser(userId, targetUserId); err != nil {
			log.Printf("Failed to unfollow: %v", err)
			http.Error(w, "Failed to unfollow", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "unfollowed"})
	}
}

func handleGetCurrentUser(client graphdb.GraphDbClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Extract token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
			return
		}
		tokenString := tokenParts[1]

		// In a real implementation, we would validate the JWT token
		// For now, we'll extract the user ID from our dummy token
		if !strings.HasPrefix(tokenString, "dummy-token-") {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
		userId := strings.TrimPrefix(tokenString, "dummy-token-")

		// Get user by ID
		user, err := client.GetUserById(userId)
		if err != nil {
			log.Printf("Failed to get user: %v", err)
			http.Error(w, "Failed to get user details", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":             user.ID,
			"username":       user.Username,
			"email":          user.Email,
			"displayName":    user.Username,                                       // Use username as displayName for now
			"avatarUrl":      "https://ui-avatars.com/api/?name=" + user.Username, // Generate avatar from username
			"bio":            "",                                                  // Empty bio for now
			"followersCount": 0,                                                   // Default value
			"followingCount": 0,                                                   // Default value
			"emotionalProfile": map[string]interface{}{
				"dominantEmotions": []string{"neutral"}, // Default emotion
				"emotionalRange":   50,                  // Middle of the range (0-100)
			},
		})
	}
}
