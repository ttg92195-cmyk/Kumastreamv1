import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '2e928cd76f7f5ae46f6e022f5dcc2612';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'movie';
    const year = searchParams.get('year');
    const genre = searchParams.get('genre');
    const countStr = searchParams.get('count') || '20';
    const query = searchParams.get('query');
    const sortBy = searchParams.get('sortBy') || 'popularity.desc'; // Default: popularity descending

    // Parse count - allow any number
    const count = parseInt(countStr) || 20;
    const limit = count;

    console.log('TMDB Search params:', { type, year, genre, count: limit, query, sortBy });

    let results: any[] = [];

    if (query) {
      // Search by query - fetch multiple pages if needed
      const pagesNeeded = Math.ceil(limit / 20);
      
      for (let page = 1; page <= pagesNeeded; page++) {
        const url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
        console.log(`Searching TMDB page ${page}:`, url);
        
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`TMDB API error on page ${page}: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        results = [...results, ...(data.results || [])];
        
        // Stop if no more results
        if (!data.results || data.results.length === 0) break;
        // Stop if we have enough
        if (results.length >= limit) break;
      }
      
      // Sort results based on sortBy parameter
      if (sortBy === 'popularity.asc') {
        results.sort((a, b) => (a.popularity || 0) - (b.popularity || 0));
      } else {
        // Default: popularity.desc
        results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      }
      
      results = results.slice(0, limit);
      console.log(`Found ${results.length} results for query: ${query}`);
    } else {
      // Discover with filters - use sortBy parameter
      let baseUrl = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=${sortBy}`;
      
      if (year) {
        baseUrl += `&primary_release_year=${year}`;
      }
      
      if (genre) {
        try {
          const genreUrl = `${TMDB_BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`;
          const genreResponse = await fetch(genreUrl);
          if (genreResponse.ok) {
            const genreData = await genreResponse.json();
            const genreItem = genreData.genres?.find((g: any) => g.name.toLowerCase() === genre.toLowerCase());
            if (genreItem) {
              baseUrl += `&with_genres=${genreItem.id}`;
            }
          }
        } catch (genreError) {
          console.error('Failed to fetch genres:', genreError);
        }
      }

      // Calculate pages needed (TMDB returns 20 per page)
      const pagesNeeded = Math.ceil(limit / 20);
      console.log(`Fetching ${pagesNeeded} pages for ${limit} items`);
      
      for (let page = 1; page <= pagesNeeded; page++) {
        const pageUrl = `${baseUrl}&page=${page}`;
        const response = await fetch(pageUrl);
        
        if (!response.ok) {
          console.error(`Failed to fetch page ${page}: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        results = [...results, ...(data.results || [])];
        
        // Stop if no more results
        if (!data.results || data.results.length === 0) break;
      }
      
      results = results.slice(0, limit);
      console.log(`Total results: ${results.length}`);
    }

    // ===== DEDUPLICATION =====
    // Remove duplicates based on TMDB ID (primary) or title+year (secondary)
    const seenIds = new Set<number>();
    const seenTitles = new Set<string>();
    const uniqueResults: any[] = [];
    
    for (const item of results) {
      // Check by TMDB ID first
      if (item.id && seenIds.has(item.id)) {
        continue;
      }
      
      // Check by title+year as secondary check
      const titleKey = `${(item.title || item.name || '').toLowerCase().trim()}_${item.release_date || item.first_air_date || ''}`;
      if (seenTitles.has(titleKey)) {
        continue;
      }
      
      // Add to unique results
      if (item.id) seenIds.add(item.id);
      seenTitles.add(titleKey);
      uniqueResults.push(item);
    }
    
    console.log(`Deduplication: ${results.length} -> ${uniqueResults.length} (removed ${results.length - uniqueResults.length} duplicates)`);
    results = uniqueResults;

    // Fetch additional details for each result
    const detailedResults = [];
    
    console.log('Fetching detailed info for each result...');
    
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      
      try {
        // Add small delay every 10 requests to avoid rate limiting
        if (i > 0 && i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Fetch full details including credits and videos
        const detailUrl = `${TMDB_BASE_URL}/${type}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,external_ids,release_dates,content_ratings`;
        const response = await fetch(detailUrl);
        
        if (!response.ok) {
          console.error(`Failed to fetch details for ${item.id}: ${response.status}`);
          continue;
        }
        
        const details = await response.json();
        
        // Get certification/rating
        let certification = '';
        if (type === 'movie' && details.release_dates?.results) {
          const usRelease = details.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
          if (usRelease?.release_dates?.[0]?.certification) {
            certification = usRelease.release_dates[0].certification;
          }
        } else if (type === 'tv' && details.content_ratings?.results) {
          const usRating = details.content_ratings.results.find((r: any) => r.iso_3166_1 === 'US');
          if (usRating?.rating) {
            certification = usRating.rating;
          }
        }
        
        // Get trailer
        const trailer = details.videos?.results?.find(
          (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
        );
        
        detailedResults.push({
          id: item.id,
          title: item.title || item.name,
          originalTitle: item.original_title || item.original_name,
          year: parseInt((item.release_date || item.first_air_date || '').split('-')[0]) || 0,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
          rating: item.vote_average || 0,
          voteCount: item.vote_count || 0,
          popularity: item.popularity || 0,
          overview: item.overview || '',
          genres: details.genres?.map((g: any) => g.name).join(', ') || '',
          genreIds: details.genres?.map((g: any) => g.id) || [],
          type: type,
          // Movie specific
          duration: details.runtime || 0,
          budget: details.budget || 0,
          revenue: details.revenue || 0,
          status: details.status || '',
          tagline: details.tagline || '',
          // TV specific
          seasons: details.number_of_seasons || 0,
          totalEpisodes: details.number_of_episodes || 0,
          episodeRunTime: details.episode_run_time || [],
          firstAirDate: details.first_air_date || '',
          lastAirDate: details.last_air_date || '',
          networks: details.networks?.map((n: any) => n.name) || [],
          // Cast (all available, not just 10)
          casts: details.credits?.cast?.map((c: any) => ({
            name: c.name,
            role: c.character,
            photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          })) || [],
          // Crew
          director: details.credits?.crew?.find((c: any) => c.job === 'Director')?.name || '',
          writers: details.credits?.crew?.filter((c: any) => c.department === 'Writing').map((c: any) => c.name).slice(0, 3) || [],
          // External IDs
          imdbId: details.external_ids?.imdb_id || '',
          tvdbId: details.external_ids?.tvdb_id || null,
          // Video
          trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
          // Certification
          certification,
          // Languages
          originalLanguage: details.original_language || '',
          spokenLanguages: details.spoken_languages?.map((l: any) => l.english_name) || [],
          // Production
          productionCompanies: details.production_companies?.map((c: any) => c.name) || [],
          productionCountries: details.production_countries?.map((c: any) => c.name) || [],
        });
        
      } catch (e) {
        console.error(`Error processing item ${item.id}:`, e);
      }
    }

    console.log(`Returning ${detailedResults.length} detailed results`);

    return NextResponse.json({
      results: detailedResults,
      total: detailedResults.length,
      requested: limit,
      success: true,
    });
  } catch (error: any) {
    console.error('TMDB search error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch from TMDB',
      details: error?.message || 'Unknown error',
    }, { status: 500 });
  }
}
