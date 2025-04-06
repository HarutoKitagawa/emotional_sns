import { NextRequest, NextResponse } from 'next/server';
import { fetcher, createApiUrl } from '@/lib/fetcher';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; targetId: string } }
) {
  try {
    const userId = params.id;
    const targetUserId = params.targetId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // Call backend API to unfollow the user
    const data = await fetcher(createApiUrl(`/users/${userId}/following/${targetUserId}`), {
      method: 'DELETE',
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    
    if (error.info && error.status) {
      return NextResponse.json(
        { error: error.info?.message ?? 'Failed to unfollow user' },
        { status: error.status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}
