INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-images',
  'note-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp', 'image/gif')),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_note_attachments_note_id ON note_attachments(note_id);
CREATE INDEX idx_note_attachments_opportunity_id ON note_attachments(opportunity_id);

ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View note attachments in organization"
  ON note_attachments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Insert note attachments in organization"
  ON note_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Delete note attachments by owner or manager"
  ON note_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM notes
      WHERE notes.id = note_attachments.note_id
        AND notes.user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND active = true
        AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "View note images in own organization"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'note-images'
    AND EXISTS (
      SELECT 1
      FROM organization_members
      WHERE user_id = auth.uid()
        AND active = true
        AND organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Upload note images in own organization"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'note-images'
    AND EXISTS (
      SELECT 1
      FROM organization_members
      WHERE user_id = auth.uid()
        AND active = true
        AND organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Delete note images in own organization"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'note-images'
    AND EXISTS (
      SELECT 1
      FROM organization_members
      WHERE user_id = auth.uid()
        AND active = true
        AND organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE OR REPLACE FUNCTION delete_opportunity_cascade(opp_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM note_attachments WHERE opportunity_id = opp_id;
  DELETE FROM proposals        WHERE opportunity_id = opp_id;
  DELETE FROM notes            WHERE opportunity_id = opp_id;
  DELETE FROM activities       WHERE opportunity_id = opp_id;
  DELETE FROM opportunities    WHERE id = opp_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_opportunity_cascade(UUID) TO authenticated;
