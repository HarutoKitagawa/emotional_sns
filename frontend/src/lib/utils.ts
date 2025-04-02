import { EmotionTag, EmotionType } from '../types/post';

/**
 * Format a date string to a human-readable format
 * Using a fixed timezone to prevent hydration errors
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Use a fixed timezone (Asia/Tokyo) for both server and client
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo', // Fixed timezone to ensure consistent rendering
  }).format(date);
};

/**
 * Get the dominant emotion from emotion tags
 */
export const getDominantEmotion = (emotionTags: EmotionTag[]): EmotionType | null => {
  if (!emotionTags || emotionTags.length === 0) return null;
  
  // Sort by score in descending order and get the highest
  const sorted = [...emotionTags].sort((a, b) => b.score - a.score);
  return sorted[0].type as EmotionType;
};

/**
 * Get color for an emotion type
 */
export const getEmotionColor = (emotion: EmotionType | null): string => {
  if (!emotion) return '#6B7280'; // Gray default
  
  const colors: Record<EmotionType, string> = {
    joy: '#FBBF24', // Yellow
    sadness: '#60A5FA', // Blue
    anger: '#EF4444', // Red
    fear: '#8B5CF6', // Purple
    surprise: '#10B981', // Green
    disgust: '#6B7280', // Gray
  };
  
  return colors[emotion] || colors.disgust;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
