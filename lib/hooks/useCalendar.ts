'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'

export type CalendarTask = {
  id: string
  title: string
  description: string | null
  date: string        // 'YYYY-MM-DD'
  start_time: string  // 'HH:MM'
  end_time: string    // 'HH:MM'
  color: string
  completed: boolean
}

export type TaskInput = Omit<CalendarTask, 'id' | 'completed'>

export function useCalendar(rangeStart: string, rangeEnd: string) {
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (member) setOrgId(member.organization_id)

    const { data } = await supabase
      .from('calendar_tasks')
      .select('id, title, description, date, start_time, end_time, color, completed')
      .eq('user_id', user.id)
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
      .order('start_time')

    setTasks((data ?? []).map(t => ({
      ...t,
      completed: t.completed ?? false,
      start_time: t.start_time.slice(0, 5),
      end_time: t.end_time.slice(0, 5),
    })))
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd])

  async function createTask(input: TaskInput) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !orgId) return { error: new Error('Não autenticado') }

    const { data, error } = await supabase
      .from('calendar_tasks')
      .insert({ ...input, user_id: user.id, organization_id: orgId, completed: false })
      .select('id, title, description, date, start_time, end_time, color, completed')
      .single()

    if (!error && data) {
      setTasks(prev => [...prev, {
        ...data,
        completed: data.completed ?? false,
        start_time: data.start_time.slice(0, 5),
        end_time: data.end_time.slice(0, 5),
      }].sort((a, b) => a.start_time.localeCompare(b.start_time)))
    }
    return { error }
  }

  async function updateTask(id: string, input: Partial<TaskInput>) {
    const { error } = await supabase
      .from('calendar_tasks')
      .update(input)
      .eq('id', id)

    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? {
        ...t,
        ...input,
        start_time: (input.start_time ?? t.start_time).slice(0, 5),
        end_time: (input.end_time ?? t.end_time).slice(0, 5),
      } : t))
    }
    return { error }
  }

  async function toggleComplete(id: string, completed: boolean) {
    const { error } = await supabase
      .from('calendar_tasks')
      .update({ completed })
      .eq('id', id)

    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
    }
    return { error }
  }

  async function deleteTask(id: string) {
    const { error } = await supabase
      .from('calendar_tasks')
      .delete()
      .eq('id', id)

    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  useEffect(() => { fetchTasks() }, [fetchTasks])

  return { tasks, loading, createTask, updateTask, toggleComplete, deleteTask, refresh: fetchTasks }
}
