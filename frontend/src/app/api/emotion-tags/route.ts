// src/app/api/emotion-tags/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetcher, createApiUrl } from '@/lib/fetcher';

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching emotion tags from backend');
    const data = await fetcher(createApiUrl('/emotion-tags'), {
      method: 'GET',
    });
    
    console.log('Emotion tags response:', JSON.stringify(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching emotion tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emotion tags' },
      { status: 500 }
    );
  }
}
