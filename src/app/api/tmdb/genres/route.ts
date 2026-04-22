export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '2e928cd76f7f5ae46f6e022f5dcc2612';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'movie';

    console.log('Fetching genres for type:', type);

    const url = `${TMDB_BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('TMDB genre API error:', response.status);
      return NextResponse.json({ 
        genres: [], 
        error: `TMDB API error: ${response.status}` 
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log(`Found ${data.genres?.length || 0} genres`);

    return NextResponse.json({
      genres: data.genres || [],
      success: true,
    });
  } catch (error: any) {
    console.error('TMDB genre error:', error);
    return NextResponse.json({ 
      genres: [],
      error: 'Failed to fetch genres',
      details: error?.message || 'Unknown error',
    }, { status: 500 });
  }
}
