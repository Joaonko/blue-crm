'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { type MemberRole } from '@/lib/hooks/useTeam'

type InviteState = 'loading' | 'valid' | 'accepting' | 'success' | 'error' | 'expired' | 'already'

type InviteDetails = {
  id: string
  email: string
  role: MemberRole
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  organization_id: string
  organization_name: string
}

const roleLabels: Record<MemberRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
}

function normalizeInviteError(message?: string) {
  if (!message) return 'Nao foi possivel validar este convite.'
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('outro e-mail')) {
    return 'Este convite pertence a outro e-mail. Entre com a conta correta para continuar.'
  }
  if (normalizedMessage.includes('nao encontrado') || normalizedMessage.includes('não encontrado')) {
    return 'Convite nao encontrado.'
  }
  if (normalizedMessage.includes('expir')) {
    return 'Este convite expirou. Peca um novo convite ao administrador.'
  }
  return message
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [state, setState] = useState<InviteState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [orgName, setOrgName] = useState('')
  const [inviteRole, setInviteRole] = useState('')

  useEffect(() => {
    async function validateInvite() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?next=/invite/${token}`)
        return
      }

      const { data, error } = await supabase.rpc('get_invitation_details', {
        invite_token: token,
      })

      if (error) {
        setState('error')
        setErrorMsg(normalizeInviteError(error.message))
        return
      }

      const invite = data as InviteDetails | null

      if (!invite) {
        setState('error')
        setErrorMsg('Convite nao encontrado.')
        return
      }

      if (invite.status !== 'pending' || new Date(invite.expires_at) < new Date()) {
        setState('expired')
        return
      }

      // Verifica se já é membro
      const { data: existing } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', invite.organization_id)
        .eq('active', true)
        .maybeSingle()

      if (existing) {
        setState('already')
        return
      }

      setInviteEmail(invite.email)
      setOrgName(invite.organization_name ?? 'organizacao')
      setInviteRole(roleLabels[invite.role] ?? 'Membro')
      setState('valid')
    }

    validateInvite()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleAccept() {
    setState('accepting')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/login?next=/invite/${token}`); return }

    const { error } = await supabase.rpc('accept_invitation', {
      invite_token: token,
    })

    if (error) {
      const message = normalizeInviteError(error.message)
      if (message.includes('expirou')) {
        setState('expired')
        return
      }

      setState('error')
      setErrorMsg(message)
      return
    }

    setState('success')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        {state === 'loading' && (
          <>
            <CardHeader className="text-center">
              <Loader2 className="w-10 h-10 mx-auto text-blue animate-spin mb-2" />
              <CardTitle>Validando convite...</CardTitle>
            </CardHeader>
          </>
        )}

        {state === 'valid' && (
          <>
            <CardHeader className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue/10 flex items-center justify-center mb-2">
                <span className="text-blue font-bold text-xl">B</span>
              </div>
              <CardTitle className="text-navy">Você foi convidado!</CardTitle>
              <CardDescription>
                Entre com a conta <strong>{inviteEmail}</strong> para entrar em <strong>{orgName}</strong> como <strong>{inviteRole}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full bg-blue hover:bg-blue/90"
                onClick={handleAccept}
              >
                Aceitar Convite
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                Recusar
              </Button>
            </CardContent>
          </>
        )}

        {state === 'accepting' && (
          <CardHeader className="text-center">
            <Loader2 className="w-10 h-10 mx-auto text-blue animate-spin mb-2" />
            <CardTitle>Aceitando convite...</CardTitle>
          </CardHeader>
        )}

        {state === 'success' && (
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <CardTitle className="text-navy">Bem-vindo!</CardTitle>
            <CardDescription>Você entrou na organização. Redirecionando...</CardDescription>
          </CardHeader>
        )}

        {state === 'expired' && (
          <>
            <CardHeader className="text-center">
              <XCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
              <CardTitle>Convite expirado</CardTitle>
              <CardDescription>Este convite não é mais válido. Peça um novo convite.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                Ir para o Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {state === 'already' && (
          <>
            <CardHeader className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-blue mb-2" />
              <CardTitle className="text-navy">Você já é membro</CardTitle>
              <CardDescription>Você já faz parte desta organização.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue hover:bg-blue/90" onClick={() => router.push('/dashboard')}>
                Ir para o Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {state === 'error' && (
          <>
            <CardHeader className="text-center">
              <XCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
              <CardTitle>Erro</CardTitle>
              <CardDescription>{errorMsg}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                Ir para o Dashboard
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
