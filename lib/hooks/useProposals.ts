'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ProposalData,
  ProposalOpportunity,
  createDefaultProposalData,
  normalizeProposalData,
} from '@/lib/proposals/schema'

export type ProposalTemplate = {
  id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

export type ProposalDraft = {
  id: string
  organization_id: string
  opportunity_id: string | null
  template_id: string | null
  title: string
  status: 'draft' | 'generated'
  data: ProposalData
  generated_docx_url: string | null
  generated_pdf_url: string | null
  generated_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  opportunity: ProposalOpportunity | null
}

type SaveDraftInput = {
  id?: string | null
  title: string
  opportunityId?: string | null
  data: ProposalData
}

type GenerateResponse = {
  draftId: string
  docxUrl: string
  pdfUrl: string
  version: number | null
}

function toError(value: unknown, fallback: string) {
  if (value instanceof Error) return value
  if (typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string') {
    return new Error(value.message)
  }
  return new Error(fallback)
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function normalizeOpportunityRecord(record: Record<string, unknown>): ProposalOpportunity {
  return {
    id: String(record.id),
    title: String(record.title ?? ''),
    value: Number(record.value ?? 0),
    description: typeof record.description === 'string' ? record.description : null,
    payment_type: record.payment_type === 'cash' || record.payment_type === 'installment'
      ? record.payment_type
      : null,
    installments: typeof record.installments === 'number' ? record.installments : null,
    client: firstRelation(record.client as ProposalOpportunity['client'] | ProposalOpportunity['client'][] | null),
    product: firstRelation(record.product as ProposalOpportunity['product'] | ProposalOpportunity['product'][] | null),
  }
}

function normalizeDraft(record: Record<string, unknown>): ProposalDraft {
  const opportunityRecord = record.opportunity
    ? firstRelation(record.opportunity as Record<string, unknown> | Record<string, unknown>[])
    : null
  const opportunity = opportunityRecord ? normalizeOpportunityRecord(opportunityRecord) : null

  return {
    id: String(record.id),
    organization_id: String(record.organization_id),
    opportunity_id: typeof record.opportunity_id === 'string' ? record.opportunity_id : null,
    template_id: typeof record.template_id === 'string' ? record.template_id : null,
    title: String(record.title ?? 'Proposta Comercial'),
    status: record.status === 'generated' ? 'generated' : 'draft',
    data: normalizeProposalData(record.data),
    generated_docx_url: typeof record.generated_docx_url === 'string' ? record.generated_docx_url : null,
    generated_pdf_url: typeof record.generated_pdf_url === 'string' ? record.generated_pdf_url : null,
    generated_at: typeof record.generated_at === 'string' ? record.generated_at : null,
    created_by: String(record.created_by),
    created_at: String(record.created_at),
    updated_at: String(record.updated_at),
    opportunity,
  }
}

export function useProposals() {
  const [drafts, setDrafts] = useState<ProposalDraft[]>([])
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [opportunities, setOpportunities] = useState<ProposalOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  async function fetchData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setDrafts([])
      setTemplates([])
      setOpportunities([])
      setOrgId(null)
      setUserId(null)
      setLoading(false)
      return
    }

    setUserId(user.id)

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!member) {
      setDrafts([])
      setTemplates([])
      setOpportunities([])
      setOrgId(null)
      setLoading(false)
      return
    }

    setOrgId(member.organization_id)

    const [
      { data: draftsData },
      { data: templatesData },
      { data: opportunitiesData },
    ] = await Promise.all([
      supabase
        .from('proposal_drafts')
        .select(`
          id,
          organization_id,
          opportunity_id,
          template_id,
          title,
          status,
          data,
          generated_docx_url,
          generated_pdf_url,
          generated_at,
          created_by,
          created_at,
          updated_at,
          opportunity:opportunities(
            id,
            title,
            value,
            description,
            payment_type,
            installments,
            client:clients(id, name, contact_name, contact_email),
            product:products(id, name)
          )
        `)
        .eq('organization_id', member.organization_id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('proposal_templates')
        .select('id, name, description, active, created_at')
        .eq('organization_id', member.organization_id)
        .eq('active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('opportunities')
        .select(`
          id,
          title,
          value,
          description,
          payment_type,
          installments,
          client:clients(id, name, contact_name, contact_email),
          product:products(id, name)
        `)
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    setDrafts((draftsData ?? []).map(record => normalizeDraft(record as Record<string, unknown>)))
    setTemplates((templatesData ?? []) as ProposalTemplate[])
    setOpportunities((opportunitiesData ?? []).map(record => normalizeOpportunityRecord(record as Record<string, unknown>)))
    setLoading(false)
  }

  async function saveDraft(input: SaveDraftInput) {
    if (!orgId || !userId) return { error: new Error('Organização não encontrada.'), data: null }

    const data = normalizeProposalData(input.data)
    const title = input.title.trim() || data.title || 'Proposta Comercial'
    const payload = {
      organization_id: orgId,
      opportunity_id: input.opportunityId || null,
      title,
      data,
      status: 'draft',
    }

    if (input.id) {
      const { data: updated, error } = await supabase
        .from('proposal_drafts')
        .update(payload)
        .eq('id', input.id)
        .select(`
          id,
          organization_id,
          opportunity_id,
          template_id,
          title,
          status,
          data,
          generated_docx_url,
          generated_pdf_url,
          generated_at,
          created_by,
          created_at,
          updated_at,
          opportunity:opportunities(
            id,
            title,
            value,
            description,
            payment_type,
            installments,
            client:clients(id, name, contact_name, contact_email),
            product:products(id, name)
          )
        `)
        .single()

      if (error || !updated) return { error: toError(error, 'Não foi possível salvar o rascunho.'), data: null }

      const normalized = normalizeDraft(updated as Record<string, unknown>)
      setDrafts(prev => prev.map(draft => draft.id === normalized.id ? normalized : draft))
      return { error: null, data: normalized }
    }

    const { data: created, error } = await supabase
      .from('proposal_drafts')
      .insert({
        ...payload,
        created_by: userId,
      })
      .select(`
        id,
        organization_id,
        opportunity_id,
        template_id,
        title,
        status,
        data,
        generated_docx_url,
        generated_pdf_url,
        generated_at,
        created_by,
        created_at,
        updated_at,
        opportunity:opportunities(
          id,
          title,
          value,
          description,
          payment_type,
          installments,
          client:clients(id, name, contact_name, contact_email),
          product:products(id, name)
        )
      `)
      .single()

    if (error || !created) return { error: toError(error, 'Não foi possível criar o rascunho.'), data: null }

    const normalized = normalizeDraft(created as Record<string, unknown>)
    setDrafts(prev => [normalized, ...prev])
    return { error: null, data: normalized }
  }

  async function deleteDraft(draftId: string) {
    const { error } = await supabase
      .from('proposal_drafts')
      .delete()
      .eq('id', draftId)

    if (!error) setDrafts(prev => prev.filter(draft => draft.id !== draftId))
    return { error: error ? toError(error, 'Não foi possível excluir o rascunho.') : null }
  }

  async function generateDraft(draftId: string) {
    const response = await fetch('/api/proposals/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return {
        error: new Error(payload?.error ?? 'Não foi possível gerar a proposta.'),
        data: null,
      }
    }

    await fetchData()
    return { error: null, data: payload as GenerateResponse }
  }

  function getOpportunity(opportunityId: string | null | undefined) {
    return opportunities.find(opportunity => opportunity.id === opportunityId) ?? null
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    drafts,
    templates,
    opportunities,
    loading,
    createEmptyData: createDefaultProposalData,
    getOpportunity,
    saveDraft,
    deleteDraft,
    generateDraft,
    refresh: fetchData,
  }
}
