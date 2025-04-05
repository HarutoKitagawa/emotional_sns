'use client';
import { User } from '../types/user';
import { Post } from '../types/post';
import UserAvatar from './UserAvatar';
import { formatDate, getDominantEmotion, getEmotionColor } from '../lib/utils';
import { usePost, useAddReaction } from '../features/post/hooks';

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

const MOCK_POST: Post = {
  id: 'post1',
  userId: 'user1',
  content: '今日は天気が良くて気分も最高！公園でピクニックをしてきました。自然の中で過ごす時間は本当に癒されますね。皆さんも休日は外に出かけてみてはいかがでしょうか？\n\n写真は公園で撮った桜の木です。もう満開で、とても綺麗でした。来週末まで見頃だそうです。',
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
};

interface PostDetailProps {
  postId: string;
}

export default function PostDetail({ postId }: PostDetailProps) {
  // In a real app, we would use these hooks
  // const { data: post, error, isLoading } = usePost(postId);
  // const { data: postUser } = useUser(post?.userId || '');
  // const { addReaction, isLoading: isReacting } = useAddReaction(postId);
  
  // For now, we'll use mock data
  const post = MOCK_POST;
  const postUser = MOCK_USER;
  const isLoading = false;
  const error = null;
  const isReacting = false;
  
  const dominantEmotion = getDominantEmotion(post?.emotionTags || []);
  const emotionColor = getEmotionColor(dominantEmotion);
  
  const handleReaction = async (type: 'like' | 'love' | 'cry' | 'angry' | 'wow') => {
    // In a real app, we would call this
    // if (isReacting) return;
    // await addReaction(currentUser.id, type);
    console.log(`Added reaction: ${type}`);
  };
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        投稿の読み込み中にエラーが発生しました。再度お試しください。
      </div>
    );
  }

  const reactionButtons = [
    { type: 'like' as const, emoji: '👍' },
    { type: 'love' as const, emoji: '❤️' },
    { type: 'cry' as const, emoji: '😢' },
    { type: 'angry' as const, emoji: '😡' },
    { type: 'wow' as const, emoji: '😮' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start space-x-3 mb-4">
        <UserAvatar user={postUser} size="lg" showName />
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-sm text-gray-500">
            {formatDate(post.createdAt)}
          </div>
        </div>
      </div>
      
      <div className="mb-4 whitespace-pre-line text-lg">
        {post.content}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {post.emotionTags.map((tag) => (
          <span 
            key={tag.type}
            className="text-sm px-3 py-1 rounded-full" 
            style={{ 
              backgroundColor: `${getEmotionColor(tag.type as any)}20`, 
              color: getEmotionColor(tag.type as any) 
            }}
          >
            {tag.type} ({Math.round(tag.score * 100)}%)
          </span>
        ))}
      </div>
      
      <div className="flex flex-wrap items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex space-x-2">
          {reactionButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => handleReaction(button.type)}
              disabled={isReacting}
              className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm ${
                post.reactionCounts[button.type] > 0
                  ? 'bg-blue-50 text-blue-500 dark:bg-blue-900 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{button.emoji}</span>
              <span>{post.reactionCounts[button.type]}</span>
            </button>
          ))}
        </div>
        
        <div className="text-sm text-gray-500">
          {post.replyCount > 0 && `${post.replyCount}件の返信`}
        </div>
      </div>
    </div>
  );
}
