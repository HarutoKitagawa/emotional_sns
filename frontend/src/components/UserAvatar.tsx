import Link from 'next/link';
import { User } from '../types/user';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  linkToProfile?: boolean;
}

export default function UserAvatar({
  user,
  size = 'md',
  showName = false,
  linkToProfile = true,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const avatar = (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-300 overflow-hidden flex-shrink-0`}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );

  const content = (
    <div className="flex items-center space-x-2">
      {avatar}
      {showName && (
        <div>
          <div className="font-medium">{user.displayName}</div>
          <div className="text-sm text-gray-500">@{user.username}</div>
        </div>
      )}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link
        href={`/profile/${user.id}`}
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}
