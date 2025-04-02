import { User } from '../types/user';
import { Reply } from '../types/post';
import UserAvatar from './UserAvatar';
import { formatDate, getDominantEmotion, getEmotionColor } from '../lib/utils';
import { usePostReplies } from '../features/post/hooks';

// Mock data for demonstration purposes
const MOCK_USERS: Record<string, User> = {
  'user1': {
    id: 'user1',
    username: 'yamada_taro',
    displayName: '山田太郎',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    followersCount: 120,
    followingCount: 85,
  },
  'user2': {
    id: 'user2',
    username: 'tanaka_hanako',
    displayName: '田中花子',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    followersCount: 350,
    followingCount: 210,
  },
  'user3': {
    id: 'user3',
    username: 'suzuki_ichiro',
    displayName: '鈴木一郎',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    followersCount: 78,
    followingCount: 42,
  },
};

const MOCK_REPLIES: Reply[] = [
  {
    id: 'reply1',
    parentId: 'post1',
    userId: 'user2',
    content: '素敵な写真ですね！私も先週公園に行きましたが、桜が綺麗でした。',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    emotionTags: [
      { type: 'joy', score: 0.7 },
    ],
    reactionCounts: {
      like: 3,
      love: 1,
      cry: 0,
      angry: 0,
      wow: 0,
    },
  },
  {
    id: 'reply2',
    parentId: 'post1',
    userId: 'user3',
    content: 'どの公園ですか？今度行ってみたいです。',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    emotionTags: [
      { type: 'surprise', score: 0.4 },
      { type: 'joy', score: 0.3 },
    ],
    reactionCounts: {
      like: 1,
      love: 0,
      cry: 0,
      angry: 0,
      wow: 0,
    },
  },
  {
    id: 'reply3',
    parentId: 'post1',
    userId: 'user1',
    content: '@suzuki_ichiro 代々木公園です！まだ1週間くらいは見頃だと思いますよ。',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    emotionTags: [
      { type: 'joy', score: 0.6 },
    ],
    reactionCounts: {
      like: 2,
      love: 0,
      cry: 0,
      angry: 0,
      wow: 0,
    },
  },
];

interface ReplyListProps {
  postId: string;
}

export default function ReplyList({ postId }: ReplyListProps) {
  // In a real app, we would use this hook
  // const { data: replies, error, isLoading } = usePostReplies(postId);
  
  // For now, we'll use mock data
  const replies = MOCK_REPLIES;
  const isLoading = false;
  const error = null;
  
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
      {replies.map((reply) => {
        const user = MOCK_USERS[reply.userId];
        const dominantEmotion = getDominantEmotion(reply.emotionTags);
        const emotionColor = getEmotionColor(dominantEmotion);
        
        return (
          <div key={reply.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
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
                        color: emotionColor 
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
                    👍 {reply.reactionCounts.like > 0 && reply.reactionCounts.like}
                  </button>
                  <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    ❤️ {reply.reactionCounts.love > 0 && reply.reactionCounts.love}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
