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
        .select('organization_id, organizations(funnels(id))')
        .eq('user_id', user.id)
        .eq('active', true)
        .single()

      if (!member) { setLoading(false); return }

      const orgId = member.organization_id
      const orgData = member.organizations as unknown
      const org = (Array.isArray(orgData) ? orgData[0] : orgData) as { funnels: { id: string }[] } | null
      const funnelId = org?.funnels?.[0]?.id

      // Fetch all opportunities for the org
      const [
        { data: wonOpps },
        { data: openOpps },
        { data: allOpps },
        { data: recentActivitiesData },
      ] = await Promise.all([
        supabase
          .from('opportunities')
          .select('value, closed_at')
          .eq('organization_id', orgId)
          .eq('status', 'won'),
        supabase
          .from('opportunities')
          .select('value, stage_id')
          .eq('organization_id', orgId)
          .eq('status', 'open'),
        supabase
          .from('opportunities')
          .select('id, status')
          .eq('organization_id', orgId),
        supabase
          .from('activities')
          .select('id, description, type, created_at, user_id, opportunity_id')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const totalRevenue = (wonOpps ?? []).reduce((sum, o) => sum + (o.value ?? 0), 0)
      const pipelineValue = (openOpps ?? []).reduce((sum, o) => sum + (o.value ?? 0), 0)
      const wonCount = (allOpps ?? []).filter(o => o.status === 'won').length
      const lostCount = (allOpps ?? []).filter(o => o.status === 'lost').length
      const conversionRate = wonCount + lostCount > 0
        ? Math.round((wonCount / (wonCount + lostCount)) * 100)
        : 0

      // Deals by stage
      let dealsByStage: DashboardMetrics['dealsByStage'] = []
      if (funnelId) {
        const { data: stages } = await supabase
          .from('stages')
          .select('id, name')
          .eq('funnel_id', funnelId)
          .order('order', { ascending: true })

        dealsByStage = (stages ?? []).map(stage => {
          const stageOpps = (openOpps ?? []).filter(o => o.stage_id === stage.id)
          return {
            stage: stage.name,
            count: stageOpps.length,
            value: stageOpps.reduce((sum, o) => sum + (o.value ?? 0), 0),
          }
        })
      }

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
