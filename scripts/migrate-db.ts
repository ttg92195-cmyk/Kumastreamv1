import { PrismaClient } from '@prisma/client';

// Database URLs
const OLD_DB_URL = 'postgresql://neondb_owner:npg_oN5Ftc9DUzip@ep-aged-heart-aezqltrp-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const NEW_DB_URL = 'postgresql://neondb_owner:npg_Vg0ERup7NFKn@ep-long-wildflower-adxq2fp5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
  console.log('🚀 Starting Database Migration...\n');

  // Connect to OLD database
  const oldPrisma = new PrismaClient({
    datasourceUrl: OLD_DB_URL,
  });

  // Connect to NEW database
  const newPrisma = new PrismaClient({
    datasourceUrl: NEW_DB_URL,
  });

  try {
    // ============================================
    // STEP 1: Export data from OLD database
    // ============================================
    console.log('📥 Exporting data from OLD database...\n');

    const [users, movies, series, episodes, downloadLinks, casts, genres, collections, tags, bookmarks, recentViews] = await Promise.all([
      oldPrisma.user.findMany(),
      oldPrisma.movie.findMany(),
      oldPrisma.series.findMany(),
      oldPrisma.episode.findMany(),
      oldPrisma.downloadLink.findMany(),
      oldPrisma.cast.findMany(),
      oldPrisma.genre.findMany(),
      oldPrisma.collection.findMany(),
      oldPrisma.tag.findMany(),
      oldPrisma.bookmark.findMany(),
      oldPrisma.recentView.findMany(),
    ]);

    console.log('📊 Data exported:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Movies: ${movies.length}`);
    console.log(`   - Series: ${series.length}`);
    console.log(`   - Episodes: ${episodes.length}`);
    console.log(`   - Download Links: ${downloadLinks.length}`);
    console.log(`   - Casts: ${casts.length}`);
    console.log(`   - Genres: ${genres.length}`);
    console.log(`   - Collections: ${collections.length}`);
    console.log(`   - Tags: ${tags.length}`);
    console.log(`   - Bookmarks: ${bookmarks.length}`);
    console.log(`   - Recent Views: ${recentViews.length}`);
    console.log('');

    // ============================================
    // STEP 2: Import data to NEW database
    // ============================================
    console.log('📤 Importing data to NEW database...\n');

    // Import Users
    if (users.length > 0) {
      console.log('   Importing Users...');
      for (const user of users) {
        await newPrisma.user.create({ data: user });
      }
      console.log(`   ✅ Users: ${users.length} imported`);
    }

    // Import Movies
    if (movies.length > 0) {
      console.log('   Importing Movies...');
      for (const movie of movies) {
        await newPrisma.movie.create({ data: movie });
      }
      console.log(`   ✅ Movies: ${movies.length} imported`);
    }

    // Import Series
    if (series.length > 0) {
      console.log('   Importing Series...');
      for (const s of series) {
        await newPrisma.series.create({ data: s });
      }
      console.log(`   ✅ Series: ${series.length} imported`);
    }

    // Import Episodes
    if (episodes.length > 0) {
      console.log('   Importing Episodes...');
      for (const episode of episodes) {
        await newPrisma.episode.create({ data: episode });
      }
      console.log(`   ✅ Episodes: ${episodes.length} imported`);
    }

    // Import Download Links
    if (downloadLinks.length > 0) {
      console.log('   Importing Download Links...');
      for (const link of downloadLinks) {
        await newPrisma.downloadLink.create({ data: link });
      }
      console.log(`   ✅ Download Links: ${downloadLinks.length} imported`);
    }

    // Import Casts
    if (casts.length > 0) {
      console.log('   Importing Casts...');
      for (const cast of casts) {
        await newPrisma.cast.create({ data: cast });
      }
      console.log(`   ✅ Casts: ${casts.length} imported`);
    }

    // Import Genres
    if (genres.length > 0) {
      console.log('   Importing Genres...');
      for (const genre of genres) {
        await newPrisma.genre.create({ data: genre });
      }
      console.log(`   ✅ Genres: ${genres.length} imported`);
    }

    // Import Collections
    if (collections.length > 0) {
      console.log('   Importing Collections...');
      for (const collection of collections) {
        await newPrisma.collection.create({ data: collection });
      }
      console.log(`   ✅ Collections: ${collections.length} imported`);
    }

    // Import Tags
    if (tags.length > 0) {
      console.log('   Importing Tags...');
      for (const tag of tags) {
        await newPrisma.tag.create({ data: tag });
      }
      console.log(`   ✅ Tags: ${tags.length} imported`);
    }

    // Import Bookmarks
    if (bookmarks.length > 0) {
      console.log('   Importing Bookmarks...');
      for (const bookmark of bookmarks) {
        await newPrisma.bookmark.create({ data: bookmark });
      }
      console.log(`   ✅ Bookmarks: ${bookmarks.length} imported`);
    }

    // Import Recent Views
    if (recentViews.length > 0) {
      console.log('   Importing Recent Views...');
      for (const recent of recentViews) {
        await newPrisma.recentView.create({ data: recent });
      }
      console.log(`   ✅ Recent Views: ${recentViews.length} imported`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total records migrated: ${users.length + movies.length + series.length + episodes.length + downloadLinks.length + casts.length + genres.length + collections.length + tags.length + bookmarks.length + recentViews.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

migrate().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});
