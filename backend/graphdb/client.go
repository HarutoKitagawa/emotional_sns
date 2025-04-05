package graphdb

type EmotionTag struct {
	Type  string  `json:"emotion"`
	Score float64 `json:"score"`
}

type GraphDbClient interface {
	CreatePostWithEmotions(userId, postId, content string, emotions []EmotionTag) error
	Close() error
}
