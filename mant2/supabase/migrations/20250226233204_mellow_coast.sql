/*
  # Fix increment_novel_views function parameter

  1. Changes
     - Update the increment_novel_views function to accept a parameter named 'novel_uuid' instead of 'novel_id'
     - This fixes the 404 error when calling the RPC function from the client
  
  2. Reason
     - The client code is calling the function with parameter name 'novel_uuid'
     - But the function is defined to accept 'novel_id'
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS increment_novel_views(UUID);

-- Recreate the function with the correct parameter name
CREATE OR REPLACE FUNCTION increment_novel_views(novel_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE "Novels"
  SET views = views + 1
  WHERE novel_id = novel_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the increment_chapter_views function for consistency
DROP FUNCTION IF EXISTS increment_chapter_views(UUID);

CREATE OR REPLACE FUNCTION increment_chapter_views(chapter_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE "Chapters"
  SET views = COALESCE(views, 0) + 1
  WHERE chapter_id = chapter_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;