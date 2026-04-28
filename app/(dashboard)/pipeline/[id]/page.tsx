'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MAX_NOTE_IMAGES,
  MAX_NOTE_IMAGE_SIZE,
  NOTE_IMAGE_TYPES,
  useOpportunityDetail,
} from '@/lib/hooks/useOpportunityDetail'
import { useClients } from '@/lib/hooks/useClients'
import { useProducts } from '@/lib/hooks/useProducts'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, DollarSign, User, Calendar, TrendingUp,
  Plus, Trash2, FileUp, FileText, Trophy, XCircle, Clock, Package, CreditCard,
  ImagePlus, Pencil, X,
} from 'lucide-react'

const statusConfig = {
  open: { label: 'Em andamento', variant: 'secondary' as const },
  won: { label: 'Ganho', variant: 'default' as const },
  lost: { label: 'Perdido', variant: 'destructive' as const },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

const activityIcons: Record<string, string> = {
  created: '🟢',
  stage_change: '🔀',
  note: '📝',
  proposal_upload: '📄',
  status_change: '🏁',
  edited: '✏️',
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const {
    opportunity, notes, activities, proposals, stages, loading,
    addNote, deleteNote, changeStage, closeOpportunity, uploadProposal,
    updateOpportunity, deleteOpportunity,
  } = useOpportunityDetail(id)
  const { clients } = useClients()
  const { products } = useProducts()

  const [noteText, setNoteText] = useState('')
  const [noteImages, setNoteImages] = useState<File[]>([])
  const [noteInputKey, setNoteInputKey] = useState(0)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [addingNote, setAddingNote] = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [showLostForm, setShowLostForm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    client_id: '',
    product_id: '',
    value: '',
    payment_type: '' as '' | 'cash' | 'installment',
    installments: '',
    lead_temperature: '' as '' | 'cold' | 'warm' | 'hot',
    description: '',
  })
  const [proposalTitle, setProposalTitle] = useState('')
  const [proposalNotes, setProposalNotes] = useState('')
  const [proposalFile, setProposalFile] = useState<File | null>(null)
  const [uploadingProposal, setUploadingProposal] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function openEdit() {
    if (!opportunity) return
    setEditForm({
      title: opportunity.title,
      client_id: opportunity.client_id,
      product_id: opportunity.product_id ?? '',
      value: String(opportunity.value),
      payment_type: (opportunity.payment_type as typeof editForm.payment_type) ?? '',
      installments: opportunity.installments ? String(opportunity.installments) : '',
      lead_temperature: (opportunity.lead_temperature as typeof editForm.lead_temperature) ?? '',
      description: opportunity.description ?? '',
    })
    setEditError(null)
    setShowEditDialog(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditSaving(true)
    setEditError(null)
    const { error } = await updateOpportunity({
      title: editForm.title,
      client_id: editForm.client_id,
      product_id: editForm.product_id || null,
      value: parseFloat(editForm.value),
      payment_type: editForm.payment_type || null,
      installments: editForm.payment_type === 'installment' && editForm.installments
        ? parseInt(editForm.installments) : null,
      lead_temperature: editForm.lead_temperature || null,
      description: editForm.description || null,
    })
    if (error) { setEditError('Erro ao salvar.'); setEditSaving(false); return }
    setShowEditDialog(false)
    setEditSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Excluir esta oportunidade permanentemente? Esta ação não pode ser desfeita.')) return
    const { error } = await deleteOpportunity()
    if (error) {
      console.error('Delete error:', error)
      alert(`Erro ao excluir: ${error.message}\n\nCódigo: ${(error as { code?: string }).code ?? 'desconhecido'}`)
    } else {
      router.push('/pipeline')
    }
  }

  async function handleAddNote() {
    if (!noteText.trim() && noteImages.length === 0) return
    setAddingNote(true)
    setNoteError(null)

    const { error } = await addNote(noteText, noteImages)
    if (error) {
      setNoteError(error.message)
      setAddingNote(false)
      return
    }

    setNoteText('')
    setNoteImages([])
    setNoteInputKey(prev => prev + 1)
    setAddingNote(false)
  }

  function handleNoteImageChange(files: FileList | null) {
    const selectedFiles = Array.from(files ?? [])
    setNoteError(null)

    if (selectedFiles.length > MAX_NOTE_IMAGES) {
      setNoteError(`Selecione no máximo ${MAX_NOTE_IMAGES} imagens por nota.`)
      setNoteImages([])
      setNoteInputKey(prev => prev + 1)
      return
    }

    const invalidType = selectedFiles.find(file => !NOTE_IMAGE_TYPES.includes(file.type as typeof NOTE_IMAGE_TYPES[number]))
    if (invalidType) {
      setNoteError('Use apenas imagens PNG, JPG, WEBP ou GIF.')
      setNoteImages([])
      setNoteInputKey(prev => prev + 1)
      return
    }

    const invalidSize = selectedFiles.find(file => file.size > MAX_NOTE_IMAGE_SIZE)
    if (invalidSize) {
      setNoteError('Cada imagem pode ter no máximo 10MB.')
      setNoteImages([])
      setNoteInputKey(prev => prev + 1)
      return
    }

    setNoteImages(selectedFiles)
  }

  function clearNoteImages() {
    setNoteImages([])
    setNoteInputKey(prev => prev + 1)
  }

  async function handleWon() {
    if (!confirm('Marcar oportunidade como GANHA?')) return
    await closeOpportunity('won')
  }

  async function handleLost() {
    await closeOpportunity('lost', lostReason)
    setShowLostForm(false)
    setLostReason('')
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!proposalFile || !proposalTitle) return
    setUploadingProposal(true)
    setUploadError(null)
    const { error } = await uploadProposal(proposalFile, proposalTitle, proposalNotes)
    if (error) setUploadError(error.message)
    else {
      setProposalTitle('')
      setProposalNotes('')
      setProposalFile(null)
    }
    setUploadingProposal(false)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Oportunidade não encontrada.</p>
        <Link href="/pipeline" className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
          Voltar ao Pipeline
        </Link>
      </div>
    )
  }

  const isOpen = opportunity.status === 'open'

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/pipeline" className={buttonVariants({ variant: 'ghost' })}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Pipeline
        </Link>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-500 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
          {isOpen && (
            <>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowLostForm(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Perdido
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleWon}>
                <Trophy className="w-4 h-4 mr-2" />
                Ganho
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Formulário motivo de perda */}
      {showLostForm && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-5 space-y-3">
            <p className="font-medium text-red-700">Motivo da perda (opcional)</p>
            <Input
              placeholder="Ex: Perdeu para concorrente, orçamento, timing..."
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              className="bg-white"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowLostForm(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleLost}>
                Confirmar Perda
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info principal */}
      <div>
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-navy">{opportunity.title}</h1>
          <Badge variant={statusConfig[opportunity.status].variant}>
            {statusConfig[opportunity.status].label}
          </Badge>
        </div>
        {opportunity.description && (
          <p className="text-muted-foreground text-sm">{opportunity.description}</p>
        )}
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue" />
              <span className="text-xs text-muted-foreground">Valor</span>
            </div>
            <p className="font-bold text-navy">
              {opportunity.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-blue" />
              <span className="text-xs text-muted-foreground">Cliente</span>
            </div>
            <p className="font-bold text-navy text-sm truncate">
              {opportunity.client?.name ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue" />
              <span className="text-xs text-muted-foreground">Etapa</span>
            </div>
            {isOpen ? (
              <Select value={opportunity.stage_id} onValueChange={v => v && changeStage(v)}>
                <SelectTrigger className="h-7 text-xs border-0 p-0 shadow-none font-bold text-navy">
                  <SelectValue>
                    {(v: string) => stages.find(s => s.id === v)?.name ?? opportunity.stage?.name ?? '—'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {stages.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-bold text-navy text-sm">{opportunity.stage?.name ?? '—'}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue" />
              <span className="text-xs text-muted-foreground">Produto</span>
            </div>
            <p className="font-bold text-navy text-sm truncate">
              {opportunity.product?.name ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🌡️</span>
              <span className="text-xs text-muted-foreground">Lead</span>
            </div>
            <p className="font-bold text-navy text-sm">
              {opportunity.lead_temperature === 'cold' && '🧊 Frio'}
              {opportunity.lead_temperature === 'warm' && '🌡️ Morno'}
              {opportunity.lead_temperature === 'hot'  && '🔥 Quente'}
              {!opportunity.lead_temperature && '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-blue" />
              <span className="text-xs text-muted-foreground">Pagamento</span>
            </div>
            <p className="font-bold text-navy text-sm">
              {opportunity.payment_type === 'cash'
                ? 'À vista'
                : opportunity.payment_type === 'installment'
                ? `${opportunity.installments}x parcelado`
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue" />
              <span className="text-xs text-muted-foreground">Criado em</span>
            </div>
            <p className="font-bold text-navy text-sm">
              {new Date(opportunity.created_at).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notas ({notes.length})</TabsTrigger>
          <TabsTrigger value="activities">Atividades ({activities.length})</TabsTrigger>
          <TabsTrigger value="proposals">Propostas ({proposals.length})</TabsTrigger>
        </TabsList>

        {/* === NOTAS === */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <Textarea
                placeholder="Adicione uma nota sobre esta oportunidade..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
              />
              <div className="space-y-2">
                <Label htmlFor="note-images">Imagens</Label>
                <Input
                  key={noteInputKey}
                  id="note-images"
                  type="file"
                  accept={NOTE_IMAGE_TYPES.join(',')}
                  multiple
                  onChange={e => handleNoteImageChange(e.target.files)}
                />
                {noteImages.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-slate-600">
                        {noteImages.length} {noteImages.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}
                      </p>
                      <button
                        type="button"
                        onClick={clearNoteImages}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {noteImages.map((file, index) => (
                        <span
                          key={`${file.name}-${index}`}
                          className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200"
                        >
                          {file.name} · {formatBytes(file.size)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {noteError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{noteError}</p>
              )}
              <Button
                className="bg-blue hover:bg-blue/90"
                disabled={(!noteText.trim() && noteImages.length === 0) || addingNote}
                onClick={handleAddNote}
              >
                {noteImages.length > 0 ? <ImagePlus className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {addingNote ? 'Salvando...' : 'Adicionar Nota'}
              </Button>
            </CardContent>
          </Card>

          {notes.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhuma nota ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <Card key={note.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-3">
                        {note.content && (
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        )}
                        {note.attachments.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {note.attachments.map(attachment => (
                              <a
                                key={attachment.id}
                                href={attachment.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 hover:border-blue/40"
                                title={attachment.file_name}
                              >
                                <img
                                  src={attachment.file_url}
                                  alt={attachment.file_name}
                                  className="h-24 w-full object-cover transition-transform group-hover:scale-105"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {note.author_name} · {timeAgo(note.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === ATIVIDADES === */}
        <TabsContent value="activities" className="mt-4">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhuma atividade registrada.
            </p>
          ) : (
            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="space-y-0">
                  {activities.map((act, i) => (
                    <div key={act.id}>
                      {i > 0 && <Separator className="my-1" />}
                      <div className="flex items-start gap-3 py-3">
                        <span className="text-lg flex-shrink-0 w-6 text-center">
                          {activityIcons[act.type] ?? '•'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{act.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {act.author_name} · {timeAgo(act.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === PROPOSTAS === */}
        <TabsContent value="proposals" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Enviar Nova Proposta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="proposal-title">Título *</Label>
                  <Input
                    id="proposal-title"
                    placeholder="Ex: Proposta Comercial - Fase 1"
                    value={proposalTitle}
                    onChange={e => setProposalTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="proposal-file">Arquivo (PDF) *</Label>
                  <Input
                    id="proposal-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.pptx"
                    onChange={e => setProposalFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="proposal-notes">Observações</Label>
                  <Textarea
                    id="proposal-notes"
                    placeholder="Notas sobre esta versão..."
                    value={proposalNotes}
                    onChange={e => setProposalNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                {uploadError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                    {uploadError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={uploadingProposal || !proposalFile || !proposalTitle}
                  className="bg-blue hover:bg-blue/90"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {uploadingProposal ? 'Enviando...' : 'Enviar Proposta'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {proposals.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              Nenhuma proposta enviada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {proposals.map(proposal => (
                <Card key={proposal.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-navy">{proposal.title}</p>
                            <Badge variant="outline" className="text-xs">v{proposal.version}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {proposal.file_name} · {formatBytes(proposal.file_size)}
                          </p>
                          {proposal.notes && (
                            <p className="text-xs text-gray-600 mt-1">{proposal.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {proposal.uploader_name} · {timeAgo(proposal.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={proposal.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        Baixar
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar Oportunidade</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
            </div>

            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={editForm.client_id} onValueChange={v => setEditForm(f => ({ ...f, client_id: v ?? '' }))}>
                <SelectTrigger>
                  <SelectValue>
                    {(v: string) => clients.find(c => c.id === v)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Produto / Serviço</Label>
              <Select value={editForm.product_id} onValueChange={v => setEditForm(f => ({ ...f, product_id: v ?? '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum">
                    {(v: string) => products.find(p => p.id === v)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" value={editForm.value}
                  onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Pagamento</Label>
                <Select value={editForm.payment_type} onValueChange={v => setEditForm(f => ({ ...f, payment_type: (v ?? '') as typeof f.payment_type }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione">
                      {(v: string) => v === 'cash' ? 'À vista' : v === 'installment' ? 'Parcelado' : ''}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">À vista</SelectItem>
                    <SelectItem value="installment">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editForm.payment_type === 'installment' && (
              <div className="space-y-1.5">
                <Label>Número de parcelas *</Label>
                <Input type="number" min="2" max="360" placeholder="Ex: 12"
                  value={editForm.installments}
                  onChange={e => setEditForm(f => ({ ...f, installments: e.target.value }))} required />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Temperatura do Lead</Label>
              <div className="flex gap-2">
                {([
                  { value: 'cold', emoji: '🧊', label: 'Frio' },
                  { value: 'warm', emoji: '🌡️', label: 'Morno' },
                  { value: 'hot',  emoji: '🔥', label: 'Quente' },
                ] as const).map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setEditForm(f => ({ ...f, lead_temperature: f.lead_temperature === opt.value ? '' : opt.value }))}
                    className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border text-sm font-medium transition-all ${
                      editForm.lead_temperature === opt.value
                        ? 'border-blue bg-blue/10 text-blue'
                        : 'border-slate-200 text-muted-foreground hover:border-slate-300'
                    }`}
                  >
                    <span>{opt.emoji}</span>{opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={2} value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {editError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{editError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editSaving || !editForm.title || !editForm.client_id}
                className="flex-1 bg-gradient-to-r from-blue to-blue-vivid hover:opacity-90 text-white">
                {editSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
