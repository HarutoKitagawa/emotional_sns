import { User } from '../types/user';
import { Post } from '../types/post';
import PostCard from './PostCard';
import { useFeedPosts } from '../features/post/hooks';

// Mock data for demonstration purposes
const MOCK_USERS: Record<string, User> = {
  'user1': {
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
  },
  'user2': {
    id: 'user2',
    username: 'tanaka_hanako',
    displayName: '田中花子',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    followersCount: 350,
    followingCount: 210,
    emotionalProfile: {
      dominantEmotions: ['sadness', 'fear'],
      emotionalRange: 60,
    },
  },
};

const MOCK_POSTS: Post[] = [
  {
    id: 'post1',
    userId: 'user1',
    content: '今日は天気が良くて気分も最高！公園でピクニックをしてきました。自然の中で過ごす時間は本当に癒されますね。皆さんも休日は外に出かけてみてはいかがでしょうか？',
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
    id: 'post2',
    userId: 'user2',
    content: '仕事のプロジェクトが予定通りに進まなくて少し落ち込んでいます。でも、明日からまた頑張ろうと思います。皆さんは仕事でストレスを感じたときどうしていますか？',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    emotionTags: [
      { type: 'sadness', score: 0.6 },
      { type: 'fear', score: 0.4 },
    ],
    reactionCounts: {
      like: 8,
      love: 2,
      cry: 5,
      angry: 0,
      wow: 0,
    },
    replyCount: 12,
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

export default function PostFeed() {
  // In a real app, we would use the useFeedPosts hook
  // const { data: posts, error, isLoading } = useFeedPosts();
  
  // For now, we'll use mock data
  const posts = MOCK_POSTS;
  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 animate-pulse">
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
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        投稿の読み込み中にエラーが発生しました。再度お試しください。
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">投稿がありません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          user={MOCK_USERS[post.userId]}
          preview={true}
        />
      ))}
    </div>
  );
}
