// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const backendRes = await fetch('http://backend:8080/posts', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await backendRes.json();

  return NextResponse.json(data, { status: backendRes.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch('http://backend:8080/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  return NextResponse.json(data, { status: backendRes.status });
}
