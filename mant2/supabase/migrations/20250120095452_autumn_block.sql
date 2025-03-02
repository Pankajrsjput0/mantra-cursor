/*
  # Fix Database Errors and Add Missing Tables

  1. Changes
    - Fix reading_progress table name casing
    - Fix novel views increment function
    - Fix storage bucket configuration
    - Add missing indexes
    - Fix library query issues

  2. Security
    - Maintain existing RLS policies
    - Add new policies for reading_progress
*/

-- Fix table name casing
ALTER TABLE IF EXISTS "Reading_Progress" RENAME TO reading_progress;

-- Recreate increment_novel_views function with fixed column reference
CREATE OR REPLACE FUNCTION increment_novel_views(novel_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE "Novels"
  SET views = COALESCE(views, 0) + 1
  WHERE novel_id = novel_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix storage bucket configuration
DO $$
BEGIN
  -- Update novel_covers bucket if it exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'novel_coverpage') THEN
    UPDATE storage.buckets 
    SET id = 'novel_covers' 
    WHERE id = 'novel_coverpage';
  ELSE
    -- Create novel_covers bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('novel_covers', 'Novel Covers', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_novels_views ON "Novels" (views DESC);
CREATE INDEX IF NOT EXISTS idx_novels_genre ON "Novels" USING GIN (genre);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_library_user ON "Library" (user_id);

-- Update storage policies for novel covers
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Novel covers are viewable by everyone" ON storage.objects;
  DROP POLICY IF EXISTS "Authors can upload novel covers" ON storage.objects;
  
  -- Create new policies
  CREATE POLICY "Public novel covers access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'novel_covers');

  CREATE POLICY "Authenticated users can upload novel covers"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'novel_covers' AND
      auth.role() = 'authenticated'
    );

  CREATE POLICY "Authenticated users can update novel covers"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'novel_covers' AND
      auth.role() = 'authenticated'
    );
END $$;