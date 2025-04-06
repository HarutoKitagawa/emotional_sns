// /home/ikezu/emotional_sns/frontend/src/components/ReplyItem.tsx
import { Reply } from '../types/post';
import UserAvatar from './UserAvatar';
import { formatDate, getEmotionColor } from '../lib/utils';
import { useUser } from '@/features/user/hooks';

interface ReplyItemProps {
  reply: Reply;
}

export default function ReplyItem({ reply }: ReplyItemProps) {
  const { data: user } = useUser(reply.userId);

  if (!user) {
    return <div>ユーザー情報を取得中…</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-start space-x-3">
        <UserAvatar user={user} size="sm" showName />
        <div className="flex-1 min-w-0">
          <div className="flex justify-end flex-wrap gap-1">
            {reply.emotionTags.map(({ emotion, score }) => {
              const color = getEmotionColor(emotion);
              return (
                <span
                  key={emotion}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${color}40`,
                    color: color,
                  }}
                >
                  {emotion} ({(score * 100).toFixed(0)}%)
                </span>
              );
            })}
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">
              {formatDate(reply.createdAt)}
            </span>
          </div>
          <div className="mb-2 whitespace-pre-line">
            {reply.content}
          </div>
        </div>
      </div>
    </div>
  );
}
