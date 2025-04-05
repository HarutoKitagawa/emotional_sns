'use client';
import { useFeedPosts } from '../features/post/hooks';
import PostWithUser from './PostWithUser';

export default function PostFeed() {
  const { data: posts, error, isLoading } = useFeedPosts();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error...</div>;
  if (!posts || posts.length === 0) return <div>投稿がありません。</div>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostWithUser key={post.id} post={post} />
      ))}
    </div>
  );
}
