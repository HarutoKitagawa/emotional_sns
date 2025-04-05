'use client';

import { usePostInfluence } from '../features/post/hooks';
import { useUser } from '../features/user/hooks';
import { getEmotionColor } from '../lib/utils';
import { InfluenceUser, PostInfluence } from '../types/post';
import UserAvatar from './UserAvatar';

interface EmotionalInfluenceGraphProps {
  postId: string;
}

export default function EmotionalInfluenceGraph({ postId }: EmotionalInfluenceGraphProps) {
  const { data: influence, error, isLoading } = usePostInfluence(postId);
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }
  
  if (error || !influence) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        感情的影響データの読み込み中にエラーが発生しました。
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">感情的影響グラフ</h3>
      
      {/* グラフ表示 */}
      <div className="relative h-64 mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* 中心の投稿 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            投稿
          </div>
        </div>
        
        {/* 1次の影響 */}
        <InfluenceCircle 
          users={influence.firstDegree} 
          radius={80} 
          degree={1}
        />
        
        {/* 2次の影響 */}
        <InfluenceCircle 
          users={influence.secondDegree} 
          radius={120} 
          degree={2}
        />
        
        {/* 3次の影響 */}
        <InfluenceCircle 
          users={influence.thirdDegree} 
          radius={160} 
          degree={3}
        />
      </div>
      
      {/* 統計情報 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">影響を受けたユーザー</span>
          <span className="text-lg font-bold">{influence.summary.totalUsers}</span>
        </div>
        
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">最大拡散深度</span>
          <span className="text-lg font-bold">{Object.keys(influence.summary.byDegree).length}次</span>
        </div>
      </div>
      
      {/* 反応タイプ別の統計 */}
      <h4 className="text-sm font-medium mb-2">反応タイプ別</h4>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {Object.entries(influence.summary.byType).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-xs capitalize">{type}</span>
            <span className="text-xs font-medium">{count}人</span>
          </div>
        ))}
      </div>
      
      {/* 次数別の統計 */}
      <h4 className="text-sm font-medium mb-2">次数別</h4>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(influence.summary.byDegree).map(([degree, count]) => (
          <div key={degree} className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-xs">{getDegreeLabel(degree)}</span>
            <span className="text-sm font-medium">{count}人</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium mb-2">感情的影響の解釈</h4>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          この投稿は{influence.summary.totalUsers}人のユーザーに感情的影響を与えました。
          {influence.summary.byDegree.first}人のユーザーが直接反応し、
          {influence.summary.byDegree.second || 0}人のユーザーが2次的に、
          {influence.summary.byDegree.third || 0}人のユーザーが3次的に影響を受けています。
        </p>
      </div>
    </div>
  );
}

interface InfluenceCircleProps {
  users: InfluenceUser[];
  radius: number;
  degree: number;
}

function InfluenceCircle({ users, radius, degree }: InfluenceCircleProps) {
  if (users.length === 0) return null;
  
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      {users.map((user, index) => {
        const angle = (index / users.length) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        
        return (
          <div 
            key={`${user.userId}-${index}`}
            className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${x}px`, 
              top: `${y}px`,
            }}
            title={`ユーザーID: ${user.userId}, 反応: ${user.type}`}
          >
            <div 
              className="w-full h-full rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: getReactionColor(user.type) }}
            >
              {getReactionEmoji(user.type)}
            </div>
            
            {/* 中心から現在のノードへの線 */}
            <div 
              className="absolute top-1/2 left-1/2 origin-left border-t border-gray-300 dark:border-gray-600 z-0"
              style={{ 
                width: `${radius}px`,
                transform: `rotate(${angle}rad) translateY(-50%)`,
              }}
            ></div>
          </div>
        );
      })}
    </div>
  );
}

// 反応タイプに応じた色を返す関数
function getReactionColor(type: string): string {
  switch (type) {
    case 'like':
      return '#4299E1'; // blue-500
    case 'love':
      return '#F56565'; // red-500
    case 'cry':
      return '#4FD1C5'; // teal-400
    case 'angry':
      return '#ED8936'; // orange-500
    case 'wow':
      return '#9F7AEA'; // purple-500
    default:
      return '#A0AEC0'; // gray-500
  }
}

// 反応タイプに応じた絵文字を返す関数
function getReactionEmoji(type: string): string {
  switch (type) {
    case 'like':
      return '👍';
    case 'love':
      return '❤️';
    case 'cry':
      return '😢';
    case 'angry':
      return '😡';
    case 'wow':
      return '😮';
    default:
      return '👀';
  }
}

// 次数に応じたラベルを返す関数
function getDegreeLabel(degree: string): string {
  switch (degree) {
    case 'first':
      return '1次';
    case 'second':
      return '2次';
    case 'third':
      return '3次';
    default:
      return degree;
  }
}
