'use client';
import Link from 'next/link';
import { useAuth } from '../features/auth/hooks';
import Image from 'next/image';

export default function Header() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-500">
          iFeel
        </Link>

        <nav className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          ) : isLoggedIn && user ? (
            <>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-300 overflow-hidden">
                    {user.avatarUrl && (
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="font-medium hidden sm:inline">
                    {user.username}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ログアウト
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full border border-blue-500 text-blue-500 font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                登録
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
