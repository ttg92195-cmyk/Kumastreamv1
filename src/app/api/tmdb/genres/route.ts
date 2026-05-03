export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { sanitizeError } from '@/lib/auth';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getTmdbApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY environment variable is not set');
  return key;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'movie';

    console.log('Fetching genres for type:', type);

    const TMDB_API_KEY = getTmdbApiKey();
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

    // Cache genres for 1 hour (they rarely change)
    return NextResponse.json({
      genres: data.genres || [],
      success: true,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: any) {
    console.error('TMDB genre error:', error);
    return NextResponse.json({
      genres: [],
      error: sanitizeError(error, 'Failed to fetch genres'),
    }, { status: 500 });
  }
}
