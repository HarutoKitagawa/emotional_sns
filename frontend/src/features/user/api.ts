import { User } from '../../types/user';
import { createApiUrl, fetcher } from '../../lib/fetcher';

/**
 * Get user by ID
 */
export const getUser = async (userId: string): Promise<User> => {
  return fetcher<User>(createApiUrl(`/users/${userId}`));
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
  return fetcher<void>(createApiUrl(`/users/${userId}/following`), {
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
  return fetcher<void>(createApiUrl(`/users/${userId}/following/${targetUserId}`), {
    method: 'DELETE',
  });
};

/**
 * Get user followers
 */
export const getUserFollowers = async (userId: string): Promise<User[]> => {
  return fetcher<User[]>(createApiUrl(`/users/${userId}/followers`));
};

/**
 * Get users that a user is following
 */
export const getUserFollowing = async (userId: string): Promise<User[]> => {
  return fetcher<User[]>(createApiUrl(`/users/${userId}/following`));
};
