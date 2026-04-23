'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export type DashboardMetrics = {
  totalRevenue: number
  pipelineValue: number
  openDeals: number
  wonDeals: number
  conversionRate: number
  dealsByStage: { stage: string; count: number; value: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
  recentActivities: { id: string; description: string; type: string; created_at: string; author_name: string; opportunity_title: string }[]
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .single()

      if (!member) { setLoading(false); return }

      const orgId = member.organization_id
      const { data: activeFunnels } = await supabase
        .from('funnels')
        .select('id')
        .eq('organization_id', orgId)
        .eq('active', true)
        .order('created_at', { ascending: true })

      const funnelIds = (activeFunnels ?? []).map(funnel => funnel.id)

      const [
        { data: wonOpps },
        { data: openOpps },
        { data: allOpps },
        { data: recentActivitiesData },
        { data: activeStagesData },
      ] = funnelIds.length > 0
        ? await Promise.all([
            supabase
              .from('opportunities')
              .select('value, closed_at, funnel_id')
              .in('funnel_id', funnelIds)
              .eq('status', 'won'),
            supabase
              .from('opportunities')
              .select('value, stage_id, funnel_id')
              .in('funnel_id', funnelIds)
              .eq('status', 'open'),
            supabase
              .from('opportunities')
              .select('id, status, funnel_id')
              .in('funnel_id', funnelIds),
            supabase
              .from('activities')
              .select('id, description, type, created_at, user_id, opportunity_id')
              .eq('organization_id', orgId)
              .order('created_at', { ascending: false })
              .limit(10),
            supabase
              .from('stages')
              .select('id, name, funnel_id, order')
              .in('funnel_id', funnelIds)
              .order('funnel_id', { ascending: true })
              .order('order', { ascending: true }),
          ])
        : await Promise.all([
            Promise.resolve({ data: [] }),
            Promise.resolve({ data: [] }),
            Promise.resolve({ data: [] }),
            supabase
              .from('activities')
              .select('id, description, type, created_at, user_id, opportunity_id')
              .eq('organization_id', orgId)
              .order('created_at', { ascending: false })
              .limit(10),
            Promise.resolve({ data: [] }),
          ])

      const totalRevenue = (wonOpps ?? []).reduce((sum, o) => sum + (o.value ?? 0), 0)
      const pipelineValue = (openOpps ?? []).reduce((sum, o) => sum + (o.value ?? 0), 0)
      const wonCount = (allOpps ?? []).filter(o => o.status === 'won').length
      const lostCount = (allOpps ?? []).filter(o => o.status === 'lost').length
      const conversionRate = wonCount + lostCount > 0
        ? Math.round((wonCount / (wonCount + lostCount)) * 100)
        : 0

      const stageNameById = new Map((activeStagesData ?? []).map(stage => [stage.id, stage.name]))
      const dealsByStageMap = new Map<string, { stage: string; count: number; value: number }>()

      for (const stage of activeStagesData ?? []) {
        if (!dealsByStageMap.has(stage.name)) {
          dealsByStageMap.set(stage.name, { stage: stage.name, count: 0, value: 0 })
        }
      }

      for (const opportunity of openOpps ?? []) {
        const stageName = stageNameById.get(opportunity.stage_id)
        if (!stageName) continue

        const current = dealsByStageMap.get(stageName) ?? { stage: stageName, count: 0, value: 0 }
        current.count += 1
        current.value += opportunity.value ?? 0
        dealsByStageMap.set(stageName, current)
      }

      const dealsByStage = Array.from(dealsByStageMap.values())

      // Monthly revenue (last 6 months)
      const monthlyRevenue: DashboardMetrics['monthlyRevenue'] = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const start = d.toISOString()
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
        const monthOpps = (wonOpps ?? []).filter(o => {
          if (!o.closed_at) return false
          return o.closed_at >= start && o.closed_at < end
        })
        monthlyRevenue.push({
          month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          revenue: monthOpps.reduce((sum, o) => sum + (o.value ?? 0), 0),
        })
      }

      // Fetch author names and opportunity titles for activities
      const activityUserIds = [...new Set((recentActivitiesData ?? []).map(a => a.user_id))]
      const opportunityIds = [...new Set((recentActivitiesData ?? []).map(a => a.opportunity_id).filter(Boolean))]

      const [{ data: profilesData }, { data: oppsForActivities }] = await Promise.all([
        activityUserIds.length > 0
          ? supabase.from('profiles').select('id, full_name').in('id', activityUserIds)
          : Promise.resolve({ data: [] }),
        opportunityIds.length > 0
          ? supabase.from('opportunities').select('id, title').in('id', opportunityIds)
          : Promise.resolve({ data: [] }),
      ])

      const profileMap = new Map((profilesData ?? []).map(p => [p.id, p.full_name]))
      const oppMap = new Map((oppsForActivities ?? []).map(o => [o.id, o.title]))

      const recentActivities = (recentActivitiesData ?? []).map(a => ({
        id: a.id,
        description: a.description,
        type: a.type,
        created_at: a.created_at,
        author_name: profileMap.get(a.user_id) ?? 'Usuário',
        opportunity_title: oppMap.get(a.opportunity_id) ?? '',
      }))

      setMetrics({
        totalRevenue,
        pipelineValue,
        openDeals: (openOpps ?? []).length,
        wonDeals: wonCount,
        conversionRate,
        dealsByStage,
        monthlyRevenue,
        recentActivities,
      })
      setLoading(false)
    }

    fetchMetrics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { metrics, loading }
}
