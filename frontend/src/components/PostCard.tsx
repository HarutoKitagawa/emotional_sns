'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Post, ReactionType } from '../types/post';
import { User } from '../types/user';
import UserAvatar from './UserAvatar';
import { formatDate, getDominantEmotion, getEmotionColor, truncateText } from '../lib/utils';
import { useAddReaction } from '../features/post/hooks';

interface PostCardProps {
  post: Post;
  user: User;
  preview?: boolean;
}

export default function PostCard({ post, user, preview = false }: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const { addReaction, isLoading: isReacting } = useAddReaction(post.id);
  
  const dominantEmotion = getDominantEmotion(post.emotionTags);
  const emotionColor = getEmotionColor(dominantEmotion);
  
  const content = preview && !showFullContent 
    ? truncateText(post.content, 150) 
    : post.content;
  
  const handleReaction = async (type: ReactionType) => {
    if (isReacting) return;
    await addReaction(user.id, type);
  };
  
  const reactionButtons: { type: ReactionType; emoji: string }[] = [
    { type: 'like', emoji: '👍' },
    { type: 'love', emoji: '❤️' },
    { type: 'cry', emoji: '😢' },
    { type: 'angry', emoji: '😡' },
    { type: 'wow', emoji: '😮' },
  ];

  return (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
    <div className="flex items-start space-x-3">
      <UserAvatar user={user} showName />
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-500">
            {formatDate(post.createdAt)}
          </span>
          
          {dominantEmotion && (
            <span 
              className="text-xs px-2 py-1 rounded-full" 
              style={{ 
                backgroundColor: `${emotionColor}20`, 
                color: emotionColor 
              }}
            >
              {dominantEmotion}
            </span>
          )}
        </div>
        
        <div className="mb-3 whitespace-pre-line">
          {content}
          {preview && post.content.length > 150 && !showFullContent && (
            <button 
              onClick={() => setShowFullContent(true)}
              className="text-blue-500 hover:underline ml-1"
            >
              もっと見る
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-4">
          <div className="flex space-x-2">
            {reactionButtons.map((button) => (
              <button
                key={button.type}
                onClick={() => handleReaction(button.type)}
                disabled={isReacting}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${
                  post.reactionCounts[button.type] > 0
                    ? 'bg-blue-50 text-blue-500 dark:bg-blue-900 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{button.emoji}</span>
                {post.reactionCounts[button.type] > 0 && (
                  <span>{post.reactionCounts[button.type]}</span>
                )}
              </button>
            ))}
          </div>
          
          {preview ? (
            <Link
              href={`/post/${post.id}`}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {post.replyCount > 0 ? `${post.replyCount}件の返信` : '返信する'}
            </Link>
          ) : (
            <div className="text-sm text-gray-500">
              {post.replyCount > 0 && `${post.replyCount}件の返信`}
            </div>
          )}
        </div> {/* ← これを閉じ忘れてたっぽい！ */}
      </div>
    </div>
  </div>
  );
}
