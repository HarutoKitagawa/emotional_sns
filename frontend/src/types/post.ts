export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust';

export type ReactionType = 'like' | 'love' | 'cry' | 'angry' | 'wow';

export interface EmotionTag {
  type: string;
  score: number;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  emotionTags: EmotionTag[];
  reactionCounts: Record<ReactionType, number>;
  replyCount: number;
}

export interface Reply extends Omit<Post, 'replyCount'> {
  parentId: string;
}

export interface EmotionalImpact {
  reachedUsers: number;
  joyCount: number;
  sadnessCount: number;
  spreadDepth: number;
}
