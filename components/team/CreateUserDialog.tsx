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
import { UserPlus } from 'lucide-react'
import { type MemberRole, type useTeam } from '@/lib/hooks/useTeam'

const roleLabels: Record<MemberRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
}

type Props = {
  onCreateUser: ReturnType<typeof useTeam>['createMemberAccount']
}

export function CreateUserDialog({ onCreateUser }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<MemberRole>('member')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await onCreateUser(fullName, email, password, role)

    if (error) {
      setError(error.message)
    } else {
      setSuccessMessage(`Usuário ${fullName} criado com sucesso. Compartilhe o login e a senha com ${email}.`)
    }

    setLoading(false)
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setRole('member')
      setError(null)
      setSuccessMessage(null)
    }

    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger className={buttonVariants({ className: 'bg-blue hover:bg-blue/90 text-white' })}>
        <UserPlus className="w-4 h-4 mr-2" />
        Criar Usuário
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Criar Usuário</DialogTitle>
          <DialogDescription>
            Crie o acesso de um novo usuário com e-mail e senha definidos por você.
          </DialogDescription>
        </DialogHeader>

        {successMessage ? (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </div>
            <p className="text-xs text-muted-foreground">
              O usuário já poderá entrar no sistema sem confirmação por e-mail.
            </p>
            <Button className="w-full bg-blue hover:bg-blue/90" onClick={() => handleClose(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input
                id="fullName"
                placeholder="João Silva"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="colaborador@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Papel *</Label>
              <Select value={role} onValueChange={v => setRole((v ?? 'member') as MemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['admin', 'manager', 'member'] as MemberRole[]).map(currentRole => (
                    <SelectItem key={currentRole} value={currentRole}>
                      {roleLabels[currentRole]}
                    </SelectItem>
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
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
