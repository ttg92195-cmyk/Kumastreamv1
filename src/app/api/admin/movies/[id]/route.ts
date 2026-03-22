import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const movie = await db.movie.findUnique({
      where: { id },
      include: {
        cast: true,
      },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 });
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
      duration,
      poster,
      backdrop,
      description,
      genres,
      quality4k,
      director,
      fileSize,
      quality,
      format,
      subtitle,
      cast,
    } = body;

    // Delete existing cast and recreate
    if (cast) {
      await db.cast.deleteMany({
        where: { movieId: id },
      });
    }

    const movie = await db.movie.update({
      where: { id },
      data: {
        title,
        year: year ? parseInt(year) : undefined,
        rating: rating ? parseFloat(rating) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        poster,
        backdrop,
        description,
        genres: genres ? JSON.stringify(genres) : undefined,
        quality4k,
        director,
        fileSize: fileSize ? JSON.stringify(fileSize) : undefined,
        quality: quality ? JSON.stringify(quality) : undefined,
        format: format ? JSON.stringify(format) : undefined,
        subtitle,
        cast: cast ? {
          create: cast.map((c: { name: string; photo?: string; role?: string }) => ({
            name: c.name,
            photo: c.photo,
            role: c.role,
          }))
        } : undefined,
      },
      include: {
        cast: true,
      },
    });

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json({ error: 'Failed to update movie' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.movie.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movie:', error);
    return NextResponse.json({ error: 'Failed to delete movie' }, { status: 500 });
  }
}
