import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single episode
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    const episode = await db.episode.findUnique({
      where: { id },
      include: {
        downloadLinks: true,
      },
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json({ episode });
  } catch (error: any) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episode', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update episode (mainly for download links)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    console.log('=== Updating Episode ===');
    console.log('Episode ID:', id);
    console.log('Download Links:', body.downloadLinks?.length || 0);

    // Check if episode exists
    const existingEpisode = await db.episode.findUnique({
      where: { id },
      include: { downloadLinks: true },
    });

    if (!existingEpisode) {
      console.error('Episode not found:', id);
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    console.log('Existing episode found:', existingEpisode.title);
    console.log('Existing download links:', existingEpisode.downloadLinks?.length || 0);

    // Update episode and handle download links in a transaction
    const updatedEpisode = await db.$transaction(async (tx) => {
      // Delete existing download links for this episode
      await tx.downloadLink.deleteMany({
        where: { episodeId: id },
      });

      console.log('Deleted existing download links');

      // Create new download links if provided
      if (body.downloadLinks && Array.isArray(body.downloadLinks) && body.downloadLinks.length > 0) {
        console.log('Creating new download links:', body.downloadLinks);

        for (const link of body.downloadLinks) {
          await tx.downloadLink.create({
            data: {
              episodeId: id,
              server: link.server || 'Server 1',
              quality: link.quality || '',
              url: link.url || '',
              size: link.size || null,
            },
          });
        }
      }

      // Update episode fields if provided
      const episode = await tx.episode.update({
        where: { id },
        data: {
          title: body.title || undefined,
          duration: body.duration ? parseInt(body.duration) : undefined,
          fileSize: body.fileSize || undefined,
          quality: body.quality || undefined,
          format: body.format || undefined,
        },
        include: {
          downloadLinks: true,
        },
      });

      return episode;
    });

    console.log('Episode updated successfully with', updatedEpisode.downloadLinks?.length || 0, 'download links');

    return NextResponse.json({
      success: true,
      episode: {
        ...updatedEpisode,
        downloadLinks: updatedEpisode.downloadLinks.map((d: any) => ({
          id: d.id,
          server: d.server || 'Server 1',
          quality: d.quality,
          url: d.url,
          size: d.size,
        })),
      }
    });
  } catch (error: any) {
    console.error('Error updating episode:', error);
    return NextResponse.json(
      { error: 'Failed to update episode', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE episode
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    // Delete download links first
    await db.downloadLink.deleteMany({
      where: { episodeId: id },
    });

    // Delete episode
    await db.episode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Episode deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting episode:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete episode', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
