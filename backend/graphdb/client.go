package graphdb

type EmotionTag struct {
	Type  string  `json:"emotion"`
	Score float64 `json:"score"`
}

type InfluencedPost struct {
	PostID  string `json:"postId"`
	Content string `json:"content"`
}

type ReplyItem struct {
	ReplyID   string `json:"replyId"`
	UserID    string `json:"userId"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
}

type FeedPost struct {
	PostID      string         `json:"postId"`
	UserID      string         `json:"userId"`
	Content     string         `json:"content"`
	CreatedAt   string         `json:"createdAt"`
	EmotionTags []EmotionTag   `json:"emotionTags"`
	Reactions   map[string]int `json:"reactions"`
	ReplyCount  int            `json:"replyCount"`
}

type EmotionTagOnly struct {
	Type string `json:"type"`
}

type InfluenceUser struct {
	UserID        string `json:"userId"`
	Type          string `json:"type"`
	ThroughPostID string `json:"throughPostId,omitempty"`
}

type PostInfluence struct {
	FirstDegree  []InfluenceUser `json:"firstDegree"`
	SecondDegree []InfluenceUser `json:"secondDegree"`
	ThirdDegree  []InfluenceUser `json:"thirdDegree"`
}

type GraphDbClient interface {
	CreatePostWithEmotions(userId, postId, content string, emotions []EmotionTag) error
	GetPostWithEmotions(postId string) (userId, content, createdAt string, emotions []EmotionTag, err error)
	GetReactions(postId string) (map[string]int, error)
	AddReaction(postId, userId, reactionType string) error
	AddReply(postId, userId, content string) (replyId string, err error)
	AddInfluence(fromUserID, postID, influenceType string) error
	GetReplies(postId string) ([]ReplyItem, error)
	GetFeed(emotionFilter string) ([]FeedPost, error)
	GetAllEmotionTags() ([]EmotionTagOnly, error)
	FollowUser(userId, targetUserId string) error
	GetPostContent(postId string) (content string, err error)
	GetInfluencedPostsLast24Hours(userId string) ([]InfluencedPost, error)
	AddSameTopicRelation(fromPostID, toPostID string) error
	GetPostInfluence(postId string) (PostInfluence, error)
	Close() error
}
