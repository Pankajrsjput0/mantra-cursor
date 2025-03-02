/*
  # Fix storage buckets configuration

  1. Changes
     - Ensures the novel_covers bucket exists with correct configuration
     - Updates storage policies to allow authenticated users to upload files
  
  2. Reason
     - Fix issues with novel cover uploads failing with UUID errors
*/

-- Ensure novel_covers bucket exists with correct configuration
DO $$
BEGIN
  -- Create novel_covers bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('novel_covers', 'Novel Covers', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create profile_pictures bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile_pictures', 'Profile Pictures', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Update storage policies for novel covers
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Public novel covers are viewable by everyone" ON storage.objects;
  DROP POLICY IF EXISTS "Authors can upload novel covers" ON storage.objects;
  DROP POLICY IF EXISTS "Authors can update their novel covers" ON storage.objects;
  
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

-- Update storage policies for profile pictures
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
  
  -- Create new policies
  CREATE POLICY "Public profile pictures access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile_pictures');

  CREATE POLICY "Authenticated users can upload profile pictures"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'profile_pictures' AND
      auth.role() = 'authenticated'
    );

  CREATE POLICY "Authenticated users can update profile pictures"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'profile_pictures' AND
      auth.role() = 'authenticated'
    );
END $$;