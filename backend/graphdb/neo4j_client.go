package graphdb

import (
	"context"
	"time"

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

	createdAt := time.Now().UTC().Format(time.RFC3339)

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		// UserとPostノードの作成
		_, err := tx.Run(context.Background(), `
            MERGE (u:User {id: $userId})
            CREATE (p:Post {id: $postId, content: $content, createdAt: $createdAt})
            MERGE (u)-[:POSTED]->(p)
        `, map[string]any{
			"userId":    userId,
			"postId":    postId,
			"content":   content,
			"createdAt": createdAt,
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

func (c *Neo4jClient) GetPostWithEmotions(postId string) (string, string, string, []EmotionTag, error) {
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
		return "", "", "", nil, err
	}
	if result == nil {
		return "", "", "", nil, nil // Not found
	}
	r := result.(struct {
		UserID    string
		Content   string
		CreatedAt string
		Emotions  []EmotionTag
	})
	return r.UserID, r.Content, r.CreatedAt, r.Emotions, nil
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

	createdAt := time.Now().UTC().Format(time.RFC3339)

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(context.Background(), `
            MERGE (u:User {id: $userId})
			WITH u
            MATCH (p:Post {id: $postId})
            MERGE (u)-[r:REACTED]->(p)
            SET r.type = $type, r.createdAt = $createdAt
        `, map[string]any{
			"userId":    userId,
			"postId":    postId,
			"type":      reactionType,
			"createdAt": createdAt,
		})
		return nil, err
	})

	return err
}

func (c *Neo4jClient) AddReply(postId, userId, content string) (string, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	replyId := uuid.New().String()

	createdAt := time.Now().UTC().Format(time.RFC3339)

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(context.Background(), `
			MERGE (u:User {id: $userId})
			WITH u
			MATCH (p:Post {id: $postId})
			CREATE (r:Reply {id: $replyId, content: $content, createdAt: $createdAt})
			MERGE (u)-[:REPLIED]->(r)
			MERGE (r)-[:REPLY_TO]->(p)
		`, map[string]any{
			"userId":    userId,
			"postId":    postId,
			"replyId":   replyId,
			"content":   content,
			"createdAt": createdAt,
		})
		return nil, err
	})

	if err != nil {
		return "", err
	}

	return replyId, nil
}

func (c *Neo4jClient) AddInfluence(fromUserID, postID, influenceType string) error {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(context.Background(), `
			MATCH (from:User {id: $fromUserID})
			MATCH (p:Post {id: $postID})
			MERGE (from)-[i:INFLUENCED {type: $type}]->(p)
		`, map[string]any{
			"fromUserID": fromUserID,
			"postID":     postID,
			"type":       influenceType,
		})
		return nil, err
	})

	return err
}

func (c *Neo4jClient) GetReplies(postId string) ([]ReplyItem, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		records, err := tx.Run(context.Background(), `
			MATCH (u:User)-[:REPLIED]->(r:Reply)-[:REPLY_TO]->(p:Post {id: $postId})
			RETURN r.id AS replyId, u.id AS userId, r.content, r.createdAt AS content
			ORDER BY r.id
		`, map[string]any{"postId": postId})
		if err != nil {
			return nil, err
		}

		var replies []ReplyItem
		for records.Next(context.Background()) {
			rec := records.Record()
			replies = append(replies, ReplyItem{
				ReplyID:   rec.Values[0].(string),
				UserID:    rec.Values[1].(string),
				Content:   rec.Values[2].(string),
				CreatedAt: rec.Values[3].(string),
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
			MATCH (p:Post)<-[:TAGGED]-(e:Emotion)
			WHERE e.type = $emotion
			WITH DISTINCT p
			MATCH (u:User)-[:POSTED]->(p)
			OPTIONAL MATCH (e2:Emotion)-[tag:TAGGED]->(p)
			OPTIONAL MATCH (reactor:User)-[r:REACTED]->(p)
			OPTIONAL MATCH (replier:User)-[:REPLIED]->(reply:Reply)-[:REPLY_TO]->(p)
			RETURN 
				p.id AS postId,
				p.content AS content,
				u.id AS userId,
				p.createdAt AS createdAt,
				collect(DISTINCT {type: e2.type, score: tag.score}) AS emotions,
				collect(DISTINCT {type: r.type}) AS reactions,
				count(DISTINCT reply) AS replyCount
			ORDER BY p.createdAt DESC
		`
		params["emotion"] = emotionFilter
	} else {
		query = `
			MATCH (u:User)-[:POSTED]->(p:Post)
			OPTIONAL MATCH (e:Emotion)-[t:TAGGED]->(p)
			OPTIONAL MATCH (reactor:User)-[r:REACTED]->(p)
			OPTIONAL MATCH (replier:User)-[:REPLIED]->(reply:Reply)-[:REPLY_TO]->(p)
			RETURN 
				p.id AS postId,
				p.content AS content,
				u.id AS userId,
				p.createdAt AS createdAt,
				collect(DISTINCT {type: e.type, score: t.score}) AS emotions,
				collect(DISTINCT {type: r.type}) AS reactions,
				count(DISTINCT reply) AS replyCount
			ORDER BY p.createdAt DESC
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

			// emotionTags
			emotionsRaw := rec.Values[4].([]any)
			var emotions []EmotionTag
			for _, e := range emotionsRaw {
				if m, ok := e.(map[string]any); ok {
					emotions = append(emotions, EmotionTag{
						Type:  m["type"].(string),
						Score: m["score"].(float64),
					})
				}
			}

			// reactions
			reactionsRaw := rec.Values[5].([]any)
			reactionCounts := map[string]int{}
			for _, r := range reactionsRaw {
				if m, ok := r.(map[string]any); ok {
					if reactionType, ok := m["type"].(string); ok && reactionType != "" {
						reactionCounts[reactionType]++
					}
				}
			}

			// reply count
			replyCount := int(rec.Values[6].(int64))

			posts = append(posts, FeedPost{
				PostID:      rec.Values[0].(string),
				Content:     rec.Values[1].(string),
				UserID:      rec.Values[2].(string),
				CreatedAt:   rec.Values[3].(string),
				EmotionTags: emotions,
				Reactions:   reactionCounts,
				ReplyCount:  replyCount,
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

func (c *Neo4jClient) FollowUser(userId, targetUserId string) error {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(context.Background(), `
			MERGE (u1:User {id: $userId})
			MERGE (u2:User {id: $targetUserId})
			MERGE (u1)-[:FOLLOWS]->(u2)
		`, map[string]any{
			"userId":       userId,
			"targetUserId": targetUserId,
		})
		return nil, err
	})

	return err
}

func (c *Neo4jClient) GetPostContent(postId string) (string, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		rec, err := tx.Run(context.Background(), `
			MATCH (p:Post {id: $postId})
			RETURN p.content AS content
		`, map[string]any{"postId": postId})
		if err != nil {
			return nil, err
		}
		if !rec.Next(context.Background()) {
			return nil, nil // Not found
		}

		record := rec.Record()
		content, _ := record.Get("content")
		return content.(string), nil
	})
	if err != nil {
		return "", err
	}
	return result.(string), nil
}

func (c *Neo4jClient) GetInfluencedPostsLast24Hours(userId string) ([]InfluencedPost, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		records, err := tx.Run(context.Background(), `
			MATCH (u:User {id: $userId})-[i:INFLUENCED]->(p:Post)
			WHERE datetime() - duration('P1D') < datetime()
			RETURN p.id AS postId, p.content AS content
		`, map[string]any{"userId": userId})

		if err != nil {
			return nil, err
		}

		var posts []InfluencedPost
		for records.Next(context.Background()) {
			record := records.Record()
			postId, _ := record.Get("postId")
			content, _ := record.Get("content")

			posts = append(posts, InfluencedPost{
				PostID:  postId.(string),
				Content: content.(string),
			})
		}

		return posts, nil
	})

	if err != nil {
		return nil, err
	}

	return result.([]InfluencedPost), nil
}

func (c *Neo4jClient) AddSameTopicRelation(fromPostID, toPostID string) error {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(context.Background(), `
			MATCH (p1:Post {id: $fromPostID})
			MATCH (p2:Post {id: $toPostID})
			MERGE (p1)-[r:SAME_TOPIC]->(p2)
		`, map[string]any{
			"fromPostID": fromPostID,
			"toPostID":   toPostID,
		})
		return nil, err
	})

	return err
}

func (c *Neo4jClient) GetPostInfluence(postId string) (PostInfluence, error) {
	session := c.driver.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.ExecuteRead(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		records, err := tx.Run(context.Background(), `
			MATCH (p:Post {id: $postId})
			
			// 1次の影響：投稿に直接INFLUENCEDされたユーザー
			OPTIONAL MATCH (user1:User)-[i1:INFLUENCED]->(p)
			
			// 2次の影響：1次ユーザーの投稿で、元の投稿とSAME_TOPICの関係にある投稿にINFLUENCEDされたユーザー
			OPTIONAL MATCH (user1)-[:POSTED]->(p1:Post)-[:SAME_TOPIC]->(p), (user2:User)-[i2:INFLUENCED]->(p1)
			WHERE user2 <> user1
			
			// 3次の影響：2次ユーザーの投稿で、元の投稿とSAME_TOPICの関係にある投稿にINFLUENCEDされたユーザー
			OPTIONAL MATCH (user2)-[:POSTED]->(p2:Post)-[:SAME_TOPIC]->(p), (user3:User)-[i3:INFLUENCED]->(p2)
			WHERE user3 <> user2 AND user3 <> user1
			
			RETURN {
				firstDegree: collect(DISTINCT {userId: user1.id, type: i1.type}),
				secondDegree: collect(DISTINCT {userId: user2.id, type: i2.type, throughPostId: p1.id}),
				thirdDegree: collect(DISTINCT {userId: user3.id, type: i3.type, throughPostId: p2.id})
			} AS result
		`, map[string]any{"postId": postId})

		if err != nil {
			return nil, err
		}

		if !records.Next(context.Background()) {
			return PostInfluence{
				FirstDegree:  []InfluenceUser{},
				SecondDegree: []InfluenceUser{},
				ThirdDegree:  []InfluenceUser{},
			}, nil
		}

		record := records.Record()
		resultMap, _ := record.Get("result")

		influence := PostInfluence{
			FirstDegree:  []InfluenceUser{},
			SecondDegree: []InfluenceUser{},
			ThirdDegree:  []InfluenceUser{},
		}

		if resultMap, ok := resultMap.(map[string]any); ok {
			// Parse first degree
			if firstDegree, ok := resultMap["firstDegree"].([]any); ok {
				for _, item := range firstDegree {
					if m, ok := item.(map[string]any); ok {
						userId, _ := m["userId"].(string)
						influenceType, _ := m["type"].(string)

						if userId != "" && influenceType != "" {
							influence.FirstDegree = append(influence.FirstDegree, InfluenceUser{
								UserID: userId,
								Type:   influenceType,
							})
						}
					}
				}
			}

			// Parse second degree
			if secondDegree, ok := resultMap["secondDegree"].([]any); ok {
				for _, item := range secondDegree {
					if m, ok := item.(map[string]any); ok {
						userId, _ := m["userId"].(string)
						influenceType, _ := m["type"].(string)
						throughPostId, _ := m["throughPostId"].(string)

						if userId != "" && influenceType != "" {
							influence.SecondDegree = append(influence.SecondDegree, InfluenceUser{
								UserID:        userId,
								Type:          influenceType,
								ThroughPostID: throughPostId,
							})
						}
					}
				}
			}

			// Parse third degree
			if thirdDegree, ok := resultMap["thirdDegree"].([]any); ok {
				for _, item := range thirdDegree {
					if m, ok := item.(map[string]any); ok {
						userId, _ := m["userId"].(string)
						influenceType, _ := m["type"].(string)
						throughPostId, _ := m["throughPostId"].(string)

						if userId != "" && influenceType != "" {
							influence.ThirdDegree = append(influence.ThirdDegree, InfluenceUser{
								UserID:        userId,
								Type:          influenceType,
								ThroughPostID: throughPostId,
							})
						}
					}
				}
			}
		}

		return influence, nil
	})

	if err != nil {
		return PostInfluence{}, err
	}

	return result.(PostInfluence), nil
}
