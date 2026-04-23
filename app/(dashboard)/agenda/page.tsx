'use client'

import { useState, useRef, useCallback } from 'react'
import { useCalendar, CalendarTask, TaskInput } from '@/lib/hooks/useCalendar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── constants ────────────────────────────────────────────────────────────────
const HOUR_HEIGHT = 64
const START_HOUR = 6
const END_HOUR = 23
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const COLORS = [
  { value: '#2E86C1', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F59E0B', label: 'Âmbar' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#64748B', label: 'Cinza' },
]

// ─── helpers ──────────────────────────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function snapToQuarter(minutes: number): number {
  return Math.round(minutes / 15) * 15
}

function getTaskStyle(task: CalendarTask) {
  const startMin = timeToMinutes(task.start_time) - START_HOUR * 60
  const endMin = timeToMinutes(task.end_time) - START_HOUR * 60
  const top = (startMin / 60) * HOUR_HEIGHT
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24)
  return { top, height }
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// ─── TaskBlock ────────────────────────────────────────────────────────────────
function TaskBlock({
  task,
  onClick,
  onToggleComplete,
}: {
  task: CalendarTask
  onClick: (t: CalendarTask) => void
  onToggleComplete: (id: string, completed: boolean) => void
}) {
  const { top, height } = getTaskStyle(task)
  const short = height < 44

  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(task) }}
      className={cn(
        'absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer select-none overflow-hidden shadow-sm hover:brightness-95 transition-all z-10 border border-black/10',
        task.completed && 'opacity-50'
      )}
      style={{ top, height, backgroundColor: task.color }}
    >
      {/* Checkbox de conclusão */}
      <button
        onClick={e => { e.stopPropagation(); onToggleComplete(task.id, !task.completed) }}
        title={task.completed ? 'Desmarcar' : 'Concluir'}
        className={cn(
          'absolute top-1 right-1 w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0',
          task.completed
            ? 'bg-white/90 border-white/90'
            : 'border-white/50 hover:bg-white/20'
        )}
      >
        {task.completed && <Check className="w-2.5 h-2.5" style={{ color: task.color }} />}
      </button>

      <p className={cn(
        'text-white font-semibold leading-tight truncate',
        short ? 'text-[10px]' : 'text-xs',
        !short && 'pr-5',
        task.completed && 'line-through opacity-75'
      )}>
        {task.title}
      </p>
      {!short && (
        <p className="text-white/80 text-[10px] mt-0.5">
          {formatTime(task.start_time)} – {formatTime(task.end_time)}
        </p>
      )}
    </div>
  )
}

// ─── TaskDialog ───────────────────────────────────────────────────────────────
type DialogMode =
  | { mode: 'create'; date: string; start_time: string; end_time: string }
  | { mode: 'edit'; task: CalendarTask }

function TaskDialog({
  dialogState, onClose, onCreate, onUpdate, onDelete, onToggleComplete,
}: {
  dialogState: DialogMode
  onClose: () => void
  onCreate: (input: TaskInput) => Promise<{ error: unknown }>
  onUpdate: (id: string, input: Partial<TaskInput>) => Promise<{ error: unknown }>
  onDelete: (id: string) => Promise<{ error: unknown }>
  onToggleComplete: (id: string, completed: boolean) => Promise<{ error: unknown }>
}) {
  const isEdit = dialogState.mode === 'edit'
  const task = isEdit ? dialogState.task : null

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [date, setDate] = useState(task?.date ?? (dialogState.mode === 'create' ? dialogState.date : ''))
  const [startTime, setStartTime] = useState(task?.start_time ?? (dialogState.mode === 'create' ? dialogState.start_time : ''))
  const [endTime, setEndTime] = useState(task?.end_time ?? (dialogState.mode === 'create' ? dialogState.end_time : ''))
  const [color, setColor] = useState(task?.color ?? '#2E86C1')
  const [completed, setCompleted] = useState(task?.completed ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    if (!isEdit || !task) return
    const next = !completed
    setCompleted(next)
    await onToggleComplete(task.id, next)
  }

  async function handleSave() {
    if (!title.trim() || !date || !startTime || !endTime) return
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('Horário de fim deve ser após o início.')
      return
    }
    setSaving(true)
    setError(null)
    const input: TaskInput = {
      title: title.trim(),
      description: description.trim() || null,
      date,
      start_time: startTime,
      end_time: endTime,
      color,
    }
    const { error } = isEdit
      ? await onUpdate(task!.id, input)
      : await onCreate(input)
    if (error) { setError('Erro ao salvar.'); setSaving(false); return }
    onClose()
  }

  async function handleDelete() {
    if (!isEdit || !confirm('Excluir esta tarefa?')) return
    await onDelete(task!.id)
    onClose()
  }

  return (
    <div className="space-y-4">
      {/* Toggle concluída (só no modo edição) */}
      {isEdit && (
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'w-full flex items-center gap-2.5 px-4 h-10 rounded-xl border text-sm font-medium transition-all',
            completed
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          )}
        >
          <div className={cn(
            'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
            completed ? 'bg-green-500 border-green-500' : 'border-slate-300'
          )}>
            {completed && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          {completed ? 'Concluída — clique para desmarcar' : 'Marcar como concluída'}
        </button>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Título *</Label>
        <Input
          placeholder="Ex: Reunião com cliente"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          className="h-10 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Início</Label>
          <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fim</Label>
          <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-10 rounded-xl" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cor</Label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              title={c.label}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                color === c.value ? 'border-slate-700 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Descrição</Label>
        <Textarea
          placeholder="Notas, links, contexto..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="rounded-xl resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-1">
        {isEdit && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        )}
        <div className="flex-1" />
        <button onClick={onClose} className="px-4 h-10 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="px-5 h-10 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [dialogState, setDialogState] = useState<DialogMode | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const rangeStart = toISO(weekDays[0])
  const rangeEnd = toISO(weekDays[6])

  const { tasks, loading, createTask, updateTask, toggleComplete, deleteTask } = useCalendar(rangeStart, rangeEnd)

  const goToToday = () => setWeekStart(getMonday(new Date()))
  const prevWeek = () => setWeekStart(d => addDays(d, -7))
  const nextWeek = () => setWeekStart(d => addDays(d, 7))

  const monthLabel = (() => {
    const months = new Set(weekDays.map(d => d.getMonth()))
    if (months.size === 1) return `${MONTHS_PT[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`
    const [m1, m2] = [...months]
    return `${MONTHS_PT[m1]} / ${MONTHS_PT[m2]} ${weekDays[6].getFullYear()}`
  })()

  const handleColumnClick = useCallback((e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    if ((e.target as HTMLElement).closest('[data-task]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top + (gridRef.current?.scrollTop ?? 0)
    const rawMin = (y / HOUR_HEIGHT) * 60 + START_HOUR * 60
    const startMin = Math.max(snapToQuarter(rawMin), START_HOUR * 60)
    const endMin = Math.min(startMin + 60, END_HOUR * 60)
    setDialogState({
      mode: 'create',
      date: toISO(day),
      start_time: minutesToTime(startMin),
      end_time: minutesToTime(endMin),
    })
  }, [])

  const nowLine = (() => {
    const now = new Date()
    const min = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60
    if (min < 0 || min > TOTAL_HOURS * 60) return null
    return (min / 60) * HOUR_HEIGHT
  })()

  const todayIndex = weekDays.findIndex(d => isToday(d))
  const completedCount = tasks.filter(t => t.completed).length

  return (
    <div className="flex flex-col h-screen overflow-hidden p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialogState({ mode: 'create', date: toISO(new Date()), start_time: '09:00', end_time: '10:00' })}
            className="flex items-center gap-2 px-4 h-9 rounded-xl bg-gradient-to-r from-blue to-blue-vivid text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={prevWeek} className="p-2 hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button onClick={goToToday} className="px-3 h-9 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-x border-slate-200">
              Hoje
            </button>
            <button onClick={nextWeek} className="p-2 hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        {/* Day headers */}
        <div className="flex border-b border-slate-100 shrink-0">
          <div className="w-14 shrink-0" />
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 text-center py-3 border-l border-slate-100 first:border-l-0',
                isToday(day) && 'bg-blue/5'
              )}
            >
              <p className={cn('text-[11px] font-semibold uppercase tracking-wider', isToday(day) ? 'text-blue' : 'text-slate-400')}>
                {DAYS_PT[day.getDay()]}
              </p>
              <p className={cn(
                'text-lg font-bold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full mx-auto',
                isToday(day) ? 'bg-blue text-white' : 'text-navy'
              )}>
                {day.getDate()}
              </p>
            </div>
          ))}
        </div>

        {/* Scrollable grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
            {/* Time labels */}
            <div className="w-14 shrink-0 relative">
              {HOURS.map(h => (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-start justify-end pr-2"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 8 }}
                >
                  <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, i) => {
              const dayStr = toISO(day)
              const dayTasks = tasks.filter(t => t.date === dayStr)
              return (
                <div
                  key={i}
                  className={cn('flex-1 relative border-l border-slate-100 cursor-crosshair', isToday(day) && 'bg-blue/[0.02]')}
                  onClick={e => handleColumnClick(e, day)}
                >
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-slate-100"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}
                  {HOURS.map(h => (
                    <div
                      key={`${h}-half`}
                      className="absolute left-0 right-0 border-t border-slate-50"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    />
                  ))}

                  {todayIndex === i && nowLine !== null && (
                    <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: nowLine }}>
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                      <div className="flex-1 h-px bg-red-500" />
                    </div>
                  )}

                  {dayTasks.map(task => (
                    <div key={task.id} data-task="1">
                      <TaskBlock
                        task={task}
                        onClick={t => setDialogState({ mode: 'edit', task: t })}
                        onToggleComplete={toggleComplete}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer summary */}
        {!loading && (
          <div className="shrink-0 border-t border-slate-100 px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'} esta semana</span>
            {completedCount > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Check className="w-3 h-3" />
                  {completedCount} concluída{completedCount > 1 ? 's' : ''}
                </span>
              </>
            )}
            <span>·</span>
            <span>Clique em qualquer horário para criar uma tarefa</span>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={!!dialogState} onOpenChange={open => { if (!open) setDialogState(null) }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {dialogState?.mode === 'edit' ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>
          {dialogState && (
            <TaskDialog
              dialogState={dialogState}
              onClose={() => setDialogState(null)}
              onCreate={createTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onToggleComplete={toggleComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
