import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - fetch all recent views for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const recentViews = await db.recentView.findMany({
      where: { userId },
      include: {
        movie: {
          include: { cast: true }
        },
        series: {
          include: { cast: true, episodes: true }
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });

    return NextResponse.json(recentViews);
  } catch (error) {
    console.error('Error fetching recent views:', error);
    return NextResponse.json({ error: 'Failed to fetch recent views' }, { status: 500 });
  }
}

// POST - add recent view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, movieId, seriesId } = body;

    if (!userId || (!movieId && !seriesId)) {
      return NextResponse.json({ error: 'User ID and either movieId or seriesId required' }, { status: 400 });
    }

    // Delete existing entry for same movie/series
    await db.recentView.deleteMany({
      where: {
        userId,
        OR: [
          { movieId: movieId || undefined },
          { seriesId: seriesId || undefined },
        ],
      },
    });

    const recentView = await db.recentView.create({
      data: {
        userId,
        movieId: movieId || undefined,
        seriesId: seriesId || undefined,
      },
    });

    return NextResponse.json(recentView);
  } catch (error) {
    console.error('Error creating recent view:', error);
    return NextResponse.json({ error: 'Failed to create recent view' }, { status: 500 });
  }
}

// DELETE - remove recent view
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (id) {
      await db.recentView.delete({
        where: { id },
      });
    } else if (userId) {
      await db.recentView.deleteMany({
        where: { userId },
      });
    } else {
      return NextResponse.json({ error: 'Recent view ID or userId required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recent view:', error);
    return NextResponse.json({ error: 'Failed to delete recent view' }, { status: 500 });
  }
}
