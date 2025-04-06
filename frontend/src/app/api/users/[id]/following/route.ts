import { NextRequest, NextResponse } from 'next/server';
import { fetcher, createApiUrl } from '@/lib/fetcher';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // Call backend API to follow the user
    const data = await fetcher(createApiUrl(`/users/${userId}/following`), {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error following user:', error);
    
    if (error.info && error.status) {
      return NextResponse.json(
        { error: error.info?.message ?? 'Failed to follow user' },
        { status: error.status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Call backend API to get users that this user is following
    const data = await fetcher(createApiUrl(`/users/${userId}/following`));
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting following users:', error);
    
    if (error.info && error.status) {
      return NextResponse.json(
        { error: error.info?.message ?? 'Failed to get following users' },
        { status: error.status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get following users' },
      { status: 500 }
    );
  }
}
