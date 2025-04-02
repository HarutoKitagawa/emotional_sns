import { EmotionalImpact, Post, Reply, ReactionType } from '../../types/post';
import { createApiUrl, fetcher } from '../../lib/fetcher';

/**
 * Create a new post
 */
export const createPost = async (userId: string, content: string): Promise<Post> => {
  return fetcher<Post>(createApiUrl('/posts'), {
    method: 'POST',
    body: JSON.stringify({ userId, content }),
  });
};

/**
 * Get post by ID
 */
export const getPost = async (postId: string): Promise<Post> => {
  return fetcher<Post>(createApiUrl(`/posts/${postId}`));
};

/**
 * Get posts for feed
 */
export const getFeedPosts = async (): Promise<Post[]> => {
  // This endpoint is not in the API spec, but would be needed for a feed
  return fetcher<Post[]>(createApiUrl('/posts'));
};

/**
 * Get posts by user ID
 */
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  // This endpoint is not in the API spec, but would be needed for a profile
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
  return fetcher<void>(createApiUrl(`/posts/${postId}/reactions`), {
    method: 'POST',
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
  return fetcher<Reply>(createApiUrl(`/posts/${postId}/replies`), {
    method: 'POST',
    body: JSON.stringify({ userId, content }),
  });
};

/**
 * Get replies for a post
 */
export const getReplies = async (postId: string): Promise<Reply[]> => {
  // This endpoint is not in the API spec, but would be needed
  return fetcher<Reply[]>(createApiUrl(`/posts/${postId}/replies`));
};

/**
 * Get emotional impact for a post
 */
export const getEmotionalImpact = async (postId: string): Promise<EmotionalImpact> => {
  return fetcher<EmotionalImpact>(createApiUrl(`/posts/${postId}/impact`));
};
