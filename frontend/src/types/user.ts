export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  emotionalProfile?: {
    dominantEmotions: string[];
    emotionalRange: number; // 0-100 scale of emotional expressiveness
  };
}

export interface UserSession {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}
