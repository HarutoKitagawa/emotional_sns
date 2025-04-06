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
        </div>
      </div>
    </div>
  );
}
