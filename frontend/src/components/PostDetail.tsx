'use client';
import { User } from '../types/user';
import { Post, ReactionType } from '../types/post';
import UserAvatar from './UserAvatar';
import { formatDate, getDominantEmotion, getEmotionColor } from '../lib/utils';
import { usePost, useAddReaction } from '../features/post/hooks';

interface PostDetailProps {
  postId: string;
}

export default function PostDetail({ postId }: PostDetailProps) {
  // Use real data from hooks
  const { data: post, error, isLoading } = usePost(postId);
  //const { data: postUser } = useUser(post?.userId || '');
  const { addReaction, isLoading: isReacting } = useAddReaction(postId,"1");
  console.log("postId", postId);
  
  if (isLoading || !post) {
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

  // Use real data only
  const currentPost = post;
  const currentUser = postUser;
  
  const dominantEmotion = getDominantEmotion(currentPost.emotionTags || []);
  const emotionColor = getEmotionColor(dominantEmotion);
  
  const handleReaction = async (type: ReactionType) => {
    if (isReacting) return;
    await addReaction(currentUser.id, type);
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        投稿の読み込み中にエラーが発生しました。再度お試しください。
      </div>
    );
  }

  const reactionButtons = [
    { type: 'like' as ReactionType, emoji: '👍' },
    { type: 'love' as ReactionType, emoji: '❤️' },
    { type: 'cry' as ReactionType, emoji: '😢' },
    { type: 'angry' as ReactionType, emoji: '😡' },
    { type: 'wow' as ReactionType, emoji: '😮' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start space-x-3 mb-4">
        <UserAvatar user={currentUser} size="lg" showName />
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-sm text-gray-500">
            {formatDate(currentPost.createdAt)}
          </div>
        </div>
      </div>
      
      <div className="mb-4 whitespace-pre-line text-lg">
        {currentPost.content}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {currentPost.emotionTags.map((tag: { type: string; score: number }) => (
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
                currentPost.reactionCounts[button.type] > 0
                  ? 'bg-blue-50 text-blue-500 dark:bg-blue-900 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{button.emoji}</span>
              <span>{currentPost.reactionCounts[button.type]}</span>
            </button>
          ))}
        </div>
        
        <div className="text-sm text-gray-500">
          {currentPost.replyCount > 0 && `${currentPost.replyCount}件の返信`}
        </div>
      </div>
    </div>
  );
}
