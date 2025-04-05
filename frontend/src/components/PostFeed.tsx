'use client';
import { useState } from 'react';
import { useFeedPosts, useEmotionTags } from '../features/post/hooks';
import PostWithUser from './PostWithUser';
import { getEmotionColor } from '../lib/utils';
import { EmotionType, Post } from '../types/post';

// Helper function to get a color for any emotion tag
const getTagColor = (tag: string): string => {
  const validEmotions: EmotionType[] = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'];
  
  if (validEmotions.includes(tag as EmotionType)) {
    return getEmotionColor(tag as EmotionType);
  }

  const defaultColors: Record<string, string> = {
    excitement: '#F59E0B',
    love: '#EC4899',
    anxiety: '#8B5CF6',
    confusion: '#6366F1',
    disappointment: '#4B5563',
    frustration: '#DC2626',
    hope: '#10B981',
    pride: '#F97316',
  };

  return defaultColors[tag] || '#6B7280';
};

export default function PostFeed() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { data: posts, error, isLoading } = useFeedPosts();
  const { data: emotionTagsData, error: tagsError, isLoading: tagsLoading } = useEmotionTags();
  // emotionTagsData is likely an array of strings
  const emotionTags = emotionTagsData?.emotionTags ?? [];

  console.log('Emotion tags in PostFeed:', emotionTags);

  // Filter posts based on selected emotion tag
  const filteredPosts = selectedTag
    ? posts?.filter((post: Post) => 
        post.emotionTags.some(tag => tag.type === selectedTag)
      )
    : posts;

  // Handle tag selection
  const handleTagClick = (tagType: string) => {
    if (selectedTag === tagType) {
      // If clicking the already selected tag, clear the filter
      setSelectedTag(null);
    } else {
      // Otherwise, set the new filter
      setSelectedTag(tagType);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading posts: {error.message}</div>;
  if (!posts || posts.length === 0) return <div>投稿がありません。</div>;

  return (
    <div className="space-y-6">
      {/* Emotion Tags Filter Buttons */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">感情タグ</h3>
        <div className="flex flex-wrap gap-2">
          {tagsLoading ? (
            <div>感情タグを読み込み中...</div>
          ) : tagsError ? (
            <div>感情タグの読み込みに失敗しました</div>
          ) : !Array.isArray(emotionTags) ? (
            <div>感情タグの形式が不正です</div>
          ) : emotionTags.length === 0 ? (
            <div>感情タグがありません</div>
          ) : (
            emotionTags.map((tag) => (
              <button
                key={tag.type}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag.type ? 'ring-2 ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor: `${getTagColor(tag.type)}${selectedTag === tag.type ? '40' : '20'}`,
                  color: getTagColor(tag.type),
                }}
                onClick={() => handleTagClick(tag.type)}
              >
                {tag.type}
                {selectedTag === tag.type && ' ✓'}
              </button>
            ))
            
          )}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts && filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostWithUser key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-4">
            {selectedTag ? (
              <p>「{selectedTag}」の感情タグを持つ投稿はありません。</p>
            ) : (
              <p>投稿がありません。</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
