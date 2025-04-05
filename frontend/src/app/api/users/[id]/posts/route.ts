import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  
  try {
    console.log(`API route: Fetching posts for user with ID ${userId}`);
    
    const backendRes = await fetch(`http://backend:8080/users/${userId}/posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`API route: Backend response status: ${backendRes.status}`);
    
    if (!backendRes.ok) {
      console.error(`API route: Backend error: ${backendRes.status} ${backendRes.statusText}`);
      
      // For debugging purposes, try to get the error message
      let errorMessage = backendRes.statusText;
      try {
        const errorData = await backendRes.text();
        console.error(`API route: Backend error details: ${errorData}`);
        errorMessage = errorData;
      } catch (e) {
        console.error(`API route: Could not parse error details: ${e}`);
      }
      
      // Return a more informative error
      return NextResponse.json(
        { error: `Failed to fetch user posts: ${errorMessage}` },
        { status: backendRes.status }
      );
    }
    
    const data = await backendRes.json();
    console.log(`API route: User posts data received:`, data);
    
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error(`API route: Unexpected error:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
