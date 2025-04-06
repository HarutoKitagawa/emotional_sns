import { Suspense } from 'react';
import Link from 'next/link';
import SignupForm from '../../components/SignupForm';

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">iFeelに登録</h1>
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
      </div>
    </div>
  );
}
