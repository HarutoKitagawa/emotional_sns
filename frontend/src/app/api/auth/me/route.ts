import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/fetcher';

// API endpoint to get current user information
export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Call backend API to get user info
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!response.ok) {
      // If token is invalid or expired
      if (response.status === 401) {
        const jsonResponse = NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
        
        // Clear the invalid token
        jsonResponse.cookies.set('auth_token', '', {
          httpOnly: true,
          path: '/',
          expires: new Date(0),
        });
        
        return jsonResponse;
      }
      
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: response.status }
      );
    }
    
    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
