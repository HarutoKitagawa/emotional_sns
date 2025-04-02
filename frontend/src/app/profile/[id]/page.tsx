import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProfileHeader from '../../../components/ProfileHeader';
import ProfileTabsWrapper from '../../../components/ProfileTabsWrapper';

interface ProfilePageProps {
  params: {
    id: string;
  };
}

export default async function ProfilePage({ params: { id } }: ProfilePageProps) {
  
  // In a real app, we would validate the ID format here
  if (!id || typeof id !== 'string') {
    return notFound();
  }

  return (
    <div>
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
      
      <Suspense fallback={<div>プロフィールを読み込み中...</div>}>
        <ProfileHeader userId={id} />
      </Suspense>
      
      <div className="mt-6">
      <Suspense fallback={<div>読み込み中...</div>}>
        <ProfileTabsWrapper userId={id} />
      </Suspense>
      </div>
    </div>
  );
}
