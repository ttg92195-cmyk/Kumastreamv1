import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'movie' or 'series'
    
    const collections = await db.collection.findMany({
      where: type ? { type } : {},
      include: {
        movies: true,
        series: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, movieIds, seriesIds } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type required' }, { status: 400 });
    }

    const collection = await db.collection.create({
      data: {
        name,
        type,
        movies: movieIds ? { connect: movieIds.map((id: string) => ({ id })) } : undefined,
        series: seriesIds ? { connect: seriesIds.map((id: string) => ({ id })) } : undefined,
      },
      include: {
        movies: true,
        series: true,
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
