import { useState } from 'react';
import useSWR from 'swr';
import { createApiUrl } from '../../lib/fetcher';
import { EmotionalImpact, Post, Reply, ReactionType } from '../../types/post';
import {
  addReaction,
  addReply,
  createPost,
  getEmotionalImpact,
  getReplies,
} from './api';

/**
 * Hook for fetching a post by ID
 */
export const usePost = (postId: string) => {
  return useSWR<Post>(postId ? createApiUrl(`/posts/${postId}`) : null);
};

/**
 * Hook for fetching feed posts
 */
export const useFeedPosts = () => {
  return useSWR<Post[]>(createApiUrl('/posts'));
};

/**
 * Hook for fetching user posts
 */
export const useUserPosts = (userId: string) => {
  return useSWR<Post[]>(userId ? createApiUrl(`/users/${userId}/posts`) : null);
};

/**
 * Hook for fetching post replies
 */
export const usePostReplies = (postId: string) => {
  return useSWR<Reply[]>(postId ? createApiUrl(`/posts/${postId}/replies`) : null);
};

/**
 * Hook for fetching emotional impact
 */
export const useEmotionalImpact = (postId: string) => {
  return useSWR<EmotionalImpact>(
    postId ? createApiUrl(`/posts/${postId}/impact`) : null
  );
};

/**
 * Hook for creating a new post
 */
export const useCreatePost = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCreatePost = async (userId: string, content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const post = await createPost(userId, content);
      setIsLoading(false);
      return post;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    createPost: handleCreatePost,
    isLoading,
    error,
  };
};

/**
 * Hook for adding a reaction to a post
 */
export const useAddReaction = (postId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { mutate } = usePost(postId);

  const handleAddReaction = async (userId: string, type: ReactionType) => {
    setIsLoading(true);
    setError(null);
    try {
      await addReaction(postId, userId, type);
      // Optimistically update the post data
      mutate();
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    addReaction: handleAddReaction,
    isLoading,
    error,
  };
};

/**
 * Hook for adding a reply to a post
 */
export const useAddReply = (postId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { mutate: mutatePost } = usePost(postId);
  const { mutate: mutateReplies } = usePostReplies(postId);

  const handleAddReply = async (userId: string, content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const reply = await addReply(postId, userId, content);
      // Optimistically update the post and replies data
      mutatePost();
      mutateReplies();
      setIsLoading(false);
      return reply;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    addReply: handleAddReply,
    isLoading,
    error,
  };
};
