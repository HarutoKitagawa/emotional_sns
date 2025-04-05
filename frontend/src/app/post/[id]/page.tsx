import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PostDetail from '../../../components/PostDetail';
import ReplyForm from '../../../components/ReplyForm';
import ReplyList from '../../../components/ReplyList';
import EmotionalInfluenceGraph from '../../../components/EmotionalInfluenceGraph';

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Next.js Page Component
export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return notFound();
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="mb-2">
          <Link href="/" className="text-blue-500 hover:underline flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            フィードに戻る
          </Link>
        </div>
        
        <Suspense fallback={<div>投稿を読み込み中...</div>}>
          <PostDetail postId={id} />
        </Suspense>
        
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">返信する</h2>
          <Suspense fallback={<div>読み込み中...</div>}>
            <ReplyForm postId={id} />
          </Suspense>
        </div>
        
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">返信</h2>
          <Suspense fallback={<div>返信を読み込み中...</div>}>
            <ReplyList postId={id} />
          </Suspense>
        </div>
      </div>
      
      <div className="hidden lg:block">
        <div className="sticky top-20">
          <h2 className="text-xl font-bold mb-4">感情的影響</h2>
          <Suspense fallback={<div>データを読み込み中...</div>}>
            <EmotionalInfluenceGraph postId={id} />
          </Suspense>
          
          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="font-medium mb-2">感情分析について</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              EmotionSNSでは、投稿内容から感情を分析し、その投稿がどのような感情的影響を与えているかを可視化します。
              これにより、コミュニケーションの質を向上させ、より共感的な交流を促進します。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
