-- Enable Row Level Security (RLS) for all tables
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Novels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chapters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Library" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reading_Progress" ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Public profiles are viewable by everyone" ON "Users"
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON "Users"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Create profile on signup" ON "Users"
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Novels Table Policies
CREATE POLICY "Novels are viewable by everyone" ON "Novels"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create novels" ON "Novels"
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = upload_by);

CREATE POLICY "Authors can update own novels" ON "Novels"
FOR UPDATE USING (auth.uid() = upload_by);

CREATE POLICY "Authors can delete own novels" ON "Novels"
FOR DELETE USING (auth.uid() = upload_by);

-- Chapters Table Policies
CREATE POLICY "Chapters are viewable by everyone" ON "Chapters"
FOR SELECT USING (true);

CREATE POLICY "Authors can create chapters" ON "Chapters"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Novels"
    WHERE novel_id = "Chapters".novel_id
    AND upload_by = auth.uid()
  )
);

CREATE POLICY "Authors can update own chapters" ON "Chapters"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "Novels"
    WHERE novel_id = "Chapters".novel_id
    AND upload_by = auth.uid()
  )
);

CREATE POLICY "Authors can delete own chapters" ON "Chapters"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "Novels"
    WHERE novel_id = "Chapters".novel_id
    AND upload_by = auth.uid()
  )
);

-- Library Table Policies
CREATE POLICY "Users can view own library" ON "Library"
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to library" ON "Library"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from library" ON "Library"
FOR DELETE USING (auth.uid() = user_id);

-- Reading Progress Table Policies
CREATE POLICY "Users can view own reading progress" ON "Reading_Progress"
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reading progress" ON "Reading_Progress"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update reading progress" ON "Reading_Progress"
FOR UPDATE USING (auth.uid() = user_id);

-- Storage Bucket Policies for Profile Pictures
CREATE POLICY "Public profiles are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_pictures');

CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile_pictures' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile_pictures' AND
  auth.role() = 'authenticated'
);

-- Updated Storage Bucket Policies for Novel Covers
CREATE POLICY "Novel covers are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'novel_covers');

-- New simplified policy for novel cover uploads
CREATE POLICY "Any authenticated user can upload novel covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'novel_covers' AND
  auth.role() = 'authenticated'
);

-- Allow updating novel covers
CREATE POLICY "Any authenticated user can update novel covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'novel_covers' AND
  auth.role() = 'authenticated'
);

-- Allow deleting novel covers
CREATE POLICY "Any authenticated user can delete novel covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'novel_covers' AND
  auth.role() = 'authenticated'
);

-- Functions for incrementing views
CREATE OR REPLACE FUNCTION increment_novel_views(novel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "Novels"
  SET views = views + 1
  WHERE novel_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_chapter_views(chapter_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "Chapters"
  SET views = COALESCE(views, 0) + 1
  WHERE chapter_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."Users" (user_id, email, username, created_at)
  VALUES (new.id, new.email, new.email, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();