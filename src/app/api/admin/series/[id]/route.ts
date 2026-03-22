import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const series = await db.series.findUnique({
      where: { id },
      include: {
        episodes: true,
        cast: true,
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    return NextResponse.json(series);
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
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
      title,
      year,
      rating,
      poster,
      backdrop,
      description,
      genres,
      quality4k,
      seasons,
      totalEpisodes,
      cast,
    } = body;

    // Delete existing cast and recreate
    if (cast) {
      await db.cast.deleteMany({
        where: { seriesId: id },
      });
    }

    const series = await db.series.update({
      where: { id },
      data: {
        title,
        year: year ? parseInt(year) : undefined,
        rating: rating ? parseFloat(rating) : undefined,
        poster,
        backdrop,
        description,
        genres: genres ? JSON.stringify(genres) : undefined,
        quality4k,
        seasons: seasons ? parseInt(seasons) : undefined,
        totalEpisodes: totalEpisodes ? parseInt(totalEpisodes) : undefined,
        cast: cast ? {
          create: cast.map((c: { name: string; photo?: string; role?: string }) => ({
            name: c.name,
            photo: c.photo,
            role: c.role,
          }))
        } : undefined,
      },
      include: {
        episodes: true,
        cast: true,
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Error updating series:', error);
    return NextResponse.json({ error: 'Failed to update series' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.series.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting series:', error);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
