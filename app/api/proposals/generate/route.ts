import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProposalDocx } from '@/lib/proposals/docx'
import { generateProposalPdf } from '@/lib/proposals/pdf'
import { normalizeProposalData } from '@/lib/proposals/schema'

export const runtime = 'nodejs'

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'proposta'
}

async function getNextVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opportunityId: string
) {
  const { data } = await supabase
    .from('proposals')
    .select('version')
    .eq('opportunity_id', opportunityId)
    .order('version', { ascending: false })
    .limit(1)

  return ((data?.[0]?.version as number | undefined) ?? 0) + 1
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const draftId = typeof body?.draftId === 'string' ? body.draftId : null

    if (!draftId) {
      return NextResponse.json({ error: 'Rascunho inválido.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: draft, error: draftError } = await supabase
      .from('proposal_drafts')
      .select('id, organization_id, opportunity_id, title, data')
      .eq('id', draftId)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ error: 'Rascunho não encontrado.' }, { status: 404 })
    }

    const proposalData = normalizeProposalData(draft.data)
    const safeTitle = sanitizeFileName(proposalData.title || draft.title)
    const generatedAt = Date.now()
    const version = draft.opportunity_id
      ? await getNextVersion(supabase, draft.opportunity_id)
      : null
    const versionSuffix = version ? `-v${version}` : ''
    const fileBaseName = `${safeTitle}${versionSuffix}`
    const storageBasePath = `${draft.organization_id}/${draft.opportunity_id ?? 'standalone'}/${draft.id}/${generatedAt}`

    const [docxBuffer, pdfBuffer] = await Promise.all([
      generateProposalDocx(proposalData),
      generateProposalPdf(proposalData),
    ])

    const docxPath = `${storageBasePath}/${fileBaseName}.docx`
    const pdfPath = `${storageBasePath}/${fileBaseName}.pdf`
    const uploadedPaths: string[] = []

    const { error: docxUploadError } = await supabase.storage
      .from('proposals')
      .upload(docxPath, docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

    if (docxUploadError) {
      return NextResponse.json({ error: docxUploadError.message }, { status: 400 })
    }
    uploadedPaths.push(docxPath)

    const { error: pdfUploadError } = await supabase.storage
      .from('proposals')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
      })

    if (pdfUploadError) {
      await supabase.storage.from('proposals').remove(uploadedPaths)
      return NextResponse.json({ error: pdfUploadError.message }, { status: 400 })
    }
    uploadedPaths.push(pdfPath)

    const { data: docxPublic } = supabase.storage.from('proposals').getPublicUrl(docxPath)
    const { data: pdfPublic } = supabase.storage.from('proposals').getPublicUrl(pdfPath)

    const { error: updateDraftError } = await supabase
      .from('proposal_drafts')
      .update({
        status: 'generated',
        generated_docx_url: docxPublic.publicUrl,
        generated_docx_path: docxPath,
        generated_pdf_url: pdfPublic.publicUrl,
        generated_pdf_path: pdfPath,
        generated_at: new Date().toISOString(),
        generated_by: user.id,
      })
      .eq('id', draft.id)

    if (updateDraftError) {
      await supabase.storage.from('proposals').remove(uploadedPaths)
      return NextResponse.json({ error: updateDraftError.message }, { status: 400 })
    }

    if (draft.opportunity_id && version) {
      const rows = [
        {
          organization_id: draft.organization_id,
          opportunity_id: draft.opportunity_id,
          source_draft_id: draft.id,
          title: proposalData.title || draft.title,
          version,
          file_url: pdfPublic.publicUrl,
          file_name: `${fileBaseName}.pdf`,
          file_size: pdfBuffer.length,
          file_format: 'pdf',
          uploaded_by: user.id,
          notes: 'Gerada automaticamente pelo módulo de propostas',
        },
        {
          organization_id: draft.organization_id,
          opportunity_id: draft.opportunity_id,
          source_draft_id: draft.id,
          title: proposalData.title || draft.title,
          version,
          file_url: docxPublic.publicUrl,
          file_name: `${fileBaseName}.docx`,
          file_size: docxBuffer.length,
          file_format: 'docx',
          uploaded_by: user.id,
          notes: 'Arquivo editável gerado automaticamente',
        },
      ]

      const { error: insertProposalError } = await supabase
        .from('proposals')
        .insert(rows)

      if (insertProposalError) {
        await supabase.storage.from('proposals').remove(uploadedPaths)
        return NextResponse.json({ error: insertProposalError.message }, { status: 400 })
      }

      await supabase.from('activities').insert({
        organization_id: draft.organization_id,
        opportunity_id: draft.opportunity_id,
        user_id: user.id,
        type: 'proposal_upload',
        description: `Gerou proposta v${version}: ${proposalData.title || draft.title}`,
      })
    }

    return NextResponse.json({
      draftId: draft.id,
      docxUrl: docxPublic.publicUrl,
      pdfUrl: pdfPublic.publicUrl,
      version,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao gerar proposta.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
