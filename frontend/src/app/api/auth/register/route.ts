import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/fetcher';

// API endpoint for user registration
export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email and password are required' },
        { status: 400 }
      );
    }

    // Call backend API to create user
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Registration failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Set session cookie in the response
    const jsonResponse = NextResponse.json({
      id: data.userId,
      username: data.username,
      email: data.email,
    });
    
    jsonResponse.cookies.set('auth_token', data.token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return jsonResponse;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
