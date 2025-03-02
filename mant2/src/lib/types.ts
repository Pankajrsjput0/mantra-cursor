export interface Novel {
  id: string;
  title: string;
  author: string;
  genre: string[];
  leading_character: 'male' | 'female';
  story: string;
  novel_coverpage: string | null;
  upload_by: string;
  views: number;
  created_at: string;
} 