'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { UserPlus, Copy, Check } from 'lucide-react'
import { type MemberRole, type useTeam } from '@/lib/hooks/useTeam'

const roleLabels: Record<MemberRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
}

type Props = {
  onInvite: ReturnType<typeof useTeam>['inviteMember']
}

export function InviteDialog({ onInvite }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<'sent' | 'failed' | null>(null)
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('member')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error, token, emailSent, emailError } = await onInvite(email, role)

    if (error) {
      setError(error.message)
    } else if (token) {
      setInviteLink(`${window.location.origin}/invite/${token}`)
      if (emailSent) {
        setEmailStatus('sent')
        setEmailStatusMessage(`Convite enviado para ${email}.`)
      } else {
        setEmailStatus('failed')
        setEmailStatusMessage(emailError ?? 'Convite criado, mas o e-mail nao pode ser enviado.')
      }
    }

    setLoading(false)
  }

  async function handleCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose(open: boolean) {
    if (!open) {
      setEmail('')
      setRole('member')
      setError(null)
      setInviteLink(null)
      setEmailStatus(null)
      setEmailStatusMessage(null)
      setCopied(false)
    }
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger className={buttonVariants({ className: 'bg-blue hover:bg-blue/90 text-white' })}>
        <UserPlus className="w-4 h-4 mr-2" />
        Convidar Membro
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            Envie um convite por e-mail para adicionar alguem a sua organizacao.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4 mt-2">
            <div
              className={emailStatus === 'sent'
                ? 'rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700'
                : 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700'}
            >
              {emailStatusMessage}
            </div>
            <p className="text-sm text-muted-foreground">
              {emailStatus === 'sent'
                ? <>O link abaixo continua disponivel caso voce queira copiar manualmente para <strong>{email}</strong>.</>
                : <>O convite foi criado. Compartilhe o link abaixo manualmente com <strong>{email}</strong>.</>}
            </p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon-sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O link expira em 7 dias. O usuário deve estar cadastrado ou criar uma conta ao clicar.
            </p>
            <Button className="w-full bg-blue hover:bg-blue/90" onClick={() => handleClose(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="colega@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Papel *</Label>
              <Select value={role} onValueChange={v => setRole((v ?? 'member') as MemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['admin', 'manager', 'member'] as MemberRole[]).map(r => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-blue hover:bg-blue/90">
                {loading ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
