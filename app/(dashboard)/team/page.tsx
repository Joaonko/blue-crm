'use client'

import { useTeam, type MemberRole } from '@/lib/hooks/useTeam'
import { InviteDialog } from '@/components/team/InviteDialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Clock, X } from 'lucide-react'
import { useState } from 'react'

const roleLabels: Record<MemberRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
}

const roleBadgeVariant: Record<MemberRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'default',
  manager: 'secondary',
  member: 'outline',
}

const canManage = (role: MemberRole | null) =>
  role === 'owner' || role === 'admin'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function TeamPage() {
  const {
    members, invitations, currentUserRole, loading,
    changeRole, removeMember, inviteMember, cancelInvitation,
  } = useTeam()

  const [removing, setRemoving] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remover ${name} da organização?`)) return
    setRemoving(memberId)
    await removeMember(memberId)
    setRemoving(null)
  }

  async function handleCancelInvite(id: string) {
    setCancelling(id)
    await cancelInvitation(id)
    setCancelling(null)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Equipe</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {members.length} {members.length === 1 ? 'membro' : 'membros'}
          </p>
        </div>
        {canManage(currentUserRole) && (
          <InviteDialog onInvite={inviteMember} />
        )}
      </div>

      {/* Membros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membros Ativos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {members.map((member, i) => (
            <div key={member.id}>
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-blue/10 text-blue text-sm font-semibold">
                      {initials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-navy">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Editar papel — só admin/owner podem, e não podem editar o owner */}
                  {canManage(currentUserRole) && member.role !== 'owner' ? (
                    <Select
                      value={member.role}
                      onValueChange={v => changeRole(member.id, (v ?? member.role) as MemberRole)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue>
                          {(v: string) => roleLabels[v as MemberRole] ?? v}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(['admin', 'manager', 'member'] as MemberRole[]).map(r => (
                          <SelectItem key={r} value={r} label={roleLabels[r]}>{roleLabels[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={roleBadgeVariant[member.role]}>
                      {roleLabels[member.role]}
                    </Badge>
                  )}

                  {/* Remover — só admin/owner e não pode remover o owner */}
                  {canManage(currentUserRole) && member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      disabled={removing === member.id}
                      onClick={() => handleRemove(member.id, member.full_name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Convites pendentes */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Convites Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invitations.map((inv, i) => (
              <div key={inv.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-navy">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expira em {new Date(inv.expires_at).toLocaleDateString('pt-BR')} •{' '}
                      {roleLabels[inv.role]}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    disabled={cancelling === inv.id}
                    onClick={() => handleCancelInvite(inv.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
