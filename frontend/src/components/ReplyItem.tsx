// /home/ikezu/emotional_sns/frontend/src/components/ReplyItem.tsx
import { Reply } from '../types/post';
import UserAvatar from './UserAvatar';
import { formatDate, getDominantEmotion, getEmotionColor } from '../lib/utils';
import { useUser } from '@/features/user/hooks';

interface ReplyItemProps {
  reply: Reply;
}

export default function ReplyItem({ reply }: ReplyItemProps) {
  const { data: user } = useUser(reply.userId);

  if (!user) {
    return <div>ユーザー情報を取得中…</div>;
  }

  const dominantEmotion = getDominantEmotion(reply.emotionTags);
  const emotionColor = getEmotionColor(dominantEmotion);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-start space-x-3">
        <UserAvatar user={user} size="sm" showName />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">
              {formatDate(reply.createdAt)}
            </span>
            {dominantEmotion && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${emotionColor}20`,
                  color: emotionColor,
                }}
              >
                {dominantEmotion}
              </span>
            )}
          </div>
          <div className="mb-2 whitespace-pre-line">
            {reply.content}
          </div>
          <div className="flex space-x-2">
            <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                👍 {reply.reactionCounts?.like ?? 0}
            </button>
            <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                ❤️ {reply.reactionCounts?.love ?? 0}
            </button>
            </div>
        </div>
      </div>
    </div>
  );
}
