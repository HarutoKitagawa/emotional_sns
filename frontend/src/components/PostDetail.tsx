'use client';
import { useState, useEffect } from 'react';
import { ReactionType } from '../types/post';
import UserAvatar from './UserAvatar';
import { formatDate, getDominantEmotion, getEmotionColor } from '../lib/utils';
import { usePost, useAddReaction } from '../features/post/hooks';
import { useUser } from '@/features/user/hooks';
// 例：useAuthフックから現在ログインしているユーザー情報を取得
import { useAuth } from '@/features/auth/hooks';

interface PostDetailProps {
  postId: string;
}

export default function PostDetail({ postId }: PostDetailProps) {
  const { data: post, error, isLoading } = usePost(postId);
  const { data: postUser } = useUser(post?.userId || '');

  // -------------------------------------
  // ログインユーザーを取得
  // -------------------------------------
  const { user: loginUser } = useAuth();

  const { addReaction, isLoading: isReacting } = useAddReaction(postId, '1');
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);
  const [emotionColor, setEmotionColor] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      const emotion = getDominantEmotion(post.emotionTags);
      setDominantEmotion(emotion);
      const color = getEmotionColor(emotion);
      setEmotionColor(color);
    }
  }, [post]);

  // 投稿者とログインユーザーが同じかどうか判定
  const isOwner = postUser?.id === loginUser?.id;

  const handleReaction = async (type: ReactionType) => {
    if (isReacting) return;
    // ボタン押下時に、投稿ユーザーではなく「ログインユーザーのID」として渡す場合は以下でOK
    await addReaction(loginUser!.id, type);
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
        {postUser ? <UserAvatar user={postUser} size="lg" showName /> : null}

        <div className="flex-1 min-w-0 pt-1">
          <div className="text-sm text-gray-500">
            {post ? formatDate(post.createdAt) : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="mb-4 whitespace-pre-line text-lg">
        {post ? post.content : 'Loading...'}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {post?.emotionTags.map((tag: { type: string; score: number }) => (
          <span
            key={tag.type}
            className="text-sm px-3 py-1 rounded-full"
            style={{
              backgroundColor: `${getEmotionColor(tag.type as any)}20`,
              color: getEmotionColor(tag.type as any),
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
              // 投稿者自身または処理中の場合は押下不可
              disabled={isOwner || isReacting}
              className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm ${
                post && post.reactionCounts[button.type] > 0
                  ? 'bg-blue-50 text-blue-500 dark:bg-blue-900 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{button.emoji}</span>
              <span>{post?.reactionCounts[button.type]}</span>
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-500">
          {post && post.replyCount > 0 && `${post.replyCount}件の返信`}
        </div>
      </div>
    </div>
  );
}
