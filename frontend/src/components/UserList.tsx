"use client";
import { User } from '../types/user';
import UserAvatar from './UserAvatar';
import { useFollowUser } from '../features/user/hooks';

interface UserListProps {
  users: User[];
}

export default function UserList({ users }: UserListProps) {
  if (!users || users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">ユーザーがいません。</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserListItem key={user.id} user={user} />
      ))}
    </div>
  );
}

interface UserListItemProps {
  user: User;
}

function UserListItem({ user }: UserListItemProps) {
  const { isFollowing, follow, unfollow, isLoading } = useFollowUser(user.id);
  
  const handleFollowClick = async () => {
    try {
      if (isFollowing) {
        await unfollow();
      } else {
        await follow();
      }
      console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} user: ${user.id}`);
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <UserAvatar user={user} showName />
        
        <button
          onClick={handleFollowClick}
          disabled={isLoading}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            isFollowing
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } transition-colors`}
        >
          {isLoading
            ? '...'
            : isFollowing
            ? 'フォロー中'
            : 'フォローする'}
        </button>
      </div>
      
      {user.bio && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {user.bio}
        </p>
      )}
      
      <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
        <span>{user.followersCount} フォロワー</span>
        <span>•</span>
        <span>{user.followingCount} フォロー中</span>
      </div>
    </div>
  );
}
