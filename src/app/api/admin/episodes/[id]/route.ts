import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const episode = await db.episode.findUnique({
      where: { id },
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error('Error fetching episode:', error);
    return NextResponse.json({ error: 'Failed to fetch episode' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      season,
      episode,
      title,
      duration,
      fileSize,
      quality,
      format,
    } = body;

    const updatedEpisode = await db.episode.update({
      where: { id },
      data: {
        season: season ? parseInt(season) : undefined,
        episode: episode ? parseInt(episode) : undefined,
        title,
        duration: duration ? parseInt(duration) : undefined,
        fileSize,
        quality,
        format,
      },
    });

    return NextResponse.json(updatedEpisode);
  } catch (error) {
    console.error('Error updating episode:', error);
    return NextResponse.json({ error: 'Failed to update episode' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.episode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting episode:', error);
    return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 });
  }
}
