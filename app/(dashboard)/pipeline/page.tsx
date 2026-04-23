'use client'

import { useOpportunities, Opportunity } from '@/lib/hooks/useOpportunities'
import { StageColumn } from '@/components/pipeline/StageColumn'
import { NewOpportunityDialog } from '@/components/pipeline/NewOpportunityDialog'
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
import { useState, useMemo } from 'react'
import { OpportunityCard } from '@/components/pipeline/OpportunityCard'
import { Trophy, XCircle, TrendingUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Tab = 'open' | 'won' | 'lost'

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
      {/* Summary */}
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

      {/* Table */}
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
  const { opportunities, wonOpportunities, lostOpportunities, stages, loading, moveOpportunity, refresh } = useOpportunities()
  const [tab, setTab] = useState<Tab>('open')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragStageOverride, setDragStageOverride] = useState<{ id: string; stageId: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function resolveStageId(overId: string): string | null {
    if (stages.some(s => s.id === overId)) return overId
    return opportunities.find(o => o.id === overId)?.stage_id ?? null
  }

  const displayOpportunities: Opportunity[] = useMemo(() => {
    if (!dragStageOverride) return opportunities
    return opportunities.map(o =>
      o.id === dragStageOverride.id ? { ...o, stage_id: dragStageOverride.stageId } : o
    )
  }, [opportunities, dragStageOverride])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) { setDragStageOverride(null); return }
    const newStageId = resolveStageId(over.id as string)
    if (!newStageId) return
    setDragStageOverride({ id: active.id as string, stageId: newStageId })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setDragStageOverride(null)
    if (!over) return
    const opportunityId = active.id as string
    const newStageId = resolveStageId(over.id as string)
    if (!newStageId) return
    const originalStageId = opportunities.find(o => o.id === opportunityId)?.stage_id
    if (originalStageId !== newStageId) await moveOpportunity(opportunityId, newStageId)
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

  const activeOpportunity = opportunities.find(o => o.id === activeId)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de oportunidades de venda</p>
        </div>
        <NewOpportunityDialog stages={stages} onSuccess={refresh} />
      </div>

      {/* Tabs */}
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

      {/* Open — Kanban */}
      {tab === 'open' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 overflow-x-auto pb-4">
            {stages.map(stage => {
              const stageOpps = displayOpportunities.filter(o => o.stage_id === stage.id)
              return (
                <StageColumn key={stage.id} stage={stage} opportunities={stageOpps} />
              )
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeOpportunity ? (
              <div className="rotate-2 scale-105 opacity-90">
                <OpportunityCard opportunity={activeOpportunity} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Won */}
      {tab === 'won' && <ClosedList opps={wonOpportunities} type="won" />}

      {/* Lost */}
      {tab === 'lost' && <ClosedList opps={lostOpportunities} type="lost" />}
    </div>
  )
}
