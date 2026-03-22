import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');
    
    const episodes = await db.episode.findMany({
      where: seriesId ? { seriesId } : {},
      orderBy: [
        { season: 'asc' },
        { episode: 'asc' },
      ],
    });

    return NextResponse.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      seriesId,
      season,
      episode,
      title,
      duration,
      fileSize,
      quality,
      format,
    } = body;

    if (!seriesId || !season || !episode || !title) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const newEpisode = await db.episode.create({
      data: {
        seriesId,
        season: parseInt(season),
        episode: parseInt(episode),
        title,
        duration: duration ? parseInt(duration) : undefined,
        fileSize,
        quality,
        format,
      },
    });

    return NextResponse.json(newEpisode);
  } catch (error) {
    console.error('Error creating episode:', error);
    return NextResponse.json({ error: 'Failed to create episode' }, { status: 500 });
  }
}
