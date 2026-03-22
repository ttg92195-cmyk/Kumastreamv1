import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - fetch all bookmarks for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const bookmarks = await db.bookmark.findMany({
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

// POST - add bookmark
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, movieId, seriesId } = body;

    if (!userId || (!movieId && !seriesId)) {
      return NextResponse.json({ error: 'User ID and either movieId or seriesId required' }, { status: 400 });
    }

    // Check if already bookmarked
    const existing = await db.bookmark.findFirst({
      where: {
        userId,
        OR: [
          { movieId: movieId || undefined },
          { seriesId: seriesId || undefined },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already bookmarked' }, { status: 400 });
    }

    const bookmark = await db.bookmark.create({
      data: {
        userId,
        movieId: movieId || undefined,
        seriesId: seriesId || undefined,
      },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}

// DELETE - remove bookmark
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, movieId, seriesId } = body;

    if (id) {
      await db.bookmark.delete({
        where: { id },
      });
    } else if (userId && (movieId || seriesId)) {
      await db.bookmark.deleteMany({
        where: {
          userId,
          OR: [
            { movieId: movieId || undefined },
            { seriesId: seriesId || undefined },
          ],
        },
      });
    } else {
      return NextResponse.json({ error: 'Bookmark ID or userId with movieId/seriesId required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
