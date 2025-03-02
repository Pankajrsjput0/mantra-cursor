export const GENRES = [
  'Horror',
  'Fantasy',
  'Adventure',
  'Mystery',
  'Literary',
  'Dystopian',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Detective',
  'Urban',
  'Action',
  'ACG',
  'Games',
  'LGBT+',
  'War',
  'Realistic',
  'History',
  'Cherads',
  'General',
  'Teen',
  'Devotional',
  'Poetry'
] as const;

export type Genre = typeof GENRES[number];