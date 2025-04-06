import { EmotionalImpact, Post, PostInfluence, Reply, ReactionType } from '../types/post';
import { User } from '../types/user';
import { createApiUrl, fetcher } from './fetcher';

/**
 * ===== Post API =====
 */

/**
 * Create a new post
 */
export const createPost = async (userId: string, content: string): Promise<Post> => {
  return fetcher<Post>('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ userId, content }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Get post by ID
 */
export const getPost = async (postId: string): Promise<Post> => {
  console.log('Fetchingggggggggggggggg post:', postId);
  return fetcher<Post>(`/api/posts/${postId}`);
};

/**
 * Get post detail by ID
 */
export const getPostDetail = async (postId: string): Promise<Post> => {
  return getPost(postId); // ← これしかしてないなら削除してOK
};


/**
 * Get posts for feed
 */
export const getFeedPosts = async (userId: string): Promise<Post[]> => {
  return fetcher<Post[]>(`/api/users/${userId}/feed`);
};

/**
 * Get posts by user ID
 */
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  return fetcher<Post[]>(createApiUrl(`/users/${userId}/posts`));
};

/**
 * Add reaction to a post
 */
export const addReaction = async (
  postId: string,
  userId: string,
  type: ReactionType
): Promise<void> => {
  return fetcher<void>(`/api/posts/${postId}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, type }),
  });
};

/**
 * Add reply to a post
 */
export const addReply = async (
  postId: string,
  userId: string,
  content: string
): Promise<Reply> => {
  return fetcher<Reply>(`/api//posts/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ userId, content }),
  });
};

/**
 * Get replies for a post
 */
export const getReplies = async (postId: string): Promise<Reply[]> => {
  return fetcher<Reply[]>(createApiUrl(`/posts/${postId}/replies`));
};

/**
 * Get emotional impact for a post
 */
export const getEmotionalImpact = async (postId: string): Promise<EmotionalImpact> => {
  return fetcher<EmotionalImpact>(createApiUrl(`/posts/${postId}/impact`));
};

/**
 * Get post influence data
 */
export const getPostInfluence = async (postId: string): Promise<PostInfluence> => {
  return fetcher<PostInfluence>(`/api/posts/${postId}/influence`);
};

/**
 * ===== User API =====
 */

/**
 * Get user by ID
 */
export const getUser = async (userId: string): Promise<User> => {
  return fetcher<User>(`/api/users/${userId}`);
};

/**
 * Get current user (from session)
 */
export const getCurrentUser = async (): Promise<User> => {
  return fetcher<User>(createApiUrl('/users/me'));
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: Partial<User>
): Promise<User> => {
  return fetcher<User>(createApiUrl(`/users/${userId}`), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Follow a user
 */
export const followUser = async (
  userId: string,
  targetUserId: string
): Promise<void> => {
  return fetcher<void>(`/api/users/${userId}/following`, {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (
  userId: string,
  targetUserId: string
): Promise<void> => {
  return fetcher<void>(`/api/users/${userId}/following/${targetUserId}`, {
    method: 'DELETE',
  });
};

/**
 * Get user followers
 */
export const getUserFollowers = async (userId: string): Promise<User[]> => {
  return fetcher<User[]>(`/api/users/${userId}/followers`);
};

/**
 * Get users that a user is following
 */
export const getUserFollowing = async (userId: string): Promise<User[]> => {
  return fetcher<User[]>(`/api/users/${userId}/following`);
};

/**
 * ===== Emotion Tags API =====
 */

/**
 * Get all available emotion tags
 */
export const getEmotionTags = async (): Promise<string[]> => {
  console.log('Fetching emotion tags');
  try {
    const tags = await fetcher<string[]>('/api/emotion-tags');
    console.log('Emotion tags fetched:', tags);
    return tags;
  } catch (error) {
    console.error('Error fetching emotion tags:', error);
    throw error;
  }
};
