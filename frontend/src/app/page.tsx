import { Suspense } from 'react';
import PostFeed from '../components/PostFeed';
import EmotionTrends from '../components/EmotionTrends';

export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold mb-6">最新の投稿</h1>
        <Suspense fallback={<div>投稿を読み込み中...</div>}>
          <PostFeed />
        </Suspense>
      </div>
      
      <div className="hidden lg:block">
        <div className="sticky top-20">
          <h2 className="text-xl font-bold mb-4">トレンド感情</h2>
          <Suspense fallback={<div>トレンドを読み込み中...</div>}>
            <EmotionTrends />
          </Suspense>
          
          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="font-medium mb-2">EmotionSNSについて</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              EmotionSNSは、投稿内容から感情を分析し、感情に基づいたコミュニケーションを促進するソーシャルネットワークです。
              あなたの感情を共有し、他のユーザーの感情に共感しましょう。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
