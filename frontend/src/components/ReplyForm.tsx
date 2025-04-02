"use client";

import { useState } from 'react';
import { useUserSession } from '../features/user/hooks';
import { useAddReply } from '../features/post/hooks';
import UserAvatar from './UserAvatar';

// Mock user for demonstration purposes
const MOCK_USER = {
  id: 'current-user',
  username: 'current_user',
  displayName: 'ログインユーザー',
  avatarUrl: 'https://i.pravatar.cc/150?img=3',
  followersCount: 45,
  followingCount: 102,
};

interface ReplyFormProps {
  postId: string;
}

export default function ReplyForm({ postId }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // In a real app, we would use these hooks
  // const { user, isLoggedIn } = useUserSession();
  // const { addReply, isLoading, error } = useAddReply(postId);
  
  // For now, we'll use mock data
  const user = MOCK_USER;
  const isLoggedIn = true;
  const isLoading = false;
  const error = null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !isLoggedIn || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, we would call this
      // await addReply(user.id, content);
      console.log(`Added reply to post ${postId}: ${content}`);
      setContent('');
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isLoggedIn) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
        <p className="text-blue-600 dark:text-blue-400 mb-2">返信するにはログインが必要です</p>
        <a 
          href="/login" 
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          ログイン
        </a>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-start space-x-3">
        <UserAvatar user={user} size="sm" linkToProfile={false} />
        
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="返信を入力..."
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          
          {error && (
            <p className="mt-2 text-red-500 text-sm">
              返信の送信中にエラーが発生しました。再度お試しください。
            </p>
          )}
          
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '送信中...' : '返信する'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
