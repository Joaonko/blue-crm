'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useOpportunities, Opportunity, Stage } from '@/lib/hooks/useOpportunities'
import { StageColumn } from '@/components/pipeline/StageColumn'
import { NewOpportunityDialog } from '@/components/pipeline/NewOpportunityDialog'
import { FunnelDialog } from '@/components/pipeline/FunnelDialog'
import { StageDialog } from '@/components/pipeline/StageDialog'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { OpportunityCard } from '@/components/pipeline/OpportunityCard'
import {
  ExternalLink,
  Layers3,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Tab = 'open' | 'won' | 'lost'
type DragType = 'opportunity' | 'stage'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function formatDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('pt-BR')
}

function ClosedList({ opps, type }: { opps: Opportunity[]; type: 'won' | 'lost' }) {
  if (opps.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
        {type === 'won' ? (
          <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        ) : (
          <XCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        )}
        <p className="text-sm text-muted-foreground">
          {type === 'won' ? 'Nenhum negócio ganho ainda' : 'Nenhum negócio perdido'}
        </p>
      </div>
    )
  }

  const total = opps.reduce((s, o) => s + o.value, 0)

  return (
    <div className="space-y-4">
      <div className={cn(
        'rounded-2xl p-5 flex items-center gap-4 shadow-sm border',
        type === 'won'
          ? 'bg-emerald-50 border-emerald-100'
          : 'bg-red-50 border-red-100'
      )}>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          type === 'won' ? 'bg-emerald-100' : 'bg-red-100'
        )}>
          {type === 'won'
            ? <Trophy className="w-5 h-5 text-emerald-600" />
            : <XCircle className="w-5 h-5 text-red-500" />}
        </div>
        <div>
          <p className={cn('text-xl font-bold', type === 'won' ? 'text-emerald-700' : 'text-red-600')}>
            {formatCurrency(total)}
          </p>
          <p className={cn('text-xs font-medium', type === 'won' ? 'text-emerald-600' : 'text-red-500')}>
            {opps.length} {opps.length === 1 ? 'negócio' : 'negócios'} {type === 'won' ? 'ganhos' : 'perdidos'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Oportunidade</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Responsável</th>
              {type === 'lost' && (
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Motivo da Perda</th>
              )}
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {type === 'won' ? 'Data do Ganho' : 'Data da Perda'}
              </th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {opps.map(opp => (
              <tr key={opp.id} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-5 py-3.5">
                  <span className="font-medium text-navy">{opp.title}</span>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground text-xs">
                  {opp.client?.name ?? '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={cn('font-bold text-sm', type === 'won' ? 'text-emerald-600' : 'text-red-500')}>
                    {formatCurrency(opp.value)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground text-xs">
                  {opp.owner?.full_name ?? '—'}
                </td>
                {type === 'lost' && (
                  <td className="px-5 py-3.5">
                    {opp.lost_reason ? (
                      <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full">
                        {opp.lost_reason}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">Sem motivo</span>
                    )}
                  </td>
                )}
                <td className="px-5 py-3.5 text-muted-foreground text-xs">
                  {formatDate(opp.closed_at)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/pipeline/${opp.id}`}
                    className="inline-flex items-center gap-1 text-xs text-blue font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                  >
                    Ver
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const funnelParam = searchParams.get('funnel')
  const {
    opportunities,
    wonOpportunities,
    lostOpportunities,
    stages,
    funnels,
    loading,
    selectedFunnelId,
    canManageStructure,
    moveOpportunity,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    setSelectedFunnelId,
    createStage,
    updateStage,
    reorderStages,
    deleteStage,
    refresh,
  } = useOpportunities(funnelParam)

  const [tab, setTab] = useState<Tab>('open')
  const [activeDrag, setActiveDrag] = useState<{ id: string; type: DragType } | null>(null)
  const [dragStageOverride, setDragStageOverride] = useState<{ id: string; stageId: string } | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [funnelDialogMode, setFunnelDialogMode] = useState<'create' | 'edit' | null>(null)
  const [funnelDialogLoading, setFunnelDialogLoading] = useState(false)
  const [funnelDialogError, setFunnelDialogError] = useState<string | null>(null)
  const [stageDialogState, setStageDialogState] = useState<{ mode: 'create' | 'edit'; stage?: Stage } | null>(null)
  const [stageDialogLoading, setStageDialogLoading] = useState(false)
  const [stageDialogError, setStageDialogError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const currentFunnel = funnels.find(funnel => funnel.id === selectedFunnelId) ?? null

  useEffect(() => {
    if (loading) return

    const params = new URLSearchParams(searchParams.toString())
    const currentParam = params.get('funnel')

    if (selectedFunnelId && currentParam !== selectedFunnelId) {
      params.set('funnel', selectedFunnelId)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      return
    }

    if (!selectedFunnelId && currentParam) {
      params.delete('funnel')
      const nextQuery = params.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
    }
  }, [loading, pathname, router, searchParams, selectedFunnelId])

  function updateFunnelInUrl(nextFunnelId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('funnel', nextFunnelId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function resolveStageId(overId: string): string | null {
    if (stages.some(stage => stage.id === overId)) return overId
    return displayOpportunities.find(opportunity => opportunity.id === overId)?.stage_id ?? null
  }

  const displayOpportunities: Opportunity[] = useMemo(() => {
    if (!dragStageOverride) return opportunities
    return opportunities.map(opportunity =>
      opportunity.id === dragStageOverride.id
        ? { ...opportunity, stage_id: dragStageOverride.stageId }
        : opportunity
    )
  }, [opportunities, dragStageOverride])

  function handleDragStart(event: DragStartEvent) {
    const type = (event.active.data.current?.type as DragType | undefined) ?? 'opportunity'
    setActiveDrag({ id: event.active.id as string, type })
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) {
      setDragStageOverride(null)
      return
    }

    if (active.data.current?.type !== 'opportunity') return

    const newStageId = resolveStageId(over.id as string)
    if (!newStageId) return
    setDragStageOverride({ id: active.id as string, stageId: newStageId })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const activeType = (active.data.current?.type as DragType | undefined) ?? 'opportunity'

    setActiveDrag(null)
    setDragStageOverride(null)

    if (!over) return

    if (activeType === 'stage') {
      const targetStageId = resolveStageId(over.id as string)
      if (!targetStageId || targetStageId === active.id) return

      const oldIndex = stages.findIndex(stage => stage.id === active.id)
      const newIndex = stages.findIndex(stage => stage.id === targetStageId)
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return

      setPageError(null)
      const nextOrder = arrayMove(stages, oldIndex, newIndex).map(stage => stage.id)
      const { error } = await reorderStages(nextOrder)
      if (error) setPageError(error.message)
      return
    }

    const opportunityId = active.id as string
    const newStageId = resolveStageId(over.id as string)
    if (!newStageId) return

    const originalStageId = opportunities.find(opportunity => opportunity.id === opportunityId)?.stage_id
    if (originalStageId !== newStageId) {
      setPageError(null)
      const { error } = await moveOpportunity(opportunityId, newStageId)
      if (error) setPageError(error.message)
    }
  }

  async function handleFunnelChange(nextFunnelId: string) {
    setPageError(null)
    updateFunnelInUrl(nextFunnelId)
    await setSelectedFunnelId(nextFunnelId)
  }

  async function handleCreateFunnel(values: { name: string; description: string }) {
    setFunnelDialogLoading(true)
    setFunnelDialogError(null)

    const { error, data } = await createFunnel(values)

    if (error) {
      setFunnelDialogError(error.message)
      setFunnelDialogLoading(false)
      return
    }

    setFunnelDialogLoading(false)
    setFunnelDialogMode(null)
    setPageError(null)

    if (data) updateFunnelInUrl(data)
  }

  async function handleUpdateFunnel(values: { name: string; description: string }) {
    if (!currentFunnel) return

    setFunnelDialogLoading(true)
    setFunnelDialogError(null)

    const { error } = await updateFunnel(currentFunnel.id, values)
    if (error) {
      setFunnelDialogError(error.message)
      setFunnelDialogLoading(false)
      return
    }

    setFunnelDialogLoading(false)
    setFunnelDialogMode(null)
    setPageError(null)
  }

  async function handleDeleteCurrentFunnel() {
    if (!currentFunnel) return

    const confirmed = window.confirm(`Excluir o funil "${currentFunnel.name}"? Ele precisa estar vazio para ser removido.`)
    if (!confirmed) return

    setPageError(null)
    const { error } = await deleteFunnel(currentFunnel.id)
    if (error) setPageError(error.message)
  }

  async function handleCreateStage(values: { name: string; color: string }) {
    setStageDialogLoading(true)
    setStageDialogError(null)

    const { error } = await createStage(values)
    if (error) {
      setStageDialogError(error.message)
      setStageDialogLoading(false)
      return
    }

    setStageDialogLoading(false)
    setStageDialogState(null)
    setPageError(null)
  }

  async function handleUpdateStage(values: { name: string; color: string }) {
    if (!stageDialogState?.stage) return

    setStageDialogLoading(true)
    setStageDialogError(null)

    const { error } = await updateStage(stageDialogState.stage.id, values)
    if (error) {
      setStageDialogError(error.message)
      setStageDialogLoading(false)
      return
    }

    setStageDialogLoading(false)
    setStageDialogState(null)
    setPageError(null)
  }

  async function handleDeleteStage(stage: Stage) {
    const confirmed = window.confirm(`Excluir a etapa "${stage.name}"? Ela precisa estar sem negócios para ser removida.`)
    if (!confirmed) return

    setPageError(null)
    const { error } = await deleteStage(stage.id)
    if (error) setPageError(error.message)
  }

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'open', label: 'Em Aberto', count: opportunities.length, icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'won', label: 'Ganhos', count: wonOpportunities.length, icon: <Trophy className="w-3.5 h-3.5" /> },
    { key: 'lost', label: 'Perdidos', count: lostOpportunities.length, icon: <XCircle className="w-3.5 h-3.5" /> },
  ]

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-9 bg-slate-200 rounded-xl w-48 animate-pulse" />
        <div className="h-10 bg-slate-200 rounded-xl w-80 animate-pulse" />
        <div className="flex gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-72 shrink-0">
              <div className="h-5 bg-slate-200 rounded w-24 mb-3 animate-pulse" />
              <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const activeOpportunity = activeDrag?.type === 'opportunity'
    ? opportunities.find(opportunity => opportunity.id === activeDrag.id)
    : null

  return (
    <>
      <div className="p-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-navy tracking-tight">Pipeline</h1>
              <p className="text-muted-foreground text-sm mt-1">Gestão de oportunidades de venda</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {funnels.length > 0 ? (
                <Select value={selectedFunnelId ?? undefined} onValueChange={value => value && handleFunnelChange(value)}>
                  <SelectTrigger className="min-w-[240px] bg-white">
                    <SelectValue>
                      {(value: string) => funnels.find(funnel => funnel.id === value)?.name ?? 'Selecione um funil'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {funnels.map(funnel => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="inline-flex h-10 min-w-[240px] items-center rounded-xl border border-dashed border-slate-300 bg-white px-4 text-sm text-muted-foreground">
                  Nenhum funil ativo
                </div>
              )}

              {canManageStructure && (
                <Button
                  onClick={() => {
                    setFunnelDialogError(null)
                    setFunnelDialogMode('create')
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo funil
                </Button>
              )}

              {canManageStructure && currentFunnel && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-navy"
                    aria-label={`Gerenciar funil ${currentFunnel.name}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setFunnelDialogError(null)
                        setFunnelDialogMode('edit')
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                      Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={handleDeleteCurrentFunnel}>
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <NewOpportunityDialog funnelId={selectedFunnelId} stages={stages} onSuccess={() => void refresh()} />
        </div>

        {pageError && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {pageError}
          </div>
        )}

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                tab === t.key
                  ? t.key === 'won'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : t.key === 'lost'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-blue text-white shadow-sm'
                  : 'text-muted-foreground hover:text-navy'
              )}
            >
              {t.icon}
              {t.label}
              <span className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab === 'open' && !currentFunnel && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Layers3 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h2 className="text-lg font-semibold text-navy">Nenhum funil disponível</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {canManageStructure
                ? 'Crie o primeiro funil para começar a organizar suas oportunidades.'
                : 'Peça para um administrador criar um funil para sua organização.'}
            </p>
            {canManageStructure && (
              <Button
                className="mt-4"
                onClick={() => {
                  setFunnelDialogError(null)
                  setFunnelDialogMode('create')
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro funil
              </Button>
            )}
          </div>
        )}

        {tab === 'open' && currentFunnel && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stages.map(stage => stage.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-5 overflow-x-auto pb-4">
                {stages.map(stage => {
                  const stageOpps = displayOpportunities.filter(opportunity => opportunity.stage_id === stage.id)
                  return (
                    <StageColumn
                      key={stage.id}
                      stage={stage}
                      opportunities={stageOpps}
                      canManage={canManageStructure}
                      onEdit={stageToEdit => {
                        setStageDialogError(null)
                        setStageDialogState({ mode: 'edit', stage: stageToEdit })
                      }}
                      onDelete={stageToDelete => void handleDeleteStage(stageToDelete)}
                    />
                  )
                })}

                {canManageStructure && (
                  <button
                    type="button"
                    onClick={() => {
                      setStageDialogError(null)
                      setStageDialogState({ mode: 'create' })
                    }}
                    className="flex h-[560px] w-72 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 text-sm font-medium text-slate-500 transition-colors hover:border-blue hover:text-blue"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova etapa
                  </button>
                )}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeOpportunity ? (
                <div className="rotate-2 scale-105 opacity-90">
                  <OpportunityCard opportunity={activeOpportunity} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {tab === 'won' && <ClosedList opps={wonOpportunities} type="won" />}
        {tab === 'lost' && <ClosedList opps={lostOpportunities} type="lost" />}
      </div>

      <FunnelDialog
        open={funnelDialogMode !== null}
        onOpenChange={open => {
          if (!open) {
            setFunnelDialogMode(null)
            setFunnelDialogError(null)
          }
        }}
        title={funnelDialogMode === 'edit' ? 'Renomear funil' : 'Novo funil'}
        description={
          funnelDialogMode === 'edit'
            ? 'Atualize o nome e a descrição do funil atual.'
            : 'Crie um novo funil com as etapas padrão do CRM.'
        }
        submitLabel={funnelDialogMode === 'edit' ? 'Salvar alterações' : 'Criar funil'}
        loading={funnelDialogLoading}
        error={funnelDialogError}
        initialName={funnelDialogMode === 'edit' ? currentFunnel?.name ?? '' : ''}
        initialDescription={funnelDialogMode === 'edit' ? currentFunnel?.description ?? '' : ''}
        onSubmit={values => funnelDialogMode === 'edit' ? handleUpdateFunnel(values) : handleCreateFunnel(values)}
      />

      <StageDialog
        open={stageDialogState !== null}
        onOpenChange={open => {
          if (!open) {
            setStageDialogState(null)
            setStageDialogError(null)
          }
        }}
        title={stageDialogState?.mode === 'edit' ? 'Editar etapa' : 'Nova etapa'}
        description={
          stageDialogState?.mode === 'edit'
            ? 'Altere o nome e a cor da etapa.'
            : 'Adicione uma nova coluna ao kanban do funil atual.'
        }
        submitLabel={stageDialogState?.mode === 'edit' ? 'Salvar alterações' : 'Criar etapa'}
        loading={stageDialogLoading}
        error={stageDialogError}
        initialName={stageDialogState?.mode === 'edit' ? stageDialogState.stage?.name ?? '' : ''}
        initialColor={stageDialogState?.mode === 'edit' ? stageDialogState.stage?.color ?? '#6C7A89' : '#6C7A89'}
        onSubmit={values => stageDialogState?.mode === 'edit' ? handleUpdateStage(values) : handleCreateStage(values)}
      />
    </>
  )
}
