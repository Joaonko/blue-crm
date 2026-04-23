'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export type OpportunityDetail = {
  id: string
  title: string
  value: number
  status: 'open' | 'won' | 'lost'
  description: string | null
  expected_close_date: string | null
  probability: number | null
  lost_reason: string | null
  payment_type: 'cash' | 'installment' | null
  installments: number | null
  lead_temperature: 'cold' | 'warm' | 'hot' | null
  created_at: string
  organization_id: string
  funnel_id: string
  stage_id: string
  client_id: string
  owner_id: string
  product_id: string | null
  client: { id: string; name: string; contact_name: string; contact_email: string } | null
  stage: { id: string; name: string; color: string } | null
  product: { id: string; name: string } | null
  owner_name: string
}

export type Note = {
  id: string
  content: string
  created_at: string
  user_id: string
  author_name: string
}

export type Activity = {
  id: string
  type: string
  description: string
  created_at: string
  user_id: string
  author_name: string
  metadata: Record<string, unknown>
}

export type Proposal = {
  id: string
  title: string
  version: number
  file_url: string
  file_name: string
  file_size: number
  notes: string | null
  uploaded_at: string
  uploader_name: string
}

export function useOpportunityDetail(opportunityId: string) {
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [stages, setStages] = useState<{ id: string; name: string; color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchData() {
    setLoading(true)

    const [
      { data: opp },
      { data: notesData },
      { data: activitiesData },
      { data: proposalsData },
    ] = await Promise.all([
      supabase
        .from('opportunities')
        .select('*, client:clients(id, name, contact_name, contact_email), stage:stages(id, name, color), product:products(id, name)')
        .eq('id', opportunityId)
        .single(),
      supabase
        .from('notes')
        .select('id, content, created_at, user_id')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false }),
      supabase
        .from('activities')
        .select('id, type, description, created_at, user_id, metadata')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false }),
      supabase
        .from('proposals')
        .select('id, title, version, file_url, file_name, file_size, notes, uploaded_at, uploaded_by')
        .eq('opportunity_id', opportunityId)
        .order('uploaded_at', { ascending: false }),
    ])

    if (!opp) { setLoading(false); return }

    // Busca nomes dos autores
    const userIds = [
      ...new Set([
        opp.owner_id,
        ...(notesData ?? []).map((n: { user_id: string }) => n.user_id),
        ...(activitiesData ?? []).map((a: { user_id: string }) => a.user_id),
        ...(proposalsData ?? []).map((p: { uploaded_by: string }) => p.uploaded_by),
      ]),
    ]

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) ?? [])

    // Busca stages do funil
    const { data: stagesData } = await supabase
      .from('stages')
      .select('id, name, color')
      .eq('funnel_id', opp.funnel_id)
      .order('order', { ascending: true })

    setOpportunity({
      ...opp,
      client: Array.isArray(opp.client) ? opp.client[0] : opp.client,
      stage: Array.isArray(opp.stage) ? opp.stage[0] : opp.stage,
      product: Array.isArray(opp.product) ? opp.product[0] : opp.product,
      owner_name: profileMap.get(opp.owner_id) ?? 'Desconhecido',
    })
    setStages(stagesData ?? [])
    setNotes(
      (notesData ?? []).map((n: { id: string; content: string; created_at: string; user_id: string }) => ({
        ...n,
        author_name: profileMap.get(n.user_id) ?? 'Usuário',
      }))
    )
    setActivities(
      (activitiesData ?? []).map((a: { id: string; type: string; description: string; created_at: string; user_id: string; metadata: Record<string, unknown> }) => ({
        ...a,
        author_name: profileMap.get(a.user_id) ?? 'Usuário',
      }))
    )
    setProposals(
      (proposalsData ?? []).map((p: { id: string; title: string; version: number; file_url: string; file_name: string; file_size: number; notes: string | null; uploaded_at: string; uploaded_by: string }) => ({
        ...p,
        uploader_name: profileMap.get(p.uploaded_by) ?? 'Usuário',
      }))
    )
    setLoading(false)
  }

  async function addNote(content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !opportunity) return { error: new Error('Não autenticado') }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        organization_id: opportunity.organization_id,
        opportunity_id: opportunityId,
        user_id: user.id,
        content,
      })
      .select('id, content, created_at, user_id')
      .single()

    if (!error && data) {
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', user.id).single()
      setNotes(prev => [{
        ...data,
        author_name: profile?.full_name ?? 'Usuário',
      }, ...prev])

      await supabase.from('activities').insert({
        organization_id: opportunity.organization_id,
        opportunity_id: opportunityId,
        user_id: user.id,
        type: 'note',
        description: 'Adicionou uma nota',
      })
    }

    return { error }
  }

  async function deleteNote(noteId: string) {
    const { error } = await supabase.from('notes').delete().eq('id', noteId)
    if (!error) setNotes(prev => prev.filter(n => n.id !== noteId))
    return { error }
  }

  async function changeStage(newStageId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !opportunity) return

    const newStage = stages.find(s => s.id === newStageId)
    const { error } = await supabase
      .from('opportunities')
      .update({ stage_id: newStageId })
      .eq('id', opportunityId)

    if (!error) {
      setOpportunity(prev => prev ? { ...prev, stage_id: newStageId, stage: newStage ?? prev.stage } : prev)
      await supabase.from('activities').insert({
        organization_id: opportunity.organization_id,
        opportunity_id: opportunityId,
        user_id: user.id,
        type: 'stage_change',
        description: `Moveu para "${newStage?.name ?? 'nova etapa'}"`,
      })
      await fetchData()
    }
  }

  async function closeOpportunity(status: 'won' | 'lost', lostReason?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !opportunity) return

    const { error } = await supabase
      .from('opportunities')
      .update({ status, lost_reason: lostReason ?? null, closed_at: new Date().toISOString() })
      .eq('id', opportunityId)

    if (!error) {
      await supabase.from('activities').insert({
        organization_id: opportunity.organization_id,
        opportunity_id: opportunityId,
        user_id: user.id,
        type: 'status_change',
        description: status === 'won' ? 'Marcou como Ganho 🎉' : `Marcou como Perdido${lostReason ? `: ${lostReason}` : ''}`,
      })
      await fetchData()
    }
  }

  async function uploadProposal(file: File, title: string, notes: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !opportunity) return { error: new Error('Não autenticado') }

    const ext = file.name.split('.').pop()
    const path = `${opportunity.organization_id}/${opportunityId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('proposals')
      .upload(path, file)

    if (uploadError) return { error: uploadError }

    const { data: { publicUrl } } = supabase.storage.from('proposals').getPublicUrl(path)

    const nextVersion = proposals.length + 1

    const { error: insertError } = await supabase.from('proposals').insert({
      organization_id: opportunity.organization_id,
      opportunity_id: opportunityId,
      title,
      version: nextVersion,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user.id,
      notes: notes || null,
    })

    if (!insertError) {
      await supabase.from('activities').insert({
        organization_id: opportunity.organization_id,
        opportunity_id: opportunityId,
        user_id: user.id,
        type: 'proposal_upload',
        description: `Enviou proposta v${nextVersion}: ${title}`,
      })
      await fetchData()
    }

    return { error: insertError }
  }

  async function updateOpportunity(fields: {
    title?: string
    value?: number
    client_id?: string
    product_id?: string | null
    payment_type?: 'cash' | 'installment' | null
    installments?: number | null
    lead_temperature?: 'cold' | 'warm' | 'hot' | null
    description?: string | null
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !opportunity) return { error: new Error('Não autenticado') }

    const { error } = await supabase
      .from('opportunities')
      .update(fields)
      .eq('id', opportunityId)

    if (!error) {
      await supabase.from('activities').insert({
        organization_id: opportunity.organization_id,
        opportunity_id: opportunityId,
        user_id: user.id,
        type: 'edited',
        description: 'Editou a oportunidade',
      })
      await fetchData()
    }
    return { error }
  }

  async function deleteOpportunity() {
    const { data, error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', opportunityId)
      .select('id')

    if (error) return { error }
    if (!data || data.length === 0) {
      return { error: new Error('Sem permissão para excluir. Verifique se a policy de DELETE está criada no Supabase.') }
    }
    return { error: null }
  }

  useEffect(() => {
    if (opportunityId) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId])

  return {
    opportunity, notes, activities, proposals, stages, loading,
    addNote, deleteNote, changeStage, closeOpportunity, uploadProposal,
    updateOpportunity, deleteOpportunity,
    refresh: fetchData,
  }
}
