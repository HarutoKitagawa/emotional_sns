'use client';

import { useState } from 'react';
import { User } from '../types/user';
import { Post } from '../types/post';
import PostCard from './PostCard';
import UserList from './UserList';
import EmotionalProfileChart from './EmotionalProfileChart';
import { useUserPosts } from '../features/user/hooks';
import { useUserFollowers, useUserFollowing, useUser } from '../features/user/hooks';

interface ProfileTabsProps {
  userId: string;
}

type TabType = 'posts' | 'followers' | 'following' | 'emotional';

export default function ProfileTabs({ userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  
  const { data: user } = useUser(userId);
  const { data: posts, error: postsError, isLoading: postsLoading } = useUserPosts(userId);
  const { data: followers, error: followersError, isLoading: followersLoading } = useUserFollowers(userId);
  const { data: following, error: followingError, isLoading: followingLoading } = useUserFollowing(userId);
  
  const tabs: { id: TabType; label: string }[] = [
    { id: 'posts', label: '投稿' },
    { id: 'followers', label: 'フォロワー' },
    { id: 'following', label: 'フォロー中' },
    { id: 'emotional', label: '感情プロフィール' },
  ];
  
  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div>
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {postsLoading || !user ? (
              <div className="text-center py-4">読み込み中...</div>
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  preview={true}
                />
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">投稿がありません。</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'followers' && (
          <div>
            {followersLoading ? (
              <div className="text-center py-4">読み込み中...</div>
            ) : followers && followers.length > 0 ? (
              <UserList users={followers} />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">フォロワーがいません。</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'following' && (
          <div>
            {followingLoading ? (
              <div className="text-center py-4">読み込み中...</div>
            ) : following && following.length > 0 ? (
              <UserList users={following} />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">フォローしているユーザーがいません。</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'emotional' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <EmotionalProfileChart userId={userId} />
          </div>
        )}
      </div>
    </div>
  );
}
