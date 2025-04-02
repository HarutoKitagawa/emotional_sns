'use client';

import { useState } from 'react';
import { User } from '../types/user';
import { Post } from '../types/post';
import PostCard from './PostCard';
import UserList from './UserList';
import EmotionalProfileChart from './EmotionalProfileChart';
import { useUserPosts } from '../features/post/hooks';
import { useUserFollowers, useUserFollowing } from '../features/user/hooks';

// Mock data for demonstration purposes
const MOCK_USER: User = {
  id: 'user1',
  username: 'yamada_taro',
  displayName: '山田太郎',
  avatarUrl: 'https://i.pravatar.cc/150?img=1',
  followersCount: 120,
  followingCount: 85,
  emotionalProfile: {
    dominantEmotions: ['joy', 'surprise'],
    emotionalRange: 75,
  },
};

const MOCK_POSTS: Post[] = [
  {
    id: 'post1',
    userId: 'user1',
    content: '今日は天気が良くて気分も最高！公園でピクニックをしてきました。自然の中で過ごす時間は本当に癒されますね。',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    emotionTags: [
      { type: 'joy', score: 0.8 },
      { type: 'surprise', score: 0.3 },
    ],
    reactionCounts: {
      like: 15,
      love: 7,
      cry: 0,
      angry: 0,
      wow: 3,
    },
    replyCount: 5,
  },
  {
    id: 'post3',
    userId: 'user1',
    content: '新しいカフェを見つけました！コーヒーが本当に美味しくて、店内の雰囲気も素敵です。東京の渋谷にあるので、近くに行く機会があればぜひ寄ってみてください。',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    emotionTags: [
      { type: 'joy', score: 0.7 },
      { type: 'surprise', score: 0.5 },
    ],
    reactionCounts: {
      like: 23,
      love: 12,
      cry: 0,
      angry: 0,
      wow: 5,
    },
    replyCount: 8,
  },
];

const MOCK_FOLLOWERS: User[] = [
  {
    id: 'user2',
    username: 'tanaka_hanako',
    displayName: '田中花子',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    followersCount: 350,
    followingCount: 210,
  },
  {
    id: 'user3',
    username: 'suzuki_ichiro',
    displayName: '鈴木一郎',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    followersCount: 78,
    followingCount: 42,
  },
];

const MOCK_FOLLOWING: User[] = [
  {
    id: 'user4',
    username: 'sato_yuki',
    displayName: '佐藤ゆき',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    followersCount: 230,
    followingCount: 115,
  },
];

interface ProfileTabsProps {
  userId: string;
}

type TabType = 'posts' | 'followers' | 'following' | 'emotional';

export default function ProfileTabs({ userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  
  // In a real app, we would use these hooks
  // const { data: posts, error: postsError, isLoading: postsLoading } = useUserPosts(userId);
  // const { data: followers, error: followersError, isLoading: followersLoading } = useUserFollowers(userId);
  // const { data: following, error: followingError, isLoading: followingLoading } = useUserFollowing(userId);
  
  // For now, we'll use mock data
  const posts = MOCK_POSTS;
  const followers = MOCK_FOLLOWERS;
  const following = MOCK_FOLLOWING;
  const postsLoading = false;
  const followersLoading = false;
  const followingLoading = false;
  
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
            {postsLoading ? (
              <div className="text-center py-4">読み込み中...</div>
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={MOCK_USER}
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
