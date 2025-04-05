import { NextRequest, NextResponse } from 'next/server';

import { fetcher, createApiUrl } from '@/lib/fetcher';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = (await params).id; // ✅ 必要ならここで変数名だけ変更

  try {
    const data = await fetcher(createApiUrl(`/users/${userId}/feed`));
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Feed fetch error:", err);

    if (err.info && err.status) {
      return NextResponse.json(
        { error: err.info?.message ?? 'Failed to fetch feed' },
        { status: err.status }
      );
    }

    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
