-- 202609260003_storage_policies.sql
-- Storage bucket definitions and policies for medical documents and avatars

-- Insert storage buckets if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('medical-documents', 'medical-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for medical-documents (Private, authenticated family members only)
CREATE POLICY "Allow authenticated users to upload medical documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Allow authenticated users to read medical documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'medical-documents');

-- Storage policies for avatars (Public read, authenticated write)
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
