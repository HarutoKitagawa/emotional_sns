// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const userId = context.params.id;
  
  try {
    console.log(`API route: Fetching user with ID ${userId}`);
    
    const backendRes = await fetch(`http://backend:8080/users/${userId}`, {
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
        { error: `Failed to fetch user: ${errorMessage}` },
        { status: backendRes.status }
      );
    }
    
    const data = await backendRes.json();
    console.log(`API route: User data received:`, data);
    
    // If the backend returns data in a different format than expected,
    // map it to the expected format
    if (data && !data.id && data.userId) {
      console.log(`API route: Mapping userId to id`);
      data.id = data.userId;
    }
    
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error(`API route: Unexpected error:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
