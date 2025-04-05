"use client";
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { createApiUrl } from '../../lib/fetcher';
import { User, UserSession } from '../../types/user';
import { Post } from '../../types/post';
import { useAuth } from '../auth/hooks';
import {
  followUser,
  getCurrentUser,
  unfollowUser,
  updateUserProfile,
  getUser,
  getUserFollowers,
  getUserFollowing,
} from '../../lib/api';

/**
 * Hook for fetching a user by ID
 */
export const useUser = (userId: string) => {
  // Use Next.js API route instead of direct backend URL
  const url = userId ? `/api/users/${userId}` : null;
  console.log("Fetching user data:", url);
  
  return useSWR<User>(url, async (url: string) => {
    try {
      console.log("Starting fetch for user data");
      const response = await fetch(url);
      
      console.log("User API response status:", response.status);
      
      if (!response.ok) {
        console.error("User API error:", response.status, response.statusText);
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("User data received:", data);
      
      return data;
    } catch (error) {
      console.error("Error in useUser:", error);
      throw error;
    }
  });
};

/**
 * Hook for fetching user followers
 */
export const useUserFollowers = (userId: string) => {
  return useSWR<User[]>(
    userId ? `/api/users/${userId}/followers` : null,
    async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch followers: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error("Error in useUserFollowers:", error);
        throw error;
      }
    }
  );
};

/**
 * Hook for fetching users that a user is following
 */
export const useUserFollowing = (userId: string) => {
  return useSWR<User[]>(
    userId ? `/api/users/${userId}/following` : null,
    async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch following: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error("Error in useUserFollowing:", error);
        throw error;
      }
    }
  );
};

/**
 * Hook for fetching user posts
 */
export const useUserPosts = (userId: string) => {
  return useSWR<Post[]>(
    userId ? `/api/users/${userId}/posts` : null,
    async (url: string) => {
      try {
        console.log("Starting fetch for user posts");
        const response = await fetch(url);
        
        console.log("User posts API response status:", response.status);
        
        if (!response.ok) {
          console.error("User posts API error:", response.status, response.statusText);
          throw new Error(`Failed to fetch user posts: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("User posts data received:", data);
        
        // Handle different response formats
        if (data && data.posts && Array.isArray(data.posts)) {
          return data.posts.map((post: any) => ({
            id: post.postId || post.id,
            userId: post.userId,
            content: post.content,
            createdAt: post.createdAt,
            emotionTags: Array.isArray(post.emotionTags) 
              ? post.emotionTags.map((tag: any) => ({
                  type: tag.emotion || tag.type,
                  score: tag.score
                }))
              : [],
            reactionCounts: post.reactions || post.reactionCounts || {
              like: 0,
              love: 0,
              cry: 0,
              angry: 0,
              wow: 0
            },
            replyCount: post.replyCount || 0
          }));
        }
        
        return [];
      } catch (error) {
        console.error("Error in useUserPosts:", error);
        throw error;
      }
    }
  );
};

/**
 * Hook for managing user session
 */
export const useUserSession = (): UserSession => {
  const { data, error, isLoading } = useSWR<User>(
    '/api/users/me',
    async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch current user: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error("Error in useUserSession:", error);
        throw error;
      }
    },
    {
      // Don't revalidate on focus to avoid unnecessary requests
      revalidateOnFocus: false,
      // Keep data even when an error occurs
      keepPreviousData: true,
    }
  );

  return {
    user: data || null,
    isLoggedIn: !!data,
    isLoading,
  };
};

/**
 * Hook for following/unfollowing a user
 */
export const useFollowUser = (targetUserId: string) => {
  // Use useAuth instead of direct SWR call to /users/me
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Check if the current user is following the target user
  const { data: following, mutate: mutateFollowing } = useUserFollowing(
    currentUser?.id || ''
  );
  
  useEffect(() => {
    if (following && targetUserId) {
      setIsFollowing(
        following.some((user) => user.id === targetUserId)
      );
    }
  }, [following, targetUserId]);

  const handleFollow = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await followUser(currentUser.id, targetUserId);
      setIsFollowing(true);
      mutateFollowing();
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await unfollowUser(currentUser.id, targetUserId);
      setIsFollowing(false);
      mutateFollowing();
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    isFollowing,
    follow: handleFollow,
    unfollow: handleUnfollow,
    isLoading,
    error,
  };
};

/**
 * Hook for updating user profile
 */
export const useUpdateProfile = (userId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { mutate } = useUser(userId);

  const handleUpdateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await updateUserProfile(userId, data);
      mutate(updatedUser);
      setIsLoading(false);
      return updatedUser;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    updateProfile: handleUpdateProfile,
    isLoading,
    error,
  };
};
