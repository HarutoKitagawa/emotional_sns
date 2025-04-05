package graphdb

import (
	"context"

	"github.com/google/uuid"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type Neo4jClient struct {
	driver neo4j.DriverWithContext
}

func NewNeo4jClient(uri, username, password string) (GraphDbClient, error) {
	driver, err := neo4j.NewDriverWithContext(uri, neo4j.BasicAuth(username, password, ""))
	if err != nil {
		return nil, err
	}
	return &Neo4jClient{driver: driver}, nil
}

func (c *Neo4jClient) Close() error {
	return c.driver.Close(context.Background())
}

func (c *Neo4jClient) CreatePostWithEmotions(userId, postId, content string, emotions []EmotionTag) error {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		// UserとPostノードの作成
		_, err := tx.Run(context.Background(), `
            MERGE (u:User {id: $userId})
            CREATE (p:Post {id: $postId, content: $content})
            MERGE (u)-[:POSTED]->(p)
        `, map[string]any{
			"userId":  userId,
			"postId":  postId,
			"content": content,
		})
		if err != nil {
			return nil, err
		}

		// 各Emotionとのリレーション（スコアはリレーションプロパティ）
		for _, e := range emotions {
			_, err := tx.Run(context.Background(), `
                MERGE (em:Emotion {type: $type})
				WITH em
                MATCH (p:Post {id: $postId})
                MERGE (em)-[r:TAGGED]->(p)
                SET r.score = $score
            `, map[string]any{
				"type":   e.Type,
				"score":  e.Score,
				"postId": postId,
			})
			if err != nil {
				return nil, err
			}
		}

		return nil, nil
	})

	return err
}

func (c *Neo4jClient) GetPostWithEmotions(postId string) (string, string, []EmotionTag, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		rec, err := tx.Run(context.Background(), `
			MATCH (u:User)-[:POSTED]->(p:Post {id: $postId})
			OPTIONAL MATCH (e:Emotion)-[t:TAGGED]->(p)
			RETURN u.id AS userId, p.content AS content,
			       collect({type: e.type, score: t.score}) AS emotions
		`, map[string]any{"postId": postId})
		if err != nil {
			return nil, err
		}
		if !rec.Next(context.Background()) {
			return nil, nil // Not found
		}

		record := rec.Record()
		userId, _ := record.Get("userId")
		content, _ := record.Get("content")
		rawEmotions, _ := record.Get("emotions")

		var emotions []EmotionTag
		if list, ok := rawEmotions.([]any); ok {
			for _, item := range list {
				if m, ok := item.(map[string]any); ok {
					emotions = append(emotions, EmotionTag{
						Type:  m["type"].(string),
						Score: m["score"].(float64),
					})
				}
			}
		}

		return struct {
			UserID   string
			Content  string
			Emotions []EmotionTag
		}{
			UserID:   userId.(string),
			Content:  content.(string),
			Emotions: emotions,
		}, nil
	})
	if err != nil {
		return "", "", nil, err
	}
	if result == nil {
		return "", "", nil, nil // Not found
	}
	r := result.(struct {
		UserID   string
		Content  string
		Emotions []EmotionTag
	})
	return r.UserID, r.Content, r.Emotions, nil
}

func (c *Neo4jClient) GetReactions(postId string) (map[string]int, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		records, err := tx.Run(context.Background(), `
			MATCH (:User)-[r:REACTED]->(p:Post {id: $postId})
			RETURN r.type AS type, count(*) AS count
		`, map[string]any{"postId": postId})
		if err != nil {
			return nil, err
		}

		reactions := map[string]int{}
		for records.Next(context.Background()) {
			record := records.Record()
			typ, _ := record.Get("type")
			count, _ := record.Get("count")
			if typStr, ok := typ.(string); ok {
				reactions[typStr] = int(count.(int64))
			}
		}
		return reactions, nil
	})

	if err != nil {
		return nil, err
	}
	return result.(map[string]int), nil
}

func (c *Neo4jClient) AddReaction(postId, userId, reactionType string) error {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(context.Background(), `
            MERGE (u:User {id: $userId})
			WITH u
            MATCH (p:Post {id: $postId})
            MERGE (u)-[r:REACTED]->(p)
            SET r.type = $type
        `, map[string]any{
			"userId": userId,
			"postId": postId,
			"type":   reactionType,
		})
		return nil, err
	})

	return err
}

func (c *Neo4jClient) AddReply(postId, userId, content string) (string, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	replyId := uuid.New().String()

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(context.Background(), `
			MERGE (u:User {id: $userId})
			WITH u
			MATCH (p:Post {id: $postId})
			CREATE (r:Reply {id: $replyId, content: $content})
			MERGE (u)-[:REPLIED]->(r)
			MERGE (r)-[:REPLY_TO]->(p)
		`, map[string]any{
			"userId":  userId,
			"postId":  postId,
			"replyId": replyId,
			"content": content,
		})
		return nil, err
	})

	if err != nil {
		return "", err
	}

	return replyId, nil
}

func (c *Neo4jClient) GetReplies(postId string) ([]ReplyItem, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		records, err := tx.Run(context.Background(), `
			MATCH (u:User)-[:REPLIED]->(r:Reply)-[:REPLY_TO]->(p:Post {id: $postId})
			RETURN r.id AS replyId, u.id AS userId, r.content AS content
			ORDER BY r.id
		`, map[string]any{"postId": postId})
		if err != nil {
			return nil, err
		}

		var replies []ReplyItem
		for records.Next(context.Background()) {
			rec := records.Record()
			replies = append(replies, ReplyItem{
				ReplyID: rec.Values[0].(string),
				UserID:  rec.Values[1].(string),
				Content: rec.Values[2].(string),
			})
		}
		return replies, nil
	})
	if err != nil {
		return nil, err
	}
	return result.([]ReplyItem), nil
}

func (c *Neo4jClient) GetFeed(emotionFilter string) ([]FeedPost, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	var query string
	params := map[string]any{}
	if emotionFilter != "" {
		query = `
			MATCH (p:Post)<-[t:TAGGED]-(e:Emotion)
			WHERE e.type = $emotion
			MATCH (u:User)-[:POSTED]->(p)
			RETURN p.id AS postId, p.content AS content, u.id AS userId,
			       collect({type: e.type, score: t.score}) AS emotions
		`
		params["emotion"] = emotionFilter
	} else {
		query = `
			MATCH (u:User)-[:POSTED]->(p:Post)
			OPTIONAL MATCH (e:Emotion)-[t:TAGGED]->(p)
			RETURN p.id AS postId, p.content AS content, u.id AS userId,
			       collect({type: e.type, score: t.score}) AS emotions
		`
	}

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		records, err := tx.Run(context.Background(), query, params)
		if err != nil {
			return nil, err
		}

		var posts []FeedPost
		for records.Next(context.Background()) {
			rec := records.Record()
			emotionsRaw := rec.Values[3].([]any)
			var emotions []EmotionTag
			for _, e := range emotionsRaw {
				if m, ok := e.(map[string]any); ok {
					emotions = append(emotions, EmotionTag{
						Type:  m["type"].(string),
						Score: m["score"].(float64),
					})
				}
			}
			posts = append(posts, FeedPost{
				PostID:      rec.Values[0].(string),
				Content:     rec.Values[1].(string),
				UserID:      rec.Values[2].(string),
				EmotionTags: emotions,
			})
		}
		return posts, nil
	})
	if err != nil {
		return nil, err
	}
	return result.([]FeedPost), nil
}

func (c *Neo4jClient) GetAllEmotionTags() ([]EmotionTagOnly, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		records, err := tx.Run(context.Background(), `
			MATCH (e:Emotion)
			RETURN DISTINCT e.type AS type
			ORDER BY type
		`, nil)
		if err != nil {
			return nil, err
		}

		var tags []EmotionTagOnly
		for records.Next(context.Background()) {
			record := records.Record()
			etype, _ := record.Get("type")
			if etype != nil {
				tags = append(tags, EmotionTagOnly{
					Type: etype.(string),
				})
			}
		}

		return tags, nil
	})
	if err != nil {
		return nil, err
	}
	return result.([]EmotionTagOnly), nil
}
