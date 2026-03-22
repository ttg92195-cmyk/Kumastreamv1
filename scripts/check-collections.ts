import { db } from '../src/lib/db';

const COLLECTIONS_TO_CHECK = [
  'Marvel', 'DC', 'Harry Potter', 'Star Wars', 'James Bond',
  'Fast & Furious', 'John Wick', 'Mission Impossible', 'Transformers',
  'X-Men', 'Spider-Man', 'Batman', 'American Pie', 'Final Destination',
  'Saw', 'Scooby-Doo', 'Studio Ghibli', 'Tom & Jerry', 'Detective Chinatown',
  'The Conjuring', 'Jurassic', 'Pirates of the Caribbean', 'MonsterVerse',
  'Despicable Me', '007', 'Lord of the Rings', 'A24', 'Thai GDH'
];

const UNIVERSE_KEYWORDS: Record<string, string[]> = {
  'Marvel': ['Marvel', 'Iron Man', 'Thor', 'Captain America', 'Avengers', 'Guardians of the Galaxy', 'X-Men', 'Deadpool', 'Ant-Man', 'Doctor Strange', 'Black Panther', 'Captain Marvel', 'Black Widow', 'Venom', 'Wolverine', 'Hulk', 'Fantastic Four', 'Eternals', 'Shang-Chi'],
  'DC': ['DC', 'Batman', 'Superman', 'Wonder Woman', 'Aquaman', 'Flash', 'Justice League', 'Joker', 'Suicide Squad', 'Shazam', 'Green Lantern', 'Black Adam', 'Blue Beetle', 'Man of Steel'],
  'The Conjuring': ['Conjuring', 'Annabelle', 'Nun', 'La Llorona'],
  'Jurassic': ['Jurassic Park', 'Jurassic World', 'Jurassic'],
  'MonsterVerse': ['Godzilla', 'King Kong', 'Kong', 'Skull Island', 'Monarch'],
  'Despicable Me': ['Despicable Me', 'Minions'],
  '007': ['James Bond', '007', 'Bond', 'Casino Royale', 'Skyfall', 'Spectre', 'No Time to Die', 'GoldenEye', 'Die Another Day'],
  'Lord of the Rings': ['Lord of the Rings', 'The Hobbit', 'Middle Earth', 'Fellowship', 'Two Towers', 'Return of the King', 'Rings of Power'],
  'Harry Potter': ['Harry Potter', 'Hogwarts', 'Potter', 'Fantastic Beasts'],
  'Star Wars': ['Star Wars', 'Skywalker', 'Vader', 'Jedi', 'Sith', 'Mandalorian', 'Grogu', 'Force Awakens', 'Last Jedi', 'Rise of Skywalker', 'Rogue One'],
  'James Bond': ['James Bond', '007', 'Bond', 'Casino Royale', 'Skyfall'],
  'Batman': ['Batman', 'Dark Knight', 'Joker', 'Gotham'],
  'Spider-Man': ['Spider-Man', 'Spiderman', 'Spider-Verse', 'Homecoming', 'Far From Home', 'No Way Home', 'Across the Spider-Verse', 'Into the Spider-Verse'],
  'X-Men': ['X-Men', 'Wolverine', 'Logan', 'Deadpool', 'Magneto'],
  'Saw': ['Saw'],
  'Studio Ghibli': ['Ghibli', 'Totoro', 'Spirited Away', 'Howl', 'Princess Mononoke', 'Kiki', 'Ponyo', 'Wind Rises', 'Grave of the Fireflies', 'Castle in the Sky', 'Nausicaa'],
  'Tom & Jerry': ['Tom & Jerry', 'Tom and Jerry'],
  'Detective Chinatown': ['Detective Chinatown'],
  'A24': ['A24'],
  'Scooby-Doo': ['Scooby-Doo', 'Scooby Doo', 'Scoob'],
  'American Pie': ['American Pie'],
  'Final Destination': ['Final Destination'],
  'Fast & Furious': ['Fast & Furious', 'Fast and Furious', 'Furious', 'Tokyo Drift'],
  'John Wick': ['John Wick', 'Wick'],
  'Mission Impossible': ['Mission Impossible', 'Mission: Impossible'],
  'Transformers': ['Transformers', 'Bumblebee', 'Autobots'],
  'Pirates of the Caribbean': ['Pirates of the Caribbean', 'Jack Sparrow'],
  'Thai GDH': ['Thai GDH', 'GDH', 'Bad Genius', 'Phobia', 'Pee Mak', 'Friend Zone', 'Hello Stranger'],
};

async function main() {
  console.log('Checking collections in database...\n');
  
  const results: { collection: string; movieCount: number; seriesCount: number; hasContent: boolean }[] = [];
  
  for (const collection of COLLECTIONS_TO_CHECK) {
    const keywords = UNIVERSE_KEYWORDS[collection] || [collection];
    
    let movieCount = 0;
    let seriesCount = 0;
    
    for (const keyword of keywords) {
      const movies = await db.movie.count({
        where: {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { collections: { contains: keyword, mode: 'insensitive' } }
          ]
        }
      });
      
      const seriesCount2 = await db.series.count({
        where: {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { collections: { contains: keyword, mode: 'insensitive' } }
          ]
        }
      });
      
      movieCount += movies;
      seriesCount += seriesCount2;
    }
    
    const hasContent = movieCount > 0 || seriesCount > 0;
    results.push({ collection, movieCount, seriesCount, hasContent });
    
    console.log(`${collection}: ${movieCount} movies, ${seriesCount} series ${hasContent ? '✅' : '❌'}`);
  }
  
  console.log('\n=== Collections WITH content ===');
  const withContent = results.filter(r => r.hasContent).map(r => r.collection);
  console.log(withContent.join(', '));
  
  console.log('\n=== Collections WITHOUT content ===');
  const withoutContent = results.filter(r => !r.hasContent).map(r => r.collection);
  console.log(withoutContent.join(', '));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
