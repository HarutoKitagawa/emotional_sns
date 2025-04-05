package graphdb

type EmotionTag struct {
	Type  string  `json:"emotion"`
	Score float64 `json:"score"`
}

type GraphDbClient interface {
	CreatePostWithEmotions(userId, postId, content string, emotions []EmotionTag) error
	GetPostWithEmotions(postId string) (userId, content string, emotions []EmotionTag, err error)
	GetReactions(postId string) (map[string]int, error)
	AddReaction(postId, userId, reactionType string) error
	AddReply(postId, userId, content string) (replyId string, err error)
	Close() error
}
