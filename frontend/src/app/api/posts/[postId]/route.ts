// src/app/api/posts/[postId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetcher, createApiUrl } from '@/lib/fetcher';

export async function GET(
  req: NextRequest,
  context: { params: { postId: string } }
) {
  const { postId } = context.params;

  const data = await fetcher(createApiUrl(`/posts/${postId}`), {
    method: 'GET',
  });

  return NextResponse.json(data);
}
