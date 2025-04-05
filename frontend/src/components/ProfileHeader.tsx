'use client';
import { User } from '../types/user';
import { useFollowUser, useUserSession, useUser } from '../features/user/hooks';
import { getEmotionColor } from '../lib/utils';

interface ProfileHeaderProps {
  userId: string;
}

export default function ProfileHeader({ userId }: ProfileHeaderProps) {
  const { data: user, error, isLoading } = useUser(userId);
  const { user: currentUser, isLoggedIn } = useUserSession();
  const { isFollowing, follow, unfollow, isLoading: isFollowLoading } = useFollowUser(userId);
  
  const isCurrentUser = currentUser?.id === userId;
  
  const handleFollowClick = async () => {
    // In a real app, we would call this
    // if (isFollowing) {
    //   await unfollow();
    // } else {
    //   await follow();
    // }
    console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} user: ${userId}`);
  };
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex-1 text-center sm:text-left">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        ユーザー情報の読み込み中にエラーが発生しました。
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gray-300 overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500 text-4xl">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {user.emotionalProfile && (
            <div 
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center"
              style={{ 
                backgroundColor: getEmotionColor(user.emotionalProfile.dominantEmotions[0] as any) 
              }}
              title={`Dominant emotion: ${user.emotionalProfile.dominantEmotions[0]}`}
            >
              {user.emotionalProfile.dominantEmotions[0] === 'joy' && '😊'}
              {user.emotionalProfile.dominantEmotions[0] === 'sadness' && '😢'}
              {user.emotionalProfile.dominantEmotions[0] === 'anger' && '😡'}
              {user.emotionalProfile.dominantEmotions[0] === 'fear' && '😨'}
              {user.emotionalProfile.dominantEmotions[0] === 'surprise' && '😮'}
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-3">@{user.username}</p>
          
          {user.bio && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>
          )}
          
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-4">
            <div>
              <span className="font-bold">{user.followersCount}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">フォロワー</span>
            </div>
            <div>
              <span className="font-bold">{user.followingCount}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">フォロー中</span>
            </div>
            {user.emotionalProfile && (
              <div>
                <span className="font-bold">{user.emotionalProfile.emotionalRange}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">感情表現度</span>
              </div>
            )}
          </div>
          
          {!isCurrentUser && (
            <button
              onClick={handleFollowClick}
              disabled={isFollowLoading}
              className={`px-4 py-2 rounded-full font-medium ${
                isFollowing
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } transition-colors`}
            >
              {isFollowLoading
                ? '処理中...'
                : isFollowing
                ? 'フォロー中'
                : 'フォローする'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
