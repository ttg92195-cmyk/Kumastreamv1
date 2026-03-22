import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'movie' or 'series'
    
    const tags = await db.tag.findMany({
      where: type ? { type } : {},
      include: {
        movies: true,
        series: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, movieIds, seriesIds } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type required' }, { status: 400 });
    }

    const tag = await db.tag.create({
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

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
