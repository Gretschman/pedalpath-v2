-- ============================================================================
-- CREATE STORAGE BUCKET AND POLICIES
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create storage bucket (if doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('schematics', 'schematics', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for schematics bucket
CREATE POLICY "Users can upload schematics"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'schematics' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own schematics"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'schematics' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own schematics"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'schematics' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own schematics"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'schematics' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
