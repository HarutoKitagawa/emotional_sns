import { NextRequest, NextResponse } from 'next/server';
import { fetcher, createApiUrl } from '@/lib/fetcher';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Call backend API to get followers of this user
    const data = await fetcher(createApiUrl(`/users/${userId}/followers`));
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting followers:', error);
    
    if (error.info && error.status) {
      return NextResponse.json(
        { error: error.info?.message ?? 'Failed to get followers' },
        { status: error.status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get followers' },
      { status: 500 }
    );
  }
}
