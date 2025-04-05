// PostWithUser.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks';
import PostCard from './PostCard';
import { Post } from '../types/post';
import { User } from '../types/user';

export default function PostWithUser({ post }: { post: Post }) {
  const { user } = useAuth();
  
  // If there's an error or the loading timeout has been reached, use a fallback user
  if (!user) {
    console.log(`Using fallback user for post ${post.id}`);
    
    // Create a fallback user with the user ID from the post
    const fallbackUser: User = {
      id: post.userId,
      username: `User ${post.userId}`,
      displayName: `User ${post.userId}`,
      avatarUrl: '',
      bio: '',
      followersCount: 0,
      followingCount: 0,
      emotionalProfile: {
        dominantEmotions: [],
        emotionalRange: 0,
      },
    };
    
    return <PostCard post={post} user={fallbackUser} preview />;
  }
  
  // Show loading state if still loading and timeout hasn't been reached
  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return <PostCard post={post} user={user!} preview />;
}
