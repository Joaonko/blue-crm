'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ProposalData,
  ProposalFunctionality,
  ProposalOpportunity,
  ProposalPhase,
  ProposalResponsibility,
  createDefaultProposalData,
  createProposalDataFromOpportunity,
  formatCurrencyBRL,
} from '@/lib/proposals/schema'
import { ProposalDraft } from '@/lib/hooks/useProposals'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, Link2, Loader2, Plus, Save, Sparkles, Trash2 } from 'lucide-react'

type SaveResult = {
  error: Error | null
  data: ProposalDraft | null
}

type GenerateResult = {
  error: Error | null
  data: {
    docxUrl: string
    pdfUrl: string
    version: number | null
  } | null
}

type Props = {
  draft: ProposalDraft | null
  initialOpportunityId?: string | null
  opportunities: ProposalOpportunity[]
  onCancel: () => void
  onSave: (input: {
    id?: string | null
    title: string
    opportunityId?: string | null
    data: ProposalData
  }) => Promise<SaveResult>
  onGenerate: (draftId: string) => Promise<GenerateResult>
}

function updateListItem(list: string[], index: number, value: string) {
  return list.map((item, itemIndex) => itemIndex === index ? value : item)
}

function removeListItem(list: string[], index: number) {
  return list.filter((_, itemIndex) => itemIndex !== index)
}

function ListEditor({
  label,
  items,
  placeholder,
  onChange,
}: {
  label: string
  items: string[]
  placeholder: string
  onChange: (items: string[]) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ''])}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Adicionar
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={event => onChange(updateListItem(items, index, event.target.value))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0 text-red-500 hover:bg-red-50"
              onClick={() => onChange(removeListItem(items, index))}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function FunctionalityEditor({
  value,
  onChange,
}: {
  value: ProposalFunctionality[]
  onChange: (value: ProposalFunctionality[]) => void
}) {
  function updateGroup(index: number, next: ProposalFunctionality) {
    onChange(value.map((group, groupIndex) => groupIndex === index ? next : group))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Funcionalidades previstas</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { title: 'Novo módulo', items: [''] }])}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Grupo
        </Button>
      </div>
      {value.map((group, index) => (
        <Card key={index} className="border-slate-200/70">
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                value={group.title}
                placeholder="Título do grupo"
                onChange={event => updateGroup(index, { ...group, title: event.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="shrink-0 text-red-500 hover:bg-red-50"
                onClick={() => onChange(value.filter((_, groupIndex) => groupIndex !== index))}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <ListEditor
              label="Itens"
              items={group.items}
              placeholder="Descreva uma funcionalidade"
              onChange={items => updateGroup(index, { ...group, items })}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PhaseEditor({
  value,
  onChange,
}: {
  value: ProposalPhase[]
  onChange: (value: ProposalPhase[]) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Fases do projeto</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { title: 'Nova fase', description: '' }])}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Fase
        </Button>
      </div>
      {value.map((phase, index) => (
        <Card key={index} className="border-slate-200/70">
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                value={phase.title}
                placeholder="Título da fase"
                onChange={event => onChange(value.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, title: event.target.value } : item
                ))}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="shrink-0 text-red-500 hover:bg-red-50"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Textarea
              value={phase.description}
              placeholder="Descrição da fase"
              rows={2}
              onChange={event => onChange(value.map((item, itemIndex) =>
                itemIndex === index ? { ...item, description: event.target.value } : item
              ))}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ResponsibilityEditor({
  value,
  onChange,
}: {
  value: ProposalResponsibility[]
  onChange: (value: ProposalResponsibility[]) => void
}) {
  function updateGroup(index: number, next: ProposalResponsibility) {
    onChange(value.map((group, groupIndex) => groupIndex === index ? next : group))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Responsabilidades do cliente</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { title: 'Nova responsabilidade', items: [''] }])}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Grupo
        </Button>
      </div>
      {value.map((group, index) => (
        <Card key={index} className="border-slate-200/70">
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                value={group.title}
                placeholder="Título do grupo"
                onChange={event => updateGroup(index, { ...group, title: event.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="shrink-0 text-red-500 hover:bg-red-50"
                onClick={() => onChange(value.filter((_, groupIndex) => groupIndex !== index))}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <ListEditor
              label="Itens"
              items={group.items}
              placeholder="Descreva uma responsabilidade"
              onChange={items => updateGroup(index, { ...group, items })}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ProposalBuilder({
  draft,
  initialOpportunityId,
  opportunities,
  onCancel,
  onSave,
  onGenerate,
}: Props) {
  const initialOpportunity = useMemo(
    () => opportunities.find(opportunity => opportunity.id === initialOpportunityId) ?? null,
    [initialOpportunityId, opportunities]
  )
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null)
  const [opportunityId, setOpportunityId] = useState<string | null>(draft?.opportunity_id ?? initialOpportunityId ?? null)
  const [data, setData] = useState<ProposalData>(
    draft?.data ?? (initialOpportunity ? createProposalDataFromOpportunity(initialOpportunity) : createDefaultProposalData())
  )
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedLinks, setGeneratedLinks] = useState<{
    docxUrl: string | null
    pdfUrl: string | null
  }>({
    docxUrl: draft?.generated_docx_url ?? null,
    pdfUrl: draft?.generated_pdf_url ?? null,
  })

  useEffect(() => {
    const nextOpportunity = opportunities.find(opportunity => opportunity.id === initialOpportunityId) ?? null
    setDraftId(draft?.id ?? null)
    setOpportunityId(draft?.opportunity_id ?? initialOpportunityId ?? null)
    setData(draft?.data ?? (nextOpportunity ? createProposalDataFromOpportunity(nextOpportunity) : createDefaultProposalData()))
    setGeneratedLinks({
      docxUrl: draft?.generated_docx_url ?? null,
      pdfUrl: draft?.generated_pdf_url ?? null,
    })
    setError(null)
  }, [draft, initialOpportunityId, opportunities])

  const selectedOpportunity = opportunities.find(opportunity => opportunity.id === opportunityId) ?? null

  function setField<K extends keyof ProposalData>(field: K, value: ProposalData[K]) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function handleOpportunityChange(nextValue: string | null) {
    if (!nextValue || nextValue === 'manual') {
      setOpportunityId(null)
      return
    }

    const opportunity = opportunities.find(item => item.id === nextValue)
    setOpportunityId(nextValue)
    if (opportunity) setData(createProposalDataFromOpportunity(opportunity))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await onSave({
      id: draftId,
      title: data.title,
      opportunityId,
      data,
    })
    setSaving(false)

    if (result.error || !result.data) {
      setError(result.error?.message ?? 'Não foi possível salvar o rascunho.')
      return null
    }

    setDraftId(result.data.id)
    return result.data
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    const savedDraft = await handleSave()
    if (!savedDraft) {
      setGenerating(false)
      return
    }

    const result = await onGenerate(savedDraft.id)
    setGenerating(false)

    if (result.error || !result.data) {
      setError(result.error?.message ?? 'Não foi possível gerar a proposta.')
      return
    }

    setGeneratedLinks({
      docxUrl: result.data.docxUrl,
      pdfUrl: result.data.pdfUrl,
    })
  }

  return (
    <Card className="border-blue/20 shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl text-navy">
              {draftId ? 'Editar proposta' : 'Nova proposta'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Modelo Blue Ape padrão · DOCX editável + PDF pronto para envio
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft?.status === 'generated' && <Badge className="bg-emerald-600">Gerada</Badge>}
            <Button type="button" variant="outline" onClick={onCancel}>
              Fechar
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleSave()} disabled={saving || generating}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar rascunho
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-blue to-blue-vivid text-white hover:opacity-90"
              onClick={() => void handleGenerate()}
              disabled={saving || generating || !data.title.trim()}
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Gerar DOCX + PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {generatedLinks.pdfUrl && generatedLinks.docxUrl && (
          <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">Proposta gerada com sucesso.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={generatedLinks.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'bg-white' })}
              >
                <FileText className="w-4 h-4 mr-2" />
                Abrir PDF
              </a>
              <a
                href={generatedLinks.docxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'bg-white' })}
              >
                <FileText className="w-4 h-4 mr-2" />
                Baixar DOCX
              </a>
            </div>
          </div>
        )}

        <Tabs defaultValue="dados">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="escopo">Escopo</TabsTrigger>
            <TabsTrigger value="comercial">Comercial</TabsTrigger>
            <TabsTrigger value="aceite">Aceite</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-6 space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Deal relacionado</Label>
                <Select value={opportunityId ?? 'manual'} onValueChange={handleOpportunityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um deal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Sem deal vinculado</SelectItem>
                    {opportunities.map(opportunity => (
                      <SelectItem key={opportunity.id} value={opportunity.id}>
                        {opportunity.title} · {opportunity.client?.name ?? 'Cliente'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedOpportunity && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Link2 className="h-3 w-3" />
                    Valor do deal: {formatCurrencyBRL(selectedOpportunity.value)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Título da proposta</Label>
                <Input value={data.title} onChange={event => setField('title', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Projeto / serviço</Label>
                <Input value={data.projectTitle} onChange={event => setField('projectTitle', event.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={data.city} onChange={event => setField('city', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={data.issueDate} onChange={event => setField('issueDate', event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input value={data.clientName} onChange={event => setField('clientName', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Responsável do cliente</Label>
                <Input value={data.clientContactName} onChange={event => setField('clientContactName', event.target.value)} />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>E-mail do responsável</Label>
                <Input type="email" value={data.clientEmail} onChange={event => setField('clientEmail', event.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conteudo" className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Textarea rows={5} value={data.objective} onChange={event => setField('objective', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contexto do negócio</Label>
              <Textarea rows={5} value={data.businessContext} onChange={event => setField('businessContext', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Exemplo de uso</Label>
              <Textarea rows={4} value={data.useCase} onChange={event => setField('useCase', event.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="escopo" className="mt-6 space-y-8">
            <FunctionalityEditor value={data.functionalities} onChange={value => setField('functionalities', value)} />
            <PhaseEditor value={data.phases} onChange={value => setField('phases', value)} />
            <ListEditor
              label="Entregáveis"
              items={data.deliverables}
              placeholder="Descreva um entregável"
              onChange={value => setField('deliverables', value)}
            />
            <ListEditor
              label="Itens fora do escopo"
              items={data.outOfScope}
              placeholder="Descreva um item fora do escopo"
              onChange={value => setField('outOfScope', value)}
            />
            <ResponsibilityEditor value={data.responsibilities} onChange={value => setField('responsibilities', value)} />
          </TabsContent>

          <TabsContent value="comercial" className="mt-6 space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Título do investimento</Label>
                <Input value={data.investmentTitle} onChange={event => setField('investmentTitle', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.investmentAmount}
                  onChange={event => setField('investmentAmount', Number(event.target.value))}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Resumo de pagamento</Label>
                <Textarea rows={2} value={data.paymentSummary} onChange={event => setField('paymentSummary', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Prazo de entrega</Label>
                <Input value={data.deliveryDeadline} onChange={event => setField('deliveryDeadline', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Input value={data.paymentMethod} onChange={event => setField('paymentMethod', event.target.value)} />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Prazo de pagamento</Label>
                <Textarea rows={2} value={data.paymentTerms} onChange={event => setField('paymentTerms', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Impostos e taxas</Label>
                <Input value={data.taxes} onChange={event => setField('taxes', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Validade em dias</Label>
                <Input
                  type="number"
                  min="1"
                  value={data.validityDays}
                  onChange={event => setField('validityDays', Number(event.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="aceite" className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label>Referência do aceite</Label>
              <Input value={data.acceptanceReference} onChange={event => setField('acceptanceReference', event.target.value)} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-navy mb-2">Termo padrão</p>
              <p className="text-sm text-muted-foreground">
                O documento será gerado com as três opções de aceite padrão: aceite imediato,
                aceite com ordem de compra e aceite condicionado.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
