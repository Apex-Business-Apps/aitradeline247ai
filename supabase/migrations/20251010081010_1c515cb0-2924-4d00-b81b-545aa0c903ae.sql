-- Create compliance storage bucket for LOA templates and signed documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance',
  'compliance',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for compliance bucket
-- Admin can upload templates
CREATE POLICY "Admins can upload LOA templates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance' 
  AND (storage.foldername(name))[1] = 'loa'
  AND (storage.foldername(name))[2] = 'templates'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admin can update templates
CREATE POLICY "Admins can update LOA templates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'compliance' 
  AND (storage.foldername(name))[1] = 'loa'
  AND (storage.foldername(name))[2] = 'templates'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Service role can manage all compliance files
CREATE POLICY "Service role full access to compliance bucket"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'compliance')
WITH CHECK (bucket_id = 'compliance');

-- Org members can view their org's templates
CREATE POLICY "Org members can view templates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance'
  AND (storage.foldername(name))[1] = 'loa'
  AND (storage.foldername(name))[2] = 'templates'
  AND EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.user_id = auth.uid()
    AND organization_members.org_id::text = (storage.foldername(name))[3]
  )
);

-- Org members can view their org's signed LOAs
CREATE POLICY "Org members can view signed LOAs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance'
  AND (storage.foldername(name))[1] = 'loa'
  AND (storage.foldername(name))[2] != 'templates'
  AND EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.user_id = auth.uid()
    AND organization_members.org_id::text = (storage.foldername(name))[2]
  )
);