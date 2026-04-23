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

export type Invitation = {
  id: string
  email: string
  role: MemberRole
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
  token: string
}

type InviteMemberResult = {
  error: Error | { message: string } | null
  token: string | null
  emailSent: boolean
  emailError: string | null
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
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
    }

    // Busca convites pendentes
    const { data: invitesData } = await supabase
      .from('invitations')
      .select('id, email, role, status, expires_at, created_at, token')
      .eq('organization_id', currentMember.organization_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    setInvitations((invitesData as Invitation[]) ?? [])
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

  async function inviteMember(email: string, role: MemberRole): Promise<InviteMemberResult> {
    if (!orgId) {
      return { error: new Error('Organização não encontrada'), token: null, emailSent: false, emailError: null }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: new Error('Não autenticado'), token: null, emailSent: false, emailError: null }
    }

    const normalizedEmail = email.trim().toLowerCase()
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('invitations').insert({
      organization_id: orgId,
      email: normalizedEmail,
      role,
      token,
      invited_by: user.id,
      expires_at: expiresAt,
      status: 'pending',
    })

    let emailSent = false
    let emailError: string | null = null

    if (!error) {
      try {
        const response = await fetch('/api/invite/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            token,
            role,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          emailError = payload?.error ?? 'Nao foi possivel enviar o e-mail de convite.'
        } else {
          emailSent = true
        }
      } catch {
        emailError = 'Nao foi possivel enviar o e-mail de convite.'
      }

      await fetchData()
    }

    return { error, token: error ? null : token, emailSent, emailError }
  }

  async function cancelInvitation(invitationId: string) {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId)

    if (!error) {
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
    }
    return { error }
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    members,
    invitations,
    orgId,
    currentUserRole,
    loading,
    changeRole,
    removeMember,
    inviteMember,
    cancelInvitation,
    refresh: fetchData,
  }
}
