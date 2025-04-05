package graphdb

type EmotionTag struct {
	Type  string  `json:"emotion"`
	Score float64 `json:"score"`
}

type ReplyItem struct {
	ReplyID   string `json:"replyId"`
	UserID    string `json:"userId"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
}

type FeedPost struct {
	PostID      string       `json:"postId"`
	UserID      string       `json:"userId"`
	Content     string       `json:"content"`
	CreatedAt   string       `json:"createdAt"`
	EmotionTags []EmotionTag `json:"emotionTags"`
}

type EmotionTagOnly struct {
	Type string `json:"type"`
}

type GraphDbClient interface {
	CreatePostWithEmotions(userId, postId, content string, emotions []EmotionTag) error
	GetPostWithEmotions(postId string) (userId, content, createdAt string, emotions []EmotionTag, err error)
	GetReactions(postId string) (map[string]int, error)
	AddReaction(postId, userId, reactionType string) error
	AddReply(postId, userId, content string) (replyId string, err error)
	GetReplies(postId string) ([]ReplyItem, error)
	GetFeed(emotionFilter string) ([]FeedPost, error)
	GetAllEmotionTags() ([]EmotionTagOnly, error)
	Close() error
}
