// app/api/users/me/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const token = cookies().get('auth_token')?.value;

  if (!token) {
    console.warn('[GET /api/users/me] No auth_token found in cookies');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const backendRes = await fetch('http://backend:8080/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      console.error(`[GET /api/users/me] Backend error ${backendRes.status}: ${errorText}`);
      return NextResponse.json({ error: errorText }, { status: backendRes.status });
    }

    const userData = await backendRes.json();
    return NextResponse.json(userData, { status: 200 });

  } catch (err) {
    console.error('[GET /api/users/me] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
