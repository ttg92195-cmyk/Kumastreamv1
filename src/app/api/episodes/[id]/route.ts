// ISR: revalidate every 10 minutes instead of force-dynamic
export const revalidate = 600;

import { NextResponse, NextRequest } from 'next/server';
import { validateAdminAuth, isValidDownloadUrl, sanitizeError } from '@/lib/auth';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { getCachedEpisodeDetail, invalidateEpisodeCache } from '@/lib/cache';

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

    const episode = await getCachedEpisodeDetail(id);

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json({ episode }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      { error: sanitizeError(error, 'Failed to fetch episode') },
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

    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;

    // Rate limiting - admin write: 60 per minute per user
    const rateLimitResult = checkRateLimit(authResult.username || getClientIp(request), RATE_LIMITS.ADMIN_WRITE);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    console.log('=== Updating Episode ===');
    console.log('Episode ID:', id);
    console.log('Download Links:', body.downloadLinks?.length || 0);

    // Import db directly for mutations (not cached)
    const { db } = await import('@/lib/db');

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
              url: isValidDownloadUrl(link.url) ? link.url : '',
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

    // Invalidate cache after mutation (episode + parent series)
    invalidateEpisodeCache(id);

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
      { error: sanitizeError(error, 'Failed to update episode') },
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

    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;

    // Rate limiting - admin write: 60 per minute per user
    const rateLimitResult = checkRateLimit(authResult.username || getClientIp(request), RATE_LIMITS.ADMIN_WRITE);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!id) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    // Import db directly for mutations (not cached)
    const { db } = await import('@/lib/db');

    // Delete download links and episode in a transaction
    await db.$transaction(async (tx) => {
      await tx.downloadLink.deleteMany({ where: { episodeId: id } });
      await tx.episode.delete({ where: { id } });
    });

    // Invalidate cache after mutation
    invalidateEpisodeCache(id);

    return NextResponse.json({ success: true, message: 'Episode deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting episode:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: sanitizeError(error, 'Failed to delete episode') },
      { status: 500 }
    );
  }
}
