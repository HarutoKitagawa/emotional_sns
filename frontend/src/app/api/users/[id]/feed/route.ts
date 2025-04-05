import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // ✅ "id" に合わせる
) {
  const userId = params.id; // ✅ 必要ならここで変数名だけ変更

  try {
    const res = await fetch(`http://backend:8080/users/${userId}/feed`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Feed fetch error:", err);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
