-- Restrict private medical-document objects to the family encoded in the first path segment.
-- Expected object path: <family_uuid>/<parent_uuid>/<random_uuid>-<sanitized_filename>

DROP POLICY IF EXISTS "Allow authenticated users to upload medical documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read medical documents" ON storage.objects;

CREATE POLICY "Family members can read medical objects"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'medical-documents'
    AND EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = ((storage.foldername(name))[1])::uuid
    )
);

CREATE POLICY "Authorized family members can upload medical objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'medical-documents'
    AND EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = ((storage.foldername(name))[1])::uuid
          AND fm.can_upload_documents = true
    )
);

CREATE POLICY "Authorized family members can manage medical objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'medical-documents'
    AND EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = ((storage.foldername(name))[1])::uuid
          AND fm.can_upload_documents = true
    )
)
WITH CHECK (
    bucket_id = 'medical-documents'
    AND EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = ((storage.foldername(name))[1])::uuid
          AND fm.can_upload_documents = true
    )
);

CREATE POLICY "Authorized family members can delete medical objects"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'medical-documents'
    AND EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = ((storage.foldername(name))[1])::uuid
          AND fm.can_upload_documents = true
    )
);
