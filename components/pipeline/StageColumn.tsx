'use client'

import { Stage, Opportunity } from '@/lib/hooks/useOpportunities'
import { OpportunityCard } from './OpportunityCard'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Props = {
  stage: Stage
  opportunities: Opportunity[]
}

function SortableOpportunity({ opportunity }: { opportunity: Opportunity }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 150ms ease',
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <OpportunityCard opportunity={opportunity} />
    </div>
  )
}

export function StageColumn({ stage, opportunities }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const total = opportunities.reduce((sum, opp) => sum + opp.value, 0)

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
            <h2 className="font-semibold text-navy text-sm">{stage.name}</h2>
            <span className="text-[11px] font-medium text-muted-foreground bg-slate-200/70 px-1.5 py-0.5 rounded-full">
              {opportunities.length}
            </span>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-500 pl-[18px]">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(total)}
        </p>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`min-h-[500px] max-h-[calc(100vh-260px)] overflow-y-auto rounded-2xl p-3 transition-colors duration-150 ${
          isOver
            ? 'bg-blue/8 ring-2 ring-blue/30'
            : 'bg-slate-200/40'
        }`}
      >
        <SortableContext
          items={opportunities.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {opportunities.map(opp => (
            <SortableOpportunity key={opp.id} opportunity={opp} />
          ))}
        </SortableContext>

        {opportunities.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground/50 text-xs">
            Arraste aqui
          </div>
        )}
      </div>
    </div>
  )
}
