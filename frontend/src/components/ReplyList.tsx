// /home/ikezu/emotional_sns/frontend/src/components/ReplyList.tsx
"use client";
import { usePostReplies } from '../features/post/hooks';
import ReplyItem from './ReplyItem';

interface ReplyListProps {
  postId: string;
}

export default function ReplyList({ postId }: ReplyListProps) {
  const { data: replies, error, isLoading } = usePostReplies(postId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        返信の読み込み中にエラーが発生しました。再度お試しください。
      </div>
    );
  }

  if (!replies || replies.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">まだ返信がありません。最初の返信を投稿しましょう！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {replies.map((reply) => (
        <ReplyItem key={reply.id} reply={reply} />
      ))}
    </div>
  );
}
