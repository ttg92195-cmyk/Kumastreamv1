import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const movies = await db.movie.findMany({
      include: {
        cast: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!title || !year || !rating || !duration || !poster || !description) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const movie = await db.movie.create({
      data: {
        title,
        year: parseInt(year),
        rating: parseFloat(rating),
        duration: parseInt(duration),
        poster,
        backdrop,
        description,
        genres: JSON.stringify(genres || []),
        quality4k: quality4k || false,
        director,
        fileSize: fileSize ? JSON.stringify(fileSize) : null,
        quality: quality ? JSON.stringify(quality) : null,
        format: format ? JSON.stringify(format) : null,
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
    console.error('Error creating movie:', error);
    return NextResponse.json({ error: 'Failed to create movie' }, { status: 500 });
  }
}
