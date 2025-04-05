import { Suspense } from 'react';
import Link from 'next/link';
import SignupForm from '../../components/SignupForm';

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">EmotionSNSに登録</h1>
        <p className="text-gray-600 dark:text-gray-400">
          感情分析を活用したソーシャルネットワークへようこそ
        </p>
      </div>
      
      <Suspense fallback={<div>読み込み中...</div>}>
        <SignupForm />
      </Suspense>
      
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          すでにアカウントをお持ちの方は
          <Link href="/login" className="text-blue-500 hover:underline ml-1">
            ログイン
          </Link>
        </p>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
            EmotionSNSについて
          </h2>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            EmotionSNSは、投稿内容から感情を分析し、感情に基づいたコミュニケーションを促進するソーシャルネットワークです。
            あなたの感情を共有し、他のユーザーの感情に共感しましょう。
          </p>
        </div>
      </div>
    </div>
  );
}
