'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const MAX_NOTE_IMAGES = 5
export const MAX_NOTE_IMAGE_SIZE = 10 * 1024 * 1024
export const NOTE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

const noteImageExtensionByType: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

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

export type NoteAttachment = {
  id: string
  note_id: string
  file_url: string
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  created_at: string
}

export type Note = {
  id: string
  content: string
  created_at: string
  user_id: string
  author_name: string
  attachments: NoteAttachment[]
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
  file_format: 'uploaded' | 'pdf' | 'docx' | null
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
      { data: noteAttachmentsData },
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
        .from('note_attachments')
        .select('id, note_id, file_url, file_path, file_name, file_size, mime_type, created_at')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: true }),
      supabase
        .from('activities')
        .select('id, type, description, created_at, user_id, metadata')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false }),
      supabase
        .from('proposals')
        .select('id, title, version, file_format, file_url, file_name, file_size, notes, uploaded_at, uploaded_by')
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
    const attachmentsByNote = new Map<string, NoteAttachment[]>()

    for (const attachment of noteAttachmentsData ?? []) {
      const current = attachmentsByNote.get(attachment.note_id) ?? []
      current.push(attachment)
      attachmentsByNote.set(attachment.note_id, current)
    }

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
        attachments: attachmentsByNote.get(n.id) ?? [],
      }))
    )
    setActivities(
      (activitiesData ?? []).map((a: { id: string; type: string; description: string; created_at: string; user_id: string; metadata: Record<string, unknown> }) => ({
        ...a,
        author_name: profileMap.get(a.user_id) ?? 'Usuário',
      }))
    )
    setProposals(
      (proposalsData ?? []).map((p: { id: string; title: string; version: number; file_format?: 'uploaded' | 'pdf' | 'docx' | null; file_url: string; file_name: string; file_size: number; notes: string | null; uploaded_at: string; uploaded_by: string }) => ({
        ...p,
        file_format: p.file_format ?? null,
        uploader_name: profileMap.get(p.uploaded_by) ?? 'Usuário',
      }))
    )
    setLoading(false)
  }

  function validateNoteImages(images: File[]) {
    if (images.length > MAX_NOTE_IMAGES) {
      return new Error(`Selecione no máximo ${MAX_NOTE_IMAGES} imagens por nota.`)
    }

    const invalidType = images.find(file => !NOTE_IMAGE_TYPES.includes(file.type as typeof NOTE_IMAGE_TYPES[number]))
    if (invalidType) {
      return new Error('Use apenas imagens PNG, JPG, WEBP ou GIF.')
    }

    const invalidSize = images.find(file => file.size > MAX_NOTE_IMAGE_SIZE)
    if (invalidSize) {
      return new Error('Cada imagem pode ter no máximo 10MB.')
    }

    return null
  }

  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || 'imagem'
  }

  async function addNote(content: string, images: File[] = []) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !opportunity) return { error: new Error('Não autenticado') }

    const trimmedContent = content.trim()
    if (!trimmedContent && images.length === 0) {
      return { error: new Error('Adicione um texto ou uma imagem para salvar a nota.') }
    }

    const validationError = validateNoteImages(images)
    if (validationError) return { error: validationError }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        organization_id: opportunity.organization_id,
        opportunity_id: opportunityId,
        user_id: user.id,
        content: trimmedContent,
      })
      .select('id, content, created_at, user_id')
      .single()

    if (error || !data) return { error }

    const uploadedPaths: string[] = []
    let attachments: NoteAttachment[] = []

    if (images.length > 0) {
      const attachmentPayload = []

      for (const [index, image] of images.entries()) {
        const extension = noteImageExtensionByType[image.type] ?? 'png'
        const safeName = sanitizeFileName(image.name)
        const path = `${opportunity.organization_id}/${opportunityId}/${data.id}/${Date.now()}-${index}-${safeName}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('note-images')
          .upload(path, image, { contentType: image.type })

        if (uploadError) {
          if (uploadedPaths.length > 0) await supabase.storage.from('note-images').remove(uploadedPaths)
          await supabase.from('notes').delete().eq('id', data.id)
          return { error: uploadError }
        }

        uploadedPaths.push(path)
        const { data: { publicUrl } } = supabase.storage.from('note-images').getPublicUrl(path)

        attachmentPayload.push({
          note_id: data.id,
          organization_id: opportunity.organization_id,
          opportunity_id: opportunityId,
          file_url: publicUrl,
          file_path: path,
          file_name: image.name,
          file_size: image.size,
          mime_type: image.type,
          uploaded_by: user.id,
        })
      }

      const { data: createdAttachments, error: attachmentError } = await supabase
        .from('note_attachments')
        .insert(attachmentPayload)
        .select('id, note_id, file_url, file_path, file_name, file_size, mime_type, created_at')

      if (attachmentError) {
        await supabase.storage.from('note-images').remove(uploadedPaths)
        await supabase.from('notes').delete().eq('id', data.id)
        return { error: attachmentError }
      }

      attachments = createdAttachments ?? []
    }

    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', user.id).single()
    setNotes(prev => [{
      ...data,
      author_name: profile?.full_name ?? 'Usuário',
      attachments,
    }, ...prev])

    await supabase.from('activities').insert({
      organization_id: opportunity.organization_id,
      opportunity_id: opportunityId,
      user_id: user.id,
      type: 'note',
      description: 'Adicionou uma nota',
    })

    return { error: null }
  }

  async function deleteNote(noteId: string) {
    const note = notes.find(n => n.id === noteId)
    const filePaths = note?.attachments.map(attachment => attachment.file_path) ?? []

    if (filePaths.length > 0) {
      const { error: removeStorageError } = await supabase.storage
        .from('note-images')
        .remove(filePaths)

      if (removeStorageError) return { error: removeStorageError }
    }

    if (filePaths.length > 0) {
      const { error: removeAttachmentsError } = await supabase
        .from('note_attachments')
        .delete()
        .eq('note_id', noteId)

      if (removeAttachmentsError) return { error: removeAttachmentsError }
    }

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
