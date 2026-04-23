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
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('member')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error, token } = await onInvite(email, role)

    if (error) {
      setError(error.message)
    } else if (token) {
      setInviteLink(`${window.location.origin}/invite/${token}`)
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
            Gere um link de convite para adicionar alguém à sua organização.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Convite criado! Compartilhe o link abaixo com <strong>{email}</strong>:
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
                {loading ? 'Gerando...' : 'Gerar Convite'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
