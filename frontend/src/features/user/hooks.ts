"use client";
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { createApiUrl } from '../../lib/fetcher';
import { User, UserSession } from '../../types/user';
import {
  followUser,
  getCurrentUser,
  unfollowUser,
  updateUserProfile,
} from './api';

/**
 * Hook for fetching a user by ID
 */
export const useUser = (userId: string) => {
  return useSWR<User>(userId ? createApiUrl(`/users/${userId}`) : null);
};

/**
 * Hook for fetching user followers
 */
export const useUserFollowers = (userId: string) => {
  return useSWR<User[]>(
    userId ? createApiUrl(`/users/${userId}/followers`) : null
  );
};

/**
 * Hook for fetching users that a user is following
 */
export const useUserFollowing = (userId: string) => {
  return useSWR<User[]>(
    userId ? createApiUrl(`/users/${userId}/following`) : null
  );
};

/**
 * Hook for managing user session
 */
export const useUserSession = (): UserSession => {
  const { data, error, isLoading } = useSWR<User>(
    createApiUrl('/users/me'),
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
  const { data: currentUser } = useSWR<User>(createApiUrl('/users/me'));
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
