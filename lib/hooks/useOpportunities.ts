'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export type Opportunity = {
  id: string
  title: string
  value: number
  stage_id: string
  client_id: string
  owner_id: string
  status: 'open' | 'won' | 'lost'
  lost_reason?: string | null
  closed_at?: string | null
  payment_type?: 'cash' | 'installment' | null
  installments?: number | null
  lead_temperature?: 'cold' | 'warm' | 'hot' | null
  client?: { name: string }
  owner?: { full_name: string }
  product?: { name: string } | null
}

export type Stage = {
  id: string
  name: string
  order: number
  color: string
  funnel_id: string
}

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [wonOpportunities, setWonOpportunities] = useState<Opportunity[]>([])
  const [lostOpportunities, setLostOpportunities] = useState<Opportunity[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [funnelId, setFunnelId] = useState<string | null>(null)
  const supabase = createClient()

  async function fetchData() {
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
    setOrgId(member.organization_id)

    const { data: funnel } = await supabase
      .from('funnels')
      .select('id')
      .eq('organization_id', member.organization_id)
      .eq('active', true)
      .single()

    if (!funnel) { setLoading(false); return }
    setFunnelId(funnel.id)

    const select = '*, client:clients(name), owner:profiles!opportunities_owner_id_fkey_profiles(full_name), product:products(name)'

    const [
      { data: stagesData },
      { data: openData },
      { data: wonData },
      { data: lostData },
    ] = await Promise.all([
      supabase.from('stages').select('*').eq('funnel_id', funnel.id).order('order', { ascending: true }),
      supabase.from('opportunities').select(select).eq('funnel_id', funnel.id).eq('status', 'open'),
      supabase.from('opportunities').select(select).eq('funnel_id', funnel.id).eq('status', 'won').order('closed_at', { ascending: false }),
      supabase.from('opportunities').select(select).eq('funnel_id', funnel.id).eq('status', 'lost').order('closed_at', { ascending: false }),
    ])

    setStages(stagesData || [])
    setOpportunities(openData || [])
    setWonOpportunities(wonData || [])
    setLostOpportunities(lostData || [])
    setLoading(false)
  }

  async function moveOpportunity(opportunityId: string, newStageId: string) {
    setOpportunities(prev =>
      prev.map(opp =>
        opp.id === opportunityId ? { ...opp, stage_id: newStageId } : opp
      )
    )

    const { error } = await supabase
      .from('opportunities')
      .update({ stage_id: newStageId })
      .eq('id', opportunityId)

    if (error) {
      setOpportunities(prev =>
        prev.map(opp =>
          opp.id === opportunityId ? { ...opp, stage_id: opp.stage_id } : opp
        )
      )
    } else if (orgId) {
      const { data: { user } } = await supabase.auth.getUser()
      supabase.from('activities').insert({
        organization_id: orgId,
        opportunity_id: opportunityId,
        user_id: user?.id,
        type: 'stage_change',
        description: 'Moveu a oportunidade para outra etapa',
        metadata: { new_stage_id: newStageId },
      })
    }

    return { error }
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    opportunities, wonOpportunities, lostOpportunities,
    stages, loading, moveOpportunity, refresh: fetchData,
  }
}
