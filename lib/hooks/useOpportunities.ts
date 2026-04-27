'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export type Funnel = {
  id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

export type Opportunity = {
  id: string
  title: string
  value: number
  stage_id: string
  client_id: string
  owner_id: string
  status: 'open' | 'won' | 'lost'
  lost_reason?: string | null
  closed_at?: string | null
  payment_type?: 'cash' | 'installment' | null
  installments?: number | null
  lead_temperature?: 'cold' | 'warm' | 'hot' | null
  client?: { name: string }
  owner?: { full_name: string }
  product?: { name: string } | null
}

export type Stage = {
  id: string
  name: string
  order: number
  color: string
  funnel_id: string
}

type StageInput = {
  name: string
  color: string
}

type FunnelInput = {
  name: string
  description?: string | null
}

function normalizeText(value: string) {
  return value.trim()
}

function toError(value: unknown, fallback: string) {
  if (value instanceof Error) return value
  if (typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string') {
    return new Error(value.message)
  }
  return new Error(fallback)
}

export function useOpportunities(selectedFunnelIdParam?: string | null) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [wonOpportunities, setWonOpportunities] = useState<Opportunity[]>([])
  const [lostOpportunities, setLostOpportunities] = useState<Opportunity[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [memberRole, setMemberRole] = useState<'owner' | 'admin' | 'manager' | 'member' | null>(null)
  const [selectedFunnelId, setSelectedFunnelIdState] = useState<string | null>(null)
  const supabase = createClient()

  async function fetchData(requestedFunnelId?: string | null) {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setFunnels([])
      setStages([])
      setOpportunities([])
      setWonOpportunities([])
      setLostOpportunities([])
      setSelectedFunnelIdState(null)
      setOrgId(null)
      setMemberRole(null)
      setLoading(false)
      return
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!member) {
      setFunnels([])
      setStages([])
      setOpportunities([])
      setWonOpportunities([])
      setLostOpportunities([])
      setSelectedFunnelIdState(null)
      setOrgId(null)
      setMemberRole(null)
      setLoading(false)
      return
    }
    setOrgId(member.organization_id)
    setMemberRole(member.role)

    const { data: funnelsData } = await supabase
      .from('funnels')
      .select('id, name, description, active, created_at')
      .eq('organization_id', member.organization_id)
      .eq('active', true)
      .order('created_at', { ascending: true })

    const activeFunnels = funnelsData ?? []
    setFunnels(activeFunnels)

    if (activeFunnels.length === 0) {
      setStages([])
      setOpportunities([])
      setWonOpportunities([])
      setLostOpportunities([])
      setSelectedFunnelIdState(null)
      setLoading(false)
      return
    }

    const requestedSelection = requestedFunnelId !== undefined
      ? requestedFunnelId
      : selectedFunnelId

    const resolvedFunnelId = activeFunnels.some(funnel => funnel.id === requestedSelection)
      ? requestedSelection!
      : activeFunnels[0].id

    setSelectedFunnelIdState(resolvedFunnelId)

    const select = '*, client:clients(name), owner:profiles!opportunities_owner_id_fkey_profiles(full_name), product:products(name)'

    const [
      { data: stagesData },
      { data: openData },
      { data: wonData },
      { data: lostData },
    ] = await Promise.all([
      supabase.from('stages').select('*').eq('funnel_id', resolvedFunnelId).order('order', { ascending: true }),
      supabase.from('opportunities').select(select).eq('funnel_id', resolvedFunnelId).eq('status', 'open'),
      supabase.from('opportunities').select(select).eq('funnel_id', resolvedFunnelId).eq('status', 'won').order('closed_at', { ascending: false }),
      supabase.from('opportunities').select(select).eq('funnel_id', resolvedFunnelId).eq('status', 'lost').order('closed_at', { ascending: false }),
    ])

    setStages(stagesData || [])
    setOpportunities(openData || [])
    setWonOpportunities(wonData || [])
    setLostOpportunities(lostData || [])
    setLoading(false)
  }

  async function moveOpportunity(opportunityId: string, newStageId: string) {
    const originalStageId = opportunities.find(opp => opp.id === opportunityId)?.stage_id
    if (!originalStageId || originalStageId === newStageId) {
      return { error: null }
    }

    setOpportunities(prev =>
      prev.map(opp =>
        opp.id === opportunityId ? { ...opp, stage_id: newStageId } : opp
      )
    )

    const { error } = await supabase
      .from('opportunities')
      .update({ stage_id: newStageId })
      .eq('id', opportunityId)

    if (error) {
      setOpportunities(prev =>
        prev.map(opp =>
          opp.id === opportunityId ? { ...opp, stage_id: originalStageId } : opp
        )
      )
    } else if (orgId) {
      const { data: { user } } = await supabase.auth.getUser()
      supabase.from('activities').insert({
        organization_id: orgId,
        opportunity_id: opportunityId,
        user_id: user?.id,
        type: 'stage_change',
        description: 'Moveu a oportunidade para outra etapa',
        metadata: { new_stage_id: newStageId },
      })
    }

    return { error }
  }

  async function setSelectedFunnelId(nextFunnelId: string) {
    if (nextFunnelId === selectedFunnelId) return
    setSelectedFunnelIdState(nextFunnelId)
    await fetchData(nextFunnelId)
  }

  async function createFunnel(input: FunnelInput) {
    if (!orgId) return { error: new Error('Organização não encontrada.'), data: null }
    if (!normalizeText(input.name)) return { error: new Error('O nome do funil é obrigatório.'), data: null }

    const { data, error } = await supabase.rpc('create_funnel_with_default_stages', {
      p_organization_id: orgId,
      p_name: normalizeText(input.name),
      p_description: input.description?.trim() || null,
    })

    if (error || !data) {
      return { error: toError(error, 'Não foi possível criar o funil.'), data: null }
    }

    setSelectedFunnelIdState(data)
    await fetchData(data)
    return { error: null, data }
  }

  async function updateFunnel(funnelId: string, input: FunnelInput) {
    if (!normalizeText(input.name)) return { error: new Error('O nome do funil é obrigatório.') }

    const { error } = await supabase
      .from('funnels')
      .update({
        name: normalizeText(input.name),
        description: input.description?.trim() || null,
      })
      .eq('id', funnelId)

    if (error) return { error: toError(error, 'Não foi possível atualizar o funil.') }

    setFunnels(prev =>
      prev.map(funnel =>
        funnel.id === funnelId
          ? {
              ...funnel,
              name: normalizeText(input.name),
              description: input.description?.trim() || null,
            }
          : funnel
      )
    )

    return { error: null }
  }

  async function deleteFunnel(funnelId: string) {
    const remainingFunnels = funnels.filter(funnel => funnel.id !== funnelId)
    const nextFunnelId = remainingFunnels[0]?.id ?? null

    const { error } = await supabase.rpc('delete_funnel_if_empty', {
      p_funnel_id: funnelId,
    })

    if (error) return { error: toError(error, 'Não foi possível excluir o funil.') }

    setSelectedFunnelIdState(nextFunnelId)
    await fetchData(nextFunnelId)
    return { error: null }
  }

  async function createStage(input: StageInput) {
    if (!orgId || !selectedFunnelId) {
      return { error: new Error('Selecione um funil antes de criar etapas.'), data: null }
    }
    if (!normalizeText(input.name)) {
      return { error: new Error('O nome da etapa é obrigatório.'), data: null }
    }

    const nextOrder = (stages.at(-1)?.order ?? 0) + 1

    const { data, error } = await supabase
      .from('stages')
      .insert({
        organization_id: orgId,
        funnel_id: selectedFunnelId,
        name: normalizeText(input.name),
        color: input.color,
        probability: 50,
        order: nextOrder,
      })
      .select('*')
      .single()

    if (error || !data) {
      return { error: toError(error, 'Não foi possível criar a etapa.'), data: null }
    }

    setStages(prev => [...prev, data].sort((a, b) => a.order - b.order))
    return { error: null, data }
  }

  async function updateStage(stageId: string, input: StageInput) {
    if (!normalizeText(input.name)) return { error: new Error('O nome da etapa é obrigatório.') }

    const { error } = await supabase
      .from('stages')
      .update({
        name: normalizeText(input.name),
        color: input.color,
      })
      .eq('id', stageId)

    if (error) return { error: toError(error, 'Não foi possível atualizar a etapa.') }

    setStages(prev =>
      prev.map(stage =>
        stage.id === stageId
          ? { ...stage, name: normalizeText(input.name), color: input.color }
          : stage
      )
    )

    return { error: null }
  }

  async function reorderStages(nextStageIds: string[]) {
    if (!selectedFunnelId) {
      return { error: new Error('Selecione um funil antes de reordenar etapas.') }
    }

    const previousStages = stages
    const stageMap = new Map(previousStages.map(stage => [stage.id, stage]))
    const reorderedStages = nextStageIds
      .map((stageId, index) => {
        const stage = stageMap.get(stageId)
        if (!stage) return null
        return { ...stage, order: index + 1 }
      })
      .filter((stage): stage is Stage => stage !== null)

    setStages(reorderedStages)

    const { error } = await supabase.rpc('reorder_stages', {
      p_funnel_id: selectedFunnelId,
      p_stage_ids: nextStageIds,
    })

    if (error) {
      setStages(previousStages)
      return { error: toError(error, 'Não foi possível reordenar as etapas.') }
    }

    return { error: null }
  }

  async function deleteStage(stageId: string) {
    const { error } = await supabase.rpc('delete_stage_if_empty', {
      p_stage_id: stageId,
    })

    if (error) return { error: toError(error, 'Não foi possível excluir a etapa.') }

    await fetchData()
    return { error: null }
  }

  useEffect(() => {
    fetchData(selectedFunnelIdParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunnelIdParam])

  useEffect(() => {
    if (!orgId || !selectedFunnelId) return

    const channel = supabase
      .channel(`pipeline-products-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          void fetchData(selectedFunnelId)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, selectedFunnelId])

  return {
    opportunities,
    wonOpportunities,
    lostOpportunities,
    stages,
    funnels,
    loading,
    selectedFunnelId,
    memberRole,
    canManageStructure: memberRole === 'owner' || memberRole === 'admin' || memberRole === 'manager',
    moveOpportunity,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    setSelectedFunnelId,
    createStage,
    updateStage,
    reorderStages,
    deleteStage,
    refresh: fetchData,
  }
}
