CREATE OR REPLACE FUNCTION public.can_manage_pipeline(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
      AND active = true
      AND role IN ('owner', 'admin', 'manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.renumber_funnel_stages(p_funnel_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ordered AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY "order", created_at, id) AS new_order
    FROM public.stages
    WHERE funnel_id = p_funnel_id
  )
  UPDATE public.stages AS s
  SET "order" = ordered.new_order
  FROM ordered
  WHERE s.id = ordered.id;
$$;

CREATE OR REPLACE FUNCTION public.create_funnel_with_default_stages(
  p_organization_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_funnel_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  IF NOT public.can_manage_pipeline(p_organization_id) THEN
    RAISE EXCEPTION 'Você não tem permissão para gerenciar funis.';
  END IF;

  IF NULLIF(BTRIM(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'O nome do funil é obrigatório.';
  END IF;

  INSERT INTO public.funnels (
    organization_id,
    name,
    description,
    active,
    created_by
  )
  VALUES (
    p_organization_id,
    BTRIM(p_name),
    NULLIF(BTRIM(COALESCE(p_description, '')), ''),
    true,
    v_user_id
  )
  RETURNING id INTO v_funnel_id;

  INSERT INTO public.stages (organization_id, funnel_id, name, "order", color, probability)
  VALUES
    (p_organization_id, v_funnel_id, 'Prospecção', 1, '#6C7A89', 10),
    (p_organization_id, v_funnel_id, 'Qualificação', 2, '#3498DB', 25),
    (p_organization_id, v_funnel_id, 'Proposta Enviada', 3, '#2E86C1', 50),
    (p_organization_id, v_funnel_id, 'Negociação', 4, '#F39C12', 75),
    (p_organization_id, v_funnel_id, 'Fechamento', 5, '#27AE60', 90);

  RETURN v_funnel_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_stages(
  p_funnel_id UUID,
  p_stage_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_stage_count INTEGER;
BEGIN
  SELECT organization_id
  INTO v_org_id
  FROM public.funnels
  WHERE id = p_funnel_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Funil não encontrado.';
  END IF;

  IF NOT public.can_manage_pipeline(v_org_id) THEN
    RAISE EXCEPTION 'Você não tem permissão para reordenar etapas.';
  END IF;

  SELECT COUNT(*)
  INTO v_stage_count
  FROM public.stages
  WHERE funnel_id = p_funnel_id;

  IF v_stage_count = 0 THEN
    RAISE EXCEPTION 'Nenhuma etapa encontrada para este funil.';
  END IF;

  IF COALESCE(array_length(p_stage_ids, 1), 0) <> v_stage_count THEN
    RAISE EXCEPTION 'A lista enviada para reordenação está incompleta.';
  END IF;

  IF (
    SELECT COUNT(DISTINCT stage_id)
    FROM unnest(p_stage_ids) AS input(stage_id)
  ) <> v_stage_count THEN
    RAISE EXCEPTION 'A lista enviada para reordenação contém etapas duplicadas.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(p_stage_ids) AS input(stage_id)
    LEFT JOIN public.stages s
      ON s.id = input.stage_id
     AND s.funnel_id = p_funnel_id
    WHERE s.id IS NULL
  ) THEN
    RAISE EXCEPTION 'A lista enviada para reordenação contém etapas inválidas.';
  END IF;

  UPDATE public.stages AS s
  SET "order" = ordered.position
  FROM (
    SELECT stage_id, ordinality AS position
    FROM unnest(p_stage_ids) WITH ORDINALITY AS input(stage_id, ordinality)
  ) AS ordered
  WHERE s.id = ordered.stage_id
    AND s.funnel_id = p_funnel_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_stage_if_empty(p_stage_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_funnel_id UUID;
BEGIN
  SELECT organization_id, funnel_id
  INTO v_org_id, v_funnel_id
  FROM public.stages
  WHERE id = p_stage_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Etapa não encontrada.';
  END IF;

  IF NOT public.can_manage_pipeline(v_org_id) THEN
    RAISE EXCEPTION 'Você não tem permissão para excluir etapas.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.opportunities
    WHERE stage_id = p_stage_id
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir uma etapa que possui negócios vinculados.';
  END IF;

  DELETE FROM public.stages
  WHERE id = p_stage_id;

  PERFORM public.renumber_funnel_stages(v_funnel_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_funnel_if_empty(p_funnel_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT organization_id
  INTO v_org_id
  FROM public.funnels
  WHERE id = p_funnel_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Funil não encontrado.';
  END IF;

  IF NOT public.can_manage_pipeline(v_org_id) THEN
    RAISE EXCEPTION 'Você não tem permissão para excluir funis.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.opportunities
    WHERE funnel_id = p_funnel_id
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir um funil que possui negócios vinculados.';
  END IF;

  DELETE FROM public.funnels
  WHERE id = p_funnel_id;
END;
$$;

CREATE POLICY "Create funnels as owner admin manager"
  ON public.funnels FOR INSERT
  WITH CHECK (public.can_manage_pipeline(organization_id));

CREATE POLICY "Update funnels as owner admin manager"
  ON public.funnels FOR UPDATE
  USING (public.can_manage_pipeline(organization_id))
  WITH CHECK (public.can_manage_pipeline(organization_id));

CREATE POLICY "Delete funnels as owner admin manager"
  ON public.funnels FOR DELETE
  USING (public.can_manage_pipeline(organization_id));

CREATE POLICY "Create stages as owner admin manager"
  ON public.stages FOR INSERT
  WITH CHECK (public.can_manage_pipeline(organization_id));

CREATE POLICY "Update stages as owner admin manager"
  ON public.stages FOR UPDATE
  USING (public.can_manage_pipeline(organization_id))
  WITH CHECK (public.can_manage_pipeline(organization_id));

CREATE POLICY "Delete stages as owner admin manager"
  ON public.stages FOR DELETE
  USING (public.can_manage_pipeline(organization_id));
