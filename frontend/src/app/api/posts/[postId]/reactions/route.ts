import { NextRequest, NextResponse } from 'next/server';
import { fetcher, createApiUrl } from '@/lib/fetcher';

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const postId = params.postId;

  try {
    const body = await req.json();
    const { userId, type } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and type are required' },
        { status: 400 }
      );
    }

    const data = await fetcher(createApiUrl(`/posts/${postId}/reactions`), {
      method: 'POST',
      body: JSON.stringify({ userId, type }),
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`API route: Unexpected error:`, error);

    if (error.info && error.status) {
      return NextResponse.json(
        { error: error.info?.message ?? 'Backend error' },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
