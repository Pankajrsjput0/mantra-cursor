// Database types
export interface Novel {
  novel_id: string;
  title: string;
  author: string;
  views: number;
  leading_character: 'male' | 'female';
  upload_by: string;
  genre: string[];
  story: string;
  novel_coverpage: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Chapter {
  chapter_id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  views: number;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  age: number | null;
  interest_genre: string[];
  created_at: string;
  updated_at?: string;
}

export interface ReadingProgress {
  user_id: string;
  novel_id: string;
  chapter_id: string;
  lastread_at: string;
}

export interface LibraryEntry {
  library_id: string;
  user_id: string;
  novel_id: string;
  created_at: string;
}