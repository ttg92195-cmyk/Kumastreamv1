import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const series = await db.series.findMany({
      include: {
        episodes: true,
        cast: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!title || !year || !rating || !poster || !description) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const series = await db.series.create({
      data: {
        title,
        year: parseInt(year),
        rating: parseFloat(rating),
        poster,
        backdrop,
        description,
        genres: JSON.stringify(genres || []),
        quality4k: quality4k || false,
        seasons: seasons ? parseInt(seasons) : 0,
        totalEpisodes: totalEpisodes ? parseInt(totalEpisodes) : 0,
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
    console.error('Error creating series:', error);
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}
