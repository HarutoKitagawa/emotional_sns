"use client";

import { User } from '../types/user';
import { getEmotionColor } from '../lib/utils';

// Mock data for demonstration purposes
const MOCK_USER: User = {
  id: 'user1',
  username: 'yamada_taro',
  displayName: '山田太郎',
  avatarUrl: 'https://i.pravatar.cc/150?img=1',
  followersCount: 120,
  followingCount: 85,
  emotionalProfile: {
    dominantEmotions: ['joy', 'surprise'],
    emotionalRange: 75,
  },
};

// Mock emotion data
const MOCK_EMOTION_DATA = {
  joy: 42,
  sadness: 15,
  anger: 8,
  fear: 5,
  surprise: 25,
  disgust: 5,
};

interface EmotionalProfileChartProps {
  userId: string;
}

export default function EmotionalProfileChart({ userId }: EmotionalProfileChartProps) {
  // In a real app, we would use this hook
  // const { data: user, error, isLoading } = useUser(userId);
  
  // For now, we'll use mock data
  const user = MOCK_USER;
  const isLoading = false;
  const error = null;
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }
  
  if (error || !user || !user.emotionalProfile) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        感情プロフィールデータの読み込み中にエラーが発生しました。
      </div>
    );
  }
  
  // Calculate the max value for scaling
  const maxValue = Math.max(...Object.values(MOCK_EMOTION_DATA));
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">感情表現の分布</h3>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">感情表現度</span>
          <span className="text-sm font-bold">{user.emotionalProfile.emotionalRange}/100</span>
        </div>
        <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
          <div 
            className="h-2.5 rounded-full bg-blue-500"
            style={{ width: `${user.emotionalProfile.emotionalRange}%` }}
          ></div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          このユーザーは平均より{user.emotionalProfile.emotionalRange > 50 ? '高い' : '低い'}感情表現度を持っています。
        </p>
      </div>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">支配的な感情</h4>
        <div className="flex flex-wrap gap-2">
          {user.emotionalProfile.dominantEmotions.map((emotion) => (
            <div 
              key={emotion}
              className="flex items-center px-3 py-1.5 rounded-full"
              style={{ 
                backgroundColor: `${getEmotionColor(emotion as any)}20`,
                color: getEmotionColor(emotion as any)
              }}
            >
              <span className="text-sm font-medium capitalize">{emotion}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-3">感情分布</h4>
        <div className="space-y-3">
          {Object.entries(MOCK_EMOTION_DATA).map(([emotion, value]) => (
            <div key={emotion}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs capitalize">{emotion}</span>
                <span className="text-xs">{value}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="h-2 rounded-full"
                  style={{ 
                    width: `${(value / maxValue) * 100}%`,
                    backgroundColor: getEmotionColor(emotion as any)
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium mb-2">感情プロフィールの解釈</h4>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          このユーザーは主に喜び(Joy)と驚き(Surprise)の感情を表現する傾向があります。
          ポジティブな感情表現が多く、コミュニケーションスタイルは明るく活発である可能性が高いです。
        </p>
      </div>
    </div>
  );
}
