import { NextRequest, NextResponse } from 'next/server';
import { createApiUrl } from '@/lib/fetcher';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    
    // Call the backend API
    const response = await fetch(createApiUrl(`/posts/${postId}/influence`), {
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('Authorization')
          ? { Authorization: request.headers.get('Authorization') as string }
          : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch influence data: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching post influence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch influence data' },
      { status: 500 }
    );
  }
}
