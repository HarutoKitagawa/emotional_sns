package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

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

func main() {
	// Initialize Neo4j client
	client, err := graphdb.NewNeo4jClient(os.Getenv("NEO4J_URI"), "neo4j", "password")
	if err != nil {
		log.Fatal("Neo4jクライアント作成失敗:", err)
	}
	defer client.Close()

	http.HandleFunc("/posts", handleCreatePost(client))

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
		emotions, err := analyzeEmotion(req.Content)
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

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(PostResponse{
			PostID: postId,
			Status: "created",
		})
	}
}

func analyzeEmotion(content string) ([]graphdb.EmotionTag, error) {
	api := os.Getenv("EMOTION_API")
	body, _ := json.Marshal(map[string]string{"content": content})
	resp, err := http.Post(api+"/analyze", "application/json", bytes.NewBuffer(body))
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
