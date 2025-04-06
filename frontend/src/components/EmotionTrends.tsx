'use client';

import { EmotionType } from '../types/post';
import { getEmotionColor } from '../lib/utils';
import { useEffect, useState } from 'react';
import { useFeedPosts } from '@/features/post/hooks';

export default function EmotionTrends() {
  const { data: posts } = useFeedPosts();
  const [trends, setTrends] = useState<{ emotion: EmotionType; count: number; }[]>([]);
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);

  useEffect(() => {
    if (posts) {
      console.log(posts);
      const emotionCounts: any = {};

      posts.forEach((post) => {
        post.emotionTags.forEach((tag) => {
          if (!emotionCounts[tag.type]) {
            emotionCounts[tag.type] = tag.score;
          } else {
            emotionCounts[tag.type] += tag.score;
          }
        });
      });

      const sortedTrends = Object.entries(emotionCounts)
        .map(([emotion, count]: any) => ({ emotion, count }))
        .sort((a, b) => b.count - a.count);

      setTrends(sortedTrends);
      setDominantEmotion(sortedTrends[0]?.emotion || null);
    }
  }, [posts]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <ul className="space-y-3">
        {trends.map((trend) => (
          <li key={trend.emotion} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getEmotionColor(trend.emotion) }}
              />
              <span className="capitalize">{trend.emotion}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{trend.count.toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
      
      {dominantEmotion && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">今日の支配的感情</h3>
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: getEmotionColor(dominantEmotion) }}
            />
            <span className="font-medium">{dominantEmotion}</span>
          </div>
        </div>
      )}
    </div>
  );
}
