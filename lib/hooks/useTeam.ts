'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export type MemberRole = 'owner' | 'admin' | 'manager' | 'member'

export type TeamMember = {
  id: string
  user_id: string
  role: MemberRole
  joined_at: string
  full_name: string
  avatar_url: string | null
}

type CreateMemberAccountResult = {
  error: Error | { message: string } | null
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Busca org e papel do usuário atual
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!currentMember) { setLoading(false); return }
    setOrgId(currentMember.organization_id)
    setCurrentUserRole(currentMember.role as MemberRole)

    // Busca todos os membros ativos
    const { data: membersData } = await supabase
      .from('organization_members')
      .select('id, user_id, role, joined_at')
      .eq('organization_id', currentMember.organization_id)
      .eq('active', true)
      .order('joined_at', { ascending: true })

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map(m => m.user_id)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) ?? [])

      setMembers(
        membersData.map(m => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role as MemberRole,
          joined_at: m.joined_at,
          full_name: profilesMap.get(m.user_id)?.full_name ?? 'Usuário',
          avatar_url: profilesMap.get(m.user_id)?.avatar_url ?? null,
        }))
      )
    } else {
      setMembers([])
    }

    setLoading(false)
  }

  async function changeRole(memberId: string, newRole: MemberRole) {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) {
      setMembers(prev =>
        prev.map(m => m.id === memberId ? { ...m, role: newRole } : m)
      )
    }
    return { error }
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase
      .from('organization_members')
      .update({ active: false })
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
    }
    return { error }
  }

  async function createMemberAccount(
    fullName: string,
    email: string,
    password: string,
    role: MemberRole
  ): Promise<CreateMemberAccountResult> {
    if (!orgId) {
      return { error: new Error('Organização não encontrada') }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: new Error('Não autenticado') }
    }

    try {
      const response = await fetch('/api/team/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        return { error: { message: payload?.error ?? 'Nao foi possivel criar o usuario.' } }
      }

      await fetchData()
      return { error: null }
    } catch {
      return { error: { message: 'Nao foi possivel criar o usuario.' } }
    }
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    members,
    orgId,
    currentUserRole,
    loading,
    changeRole,
    removeMember,
    createMemberAccount,
    refresh: fetchData,
  }
}
