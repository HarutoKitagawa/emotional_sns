// app/api/posts/[postId]/replies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetcher, createApiUrl } from '@/lib/fetcher';

// リプライ一覧取得（GET）
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const postId = params.postId;

  try {
    const res = await fetcher(createApiUrl(`/posts/${postId}/replies`), {
      method: 'GET',
    });

    return NextResponse.json(res); // { replies: [...] }
  } catch (error: any) {
    console.error(`[GET /api/posts/${postId}/replies] Error:`, error);

    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: error.status || 500 }
    );
  }
}

// リプライ投稿（POST）
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const postId = params.postId;

  try {
    const body = await req.json();
    const { userId, content } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and content are required' },
        { status: 400 }
      );
    }

    const data = await fetcher(createApiUrl(`/posts/${postId}/replies`), {
      method: 'POST',
      body: JSON.stringify({ userId, content }),
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[POST /api/posts/${postId}/replies] Unexpected error:`, error);

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: error.status || 500 }
    );
  }
}
