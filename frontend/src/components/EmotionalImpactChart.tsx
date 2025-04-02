import { useEmotionalImpact } from '../features/post/hooks';
import { EmotionalImpact } from '../types/post';

// Mock data for demonstration purposes
const MOCK_IMPACT: EmotionalImpact = {
  reachedUsers: 245,
  joyCount: 156,
  sadnessCount: 42,
  spreadDepth: 3,
};

interface EmotionalImpactChartProps {
  postId: string;
}

export default function EmotionalImpactChart({ postId }: EmotionalImpactChartProps) {
  // In a real app, we would use this hook
  // const { data: impact, error, isLoading } = useEmotionalImpact(postId);
  
  // For now, we'll use mock data
  const impact = MOCK_IMPACT;
  const isLoading = false;
  const error = null;
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }
  
  if (error || !impact) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        感情的影響データの読み込み中にエラーが発生しました。
      </div>
    );
  }
  
  // Calculate percentages for the chart
  const joyPercentage = Math.round((impact.joyCount / impact.reachedUsers) * 100);
  const sadnessPercentage = Math.round((impact.sadnessCount / impact.reachedUsers) * 100);
  const otherPercentage = 100 - joyPercentage - sadnessPercentage;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">到達ユーザー</span>
          <span className="text-lg font-bold">{impact.reachedUsers}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">拡散深度</span>
          <span className="text-lg font-bold">{impact.spreadDepth}次</span>
        </div>
      </div>
      
      <h3 className="text-sm font-medium mb-2">感情分布</h3>
      <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div className="flex h-full">
          <div 
            className="bg-yellow-400" 
            style={{ width: `${joyPercentage}%` }}
            title={`Joy: ${joyPercentage}%`}
          ></div>
          <div 
            className="bg-blue-400" 
            style={{ width: `${sadnessPercentage}%` }}
            title={`Sadness: ${sadnessPercentage}%`}
          ></div>
          <div 
            className="bg-gray-400" 
            style={{ width: `${otherPercentage}%` }}
            title={`Other: ${otherPercentage}%`}
          ></div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
          <span>喜び ({joyPercentage}%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
          <span>悲しみ ({sadnessPercentage}%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
          <span>その他 ({otherPercentage}%)</span>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium mb-2">感情的影響の解釈</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          この投稿は主にポジティブな感情（喜び）を引き起こしており、{impact.spreadDepth}次の拡散が見られます。
          合計{impact.reachedUsers}人のユーザーに到達し、感情的な共感を生み出しています。
        </p>
      </div>
    </div>
  );
}
