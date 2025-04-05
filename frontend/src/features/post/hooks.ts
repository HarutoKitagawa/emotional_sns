"use client";
import { useState } from 'react';
import useSWR from 'swr';
import { createApiUrl } from '../../lib/fetcher';
import { useAuth } from '../auth/hooks';
import { EmotionalImpact, Post, PostInfluence, Reply, ReactionType } from '../../types/post';
import {
  addReaction,
  addReply,
  createPost,
  getEmotionalImpact,
  getPostInfluence,
  getReplies,
  getFeedPosts,
  getPostDetail,
  getPost,
  getEmotionTags
} from '../../lib/api';

/**
 * Hook for fetching a post by ID
 */
export const usePost = (postId: string) => {
  console.log("Fetching post detail for ID:", postId);
  return useSWR<Post>(`/api/posts/${postId}`, () => getPost(postId))
};

/**
 * Hook for fetching feed posts
 */
export const useFeedPosts = () => {
  const { user } = useAuth();

  return useSWR<Post[]>(user ? `/api/users/${user.id}/feed` : null, async (url: string) => {
    try {
      console.log("Starting fetch for feed posts");
      const response = await fetch(url);
      
      console.log("Feed API response status:", response.status);
      
      if (!response.ok) {
        console.error("Feed API error:", response.status, response.statusText);
        throw new Error(`Failed to fetch feed posts: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Log the data to help debug
      console.log("Feed data received type:", typeof data);
      console.log("Feed data is array:", Array.isArray(data));
      if (typeof data === 'object' && data !== null) {
        console.log("Feed data keys:", Object.keys(data));
        
        if (Array.isArray(data)) {
          console.log("Feed data array length:", data.length);
        } else if (data.posts) {
          console.log("Feed data.posts is array:", Array.isArray(data.posts));
          if (Array.isArray(data.posts)) {
            console.log("Feed data.posts length:", data.posts.length);
            if (data.posts.length > 0) {
              console.log("First post sample:", JSON.stringify(data.posts[0]));
            }
          }
        }
      }
      
      // Handle different response formats
      let posts: Post[] = [];
      
      if (Array.isArray(data)) {
        console.log("Processing data as array");
        posts = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.posts)) {
        console.log("Processing data.posts as array");
        posts = data.posts;
      } else {
        console.error("Unexpected data format:", JSON.stringify(data));
        return [];
      }
      
      console.log("Posts extracted, count:", posts.length);
      
      // Map backend data structure to frontend expected structure
      const postsWithCorrectStructure = posts.map((post: any, index) => {
        // Map postId to id if it exists
        if (post.postId && !post.id) {
          console.log(`Mapping postId to id for post at index ${index}`);
          
          // Create a new post object with the correct structure
          const mappedPost: Post = {
            id: post.postId,
            userId: post.userId,
            content: post.content,
            createdAt: post.createdAt,
            emotionTags: Array.isArray(post.emotionTags) 
              ? post.emotionTags.map((tag: any) => ({
                  type: tag.emotion || tag.type,
                  score: tag.score
                }))
              : [],
            reactionCounts: post.reactions || {
              like: 0,
              love: 0,
              cry: 0,
              angry: 0,
              wow: 0
            },
            replyCount: post.replyCount || 0
          };
          
          return mappedPost;
        } else if (!post.id) {
          // If neither postId nor id exists, generate a temporary ID
          console.warn(`Post at index ${index} has no ID, generating temporary ID`);
          return {
            ...post,
            id: `temp-${index}`,
            reactionCounts: post.reactions || {
              like: 0,
              love: 0,
              cry: 0,
              angry: 0,
              wow: 0
            }
          };
        }
        
        // If post already has id, ensure it has the correct structure
        return {
          ...post,
          reactionCounts: post.reactions || post.reactionCounts || {
            like: 0,
            love: 0,
            cry: 0,
            angry: 0,
            wow: 0
          }
        };
      });
      
      // Check for duplicate IDs
      const ids = postsWithCorrectStructure.map((post: Post) => post.id);
      const hasDuplicates = ids.some((id: string, index: number) => ids.indexOf(id) !== index);
      
      if (hasDuplicates) {
        console.warn("Duplicate post IDs detected:", ids);
        
        // Create a map to count occurrences of each ID
        const idCounts = ids.reduce((acc: Record<string, number>, id: string) => {
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Log the duplicate IDs
        Object.entries(idCounts)
          .filter(([_, count]) => (count as number) > 1)
          .forEach(([id, count]) => {
            console.warn(`ID ${id} appears ${count} times`);
          });
          
        // Make IDs unique by appending index for duplicates
        const seenIds = new Set<string>();
        const trulyUniqueIds = postsWithCorrectStructure.map((post: Post, index: number) => {
          if (seenIds.has(post.id)) {
            const newId = `${post.id}-${index}`;
            console.log(`Changing duplicate ID ${post.id} to ${newId}`);
            return { ...post, id: newId };
          } else {
            seenIds.add(post.id);
            return post;
          }
        });
        
        return trulyUniqueIds;
      }
      
      console.log("Returning posts with unique IDs, count:", postsWithCorrectStructure.length);
      return postsWithCorrectStructure;
    } catch (error) {
      console.error("Error in useFeedPosts:", error);
      throw error;
    }
  });
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
  return useSWR<Reply[]>(
    postId ? `/api/posts/${postId}/replies` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch replies');
      const data = await res.json();
      return data.replies; // ← Goバックエンド準拠
    }
  );
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
 * Hook for fetching post influence
 */
export const usePostInfluence = (postId: string) => {
  return useSWR<PostInfluence>(
    postId ? `/posts/${postId}/influence` : null,
    () => getPostInfluence(postId)
  );
};

/**
 * Hook for creating a new post
 */
export const useCreatePost = () => {
  console.log("Creating post");
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
  const { mutate } = useFeedPosts();

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

/**
 * Hook for fetching all available emotion tags
 */
export const useEmotionTags = () => {
  return useSWR<string[]>('/api/emotion-tags', async () => {
    try {
      console.log('Fetching emotion tags in hook');
      const tags = await getEmotionTags();
      console.log('Emotion tags fetched in hook:', tags);
      return tags;
    } catch (error) {
      console.error('Error fetching emotion tags in hook:', error);
      throw error;
    }
  });
};
