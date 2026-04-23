-- =============================================
-- POLÍTICAS DE DELETE (ausentes no schema inicial)
-- =============================================

-- Oportunidades: owner da opp ou admin/manager/owner da org pode excluir
CREATE POLICY "Delete opportunities based on role"
  ON opportunities FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND active = true
        AND (
          role IN ('owner', 'admin', 'manager')
          OR (role = 'member' AND owner_id = auth.uid())
        )
    )
  );

-- Activities e proposals: qualquer membro da org pode excluir (registros filhos)
CREATE POLICY "Delete activities in organization"
  ON activities FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Delete proposals in organization"
  ON proposals FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- =============================================
-- FUNÇÃO DE EXCLUSÃO EM CASCATA (backup via RPC)
-- =============================================
CREATE OR REPLACE FUNCTION delete_opportunity_cascade(opp_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM proposals  WHERE opportunity_id = opp_id;
  DELETE FROM notes      WHERE opportunity_id = opp_id;
  DELETE FROM activities WHERE opportunity_id = opp_id;
  DELETE FROM opportunities WHERE id = opp_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_opportunity_cascade(UUID) TO authenticated;
