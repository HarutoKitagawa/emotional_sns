package graphdb

import (
	"context"

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
