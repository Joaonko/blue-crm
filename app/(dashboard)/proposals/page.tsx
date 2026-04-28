'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProposalBuilder } from '@/components/proposals/ProposalBuilder'
import { ProposalDraft, useProposals } from '@/lib/hooks/useProposals'
import { formatCurrencyBRL } from '@/lib/proposals/schema'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'

function formatDate(date: string | null) {
  if (!date) return 'Nunca'
  return new Date(date).toLocaleDateString('pt-BR')
}

function DraftCard({
  draft,
  onEdit,
  onDelete,
}: {
  draft: ProposalDraft
  onEdit: (draft: ProposalDraft) => void
  onDelete: (draft: ProposalDraft) => void
}) {
  return (
    <Card className="border-slate-200/70 shadow-sm hover:border-blue/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10">
              <FileText className="h-5 w-5 text-blue" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-navy truncate">{draft.title}</h2>
                <Badge variant={draft.status === 'generated' ? 'default' : 'secondary'}>
                  {draft.status === 'generated' ? 'Gerada' : 'Rascunho'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {draft.data.clientName || draft.opportunity?.client?.name || 'Sem cliente'} · {draft.data.projectTitle}
              </p>
              {draft.opportunity && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Deal: {draft.opportunity.title} · {formatCurrencyBRL(draft.opportunity.value)}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Atualizada em {formatDate(draft.updated_at)}
                {draft.generated_at ? ` · Gerada em ${formatDate(draft.generated_at)}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.generated_pdf_url && (
              <a
                href={draft.generated_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                PDF
              </a>
            )}
            {draft.generated_docx_url && (
              <a
                href={draft.generated_docx_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                DOCX
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => onEdit(draft)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="text-red-500 hover:bg-red-50"
              onClick={() => onDelete(draft)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProposalsPage() {
  const searchParams = useSearchParams()
  const opportunityParam = searchParams.get('opportunity')
  const {
    drafts,
    opportunities,
    loading,
    saveDraft,
    deleteDraft,
    generateDraft,
  } = useProposals()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingDraft, setEditingDraft] = useState<ProposalDraft | null>(null)
  const [initialOpportunityId, setInitialOpportunityId] = useState<string | null>(null)
  const [handledOpportunityParam, setHandledOpportunityParam] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !opportunityParam || handledOpportunityParam === opportunityParam) return
    setEditingDraft(null)
    setInitialOpportunityId(opportunityParam)
    setBuilderOpen(true)
    setHandledOpportunityParam(opportunityParam)
  }, [handledOpportunityParam, loading, opportunityParam])

  function openNew() {
    setEditingDraft(null)
    setInitialOpportunityId(null)
    setBuilderOpen(true)
    setPageError(null)
  }

  function openDraft(draft: ProposalDraft) {
    setEditingDraft(draft)
    setInitialOpportunityId(null)
    setBuilderOpen(true)
    setPageError(null)
  }

  async function handleDelete(draft: ProposalDraft) {
    if (!confirm(`Excluir o rascunho "${draft.title}"? Os arquivos já gerados no storage não serão removidos.`)) return
    const { error } = await deleteDraft(draft.id)
    if (error) setPageError(error.message)
  }

  if (loading) {
    return (
      <div className="p-8 space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-navy tracking-tight">Propostas</h1>
            <Badge variant="outline">Modelo Blue Ape</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monte propostas comerciais dinâmicas e gere PDF + DOCX com os dados do CRM.
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-gradient-to-r from-blue to-blue-vivid text-white rounded-xl shadow-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova proposta
        </Button>
      </div>

      {pageError && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {pageError}
        </p>
      )}

      {builderOpen && (
        <ProposalBuilder
          draft={editingDraft}
          initialOpportunityId={initialOpportunityId}
          opportunities={opportunities}
          onCancel={() => {
            setBuilderOpen(false)
            setEditingDraft(null)
            setInitialOpportunityId(null)
          }}
          onSave={saveDraft}
          onGenerate={generateDraft}
        />
      )}

      {!builderOpen && drafts.length === 0 && (
        <Card className="border-dashed border-slate-300 bg-white">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue/10">
              <Sparkles className="h-7 w-7 text-blue" />
            </div>
            <h2 className="text-lg font-semibold text-navy">Nenhuma proposta criada ainda</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Crie uma proposta manualmente ou abra um deal no Pipeline e use o botão de proposta automática.
            </p>
            <Button
              onClick={openNew}
              className="mt-6 bg-gradient-to-r from-blue to-blue-vivid text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira proposta
            </Button>
          </CardContent>
        </Card>
      )}

      {!builderOpen && drafts.length > 0 && (
        <div className="space-y-3">
          {drafts.map(draft => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onEdit={openDraft}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!builderOpen && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-navy">Atalho pelo Pipeline</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dentro de cada deal, a aba Propostas terá um botão para abrir este módulo já preenchido
            com cliente, produto, valor e pagamento.
          </p>
          <Link href="/pipeline" className="mt-3 inline-flex text-sm font-medium text-blue hover:underline">
            Ir para o Pipeline
          </Link>
        </div>
      )}
    </div>
  )
}
