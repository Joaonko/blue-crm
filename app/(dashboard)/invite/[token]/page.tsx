'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type InviteState = 'loading' | 'valid' | 'accepting' | 'success' | 'error' | 'expired' | 'already'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [state, setState] = useState<InviteState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    async function validateInvite() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?next=/invite/${token}`)
        return
      }

      const { data: invite } = await supabase
        .from('invitations')
        .select('id, email, role, status, expires_at, organization_id, organizations(name)')
        .eq('token', token)
        .single()

      if (!invite) {
        setState('error')
        setErrorMsg('Convite não encontrado.')
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
        .single()

      if (existing) {
        setState('already')
        return
      }

      setInviteEmail(invite.email)
      const orgData = invite.organizations as unknown
      const org = (Array.isArray(orgData) ? orgData[0] : orgData) as { name: string } | null
      setOrgName(org?.name ?? 'organização')
      setState('valid')
    }

    validateInvite()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleAccept() {
    setState('accepting')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: invite } = await supabase
      .from('invitations')
      .select('id, role, organization_id')
      .eq('token', token)
      .single()

    if (!invite) {
      setState('error')
      setErrorMsg('Convite inválido.')
      return
    }

    const { error } = await supabase.from('organization_members').insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
      active: true,
    })

    if (error) {
      setState('error')
      setErrorMsg(error.message)
      return
    }

    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

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
                Para entrar na organização <strong>{orgName}</strong>
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
