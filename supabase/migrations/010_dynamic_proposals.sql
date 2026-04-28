INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposals',
  'proposals',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposal_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  template_id UUID REFERENCES proposal_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_docx_url TEXT,
  generated_docx_path TEXT,
  generated_pdf_url TEXT,
  generated_pdf_path TEXT,
  generated_at TIMESTAMPTZ,
  generated_by UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS source_draft_id UUID REFERENCES proposal_drafts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS file_format TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (file_format IN ('uploaded', 'pdf', 'docx'));

CREATE INDEX idx_proposal_templates_organization_id ON proposal_templates(organization_id);
CREATE INDEX idx_proposal_drafts_organization_id ON proposal_drafts(organization_id);
CREATE INDEX idx_proposal_drafts_opportunity_id ON proposal_drafts(opportunity_id);
CREATE INDEX idx_proposals_source_draft_id ON proposals(source_draft_id);

CREATE TRIGGER update_proposal_templates_updated_at
  BEFORE UPDATE ON proposal_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_proposal_drafts_updated_at
  BEFORE UPDATE ON proposal_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View proposal templates in organization"
  ON proposal_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Manage proposal templates by role"
  ON proposal_templates FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND active = true
        AND role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND active = true
        AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "View proposal drafts in organization"
  ON proposal_drafts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Insert proposal drafts in organization"
  ON proposal_drafts FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Update proposal drafts in organization"
  ON proposal_drafts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Delete proposal drafts by owner or manager"
  ON proposal_drafts FOR DELETE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND active = true
        AND role IN ('owner', 'admin', 'manager')
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'View proposal files in own organization'
  ) THEN
    CREATE POLICY "View proposal files in own organization"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'proposals'
        AND EXISTS (
          SELECT 1
          FROM organization_members
          WHERE user_id = auth.uid()
            AND active = true
            AND organization_id::text = (storage.foldername(name))[1]
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Upload proposal files in own organization'
  ) THEN
    CREATE POLICY "Upload proposal files in own organization"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'proposals'
        AND EXISTS (
          SELECT 1
          FROM organization_members
          WHERE user_id = auth.uid()
            AND active = true
            AND organization_id::text = (storage.foldername(name))[1]
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Delete proposal files in own organization'
  ) THEN
    CREATE POLICY "Delete proposal files in own organization"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'proposals'
        AND EXISTS (
          SELECT 1
          FROM organization_members
          WHERE user_id = auth.uid()
            AND active = true
            AND organization_id::text = (storage.foldername(name))[1]
        )
      );
  END IF;
END $$;
