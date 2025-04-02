import { EmotionType } from '../types/post';
import { getEmotionColor } from '../lib/utils';

// Mock data for demonstration purposes
const MOCK_EMOTION_TRENDS: { emotion: EmotionType; count: number; change: number }[] = [
  { emotion: 'joy', count: 1250, change: 12 },
  { emotion: 'sadness', count: 850, change: -5 },
  { emotion: 'anger', count: 420, change: 8 },
  { emotion: 'fear', count: 380, change: 2 },
  { emotion: 'surprise', count: 620, change: 15 },
];

export default function EmotionTrends() {
  // In a real app, we would fetch this data from an API
  const trends = MOCK_EMOTION_TRENDS;
  
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
              <span 
                className={`text-xs ${
                  trend.change > 0 
                    ? 'text-green-500' 
                    : trend.change < 0 
                    ? 'text-red-500' 
                    : 'text-gray-500'
                }`}
              >
                {trend.change > 0 ? '+' : ''}{trend.change}%
              </span>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium mb-2">今日の支配的感情</h3>
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: getEmotionColor('joy') }}
          />
          <span className="font-medium">Joy (喜び)</span>
        </div>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          今日のユーザーは全体的にポジティブな感情を表現しています。
        </p>
      </div>
    </div>
  );
}
