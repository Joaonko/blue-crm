'use client'

import { Stage, Opportunity } from '@/lib/hooks/useOpportunities'
import { OpportunityCard } from './OpportunityCard'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  stage: Stage
  opportunities: Opportunity[]
  canManage: boolean
  onEdit: (stage: Stage) => void
  onDelete: (stage: Stage) => void
}

function SortableOpportunity({ opportunity }: { opportunity: Opportunity }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id, data: { type: 'opportunity' } })

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

export function StageColumn({ stage, opportunities, canManage, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: stage.id,
    data: { type: 'stage' },
  })

  const total = opportunities.reduce((sum, opp) => sum + opp.value, 0)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 150ms ease',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex-shrink-0 w-72', isDragging && 'z-20 opacity-70')}
    >
      {/* Column header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            {canManage && (
              <button
                ref={setActivatorNodeRef}
                type="button"
                {...attributes}
                {...listeners}
                className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-600"
                aria-label={`Mover etapa ${stage.name}`}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
            <h2 className="font-semibold text-navy text-sm truncate">{stage.name}</h2>
            <span className="text-[11px] font-medium text-muted-foreground bg-slate-200/70 px-1.5 py-0.5 rounded-full">
              {opportunities.length}
            </span>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-600"
                aria-label={`Gerenciar etapa ${stage.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(stage)}>
                  <Pencil className="h-4 w-4" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(stage)}>
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-xs font-bold text-slate-500 pl-[18px]">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(total)}
        </p>
      </div>

      {/* Drop zone */}
      <div
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
