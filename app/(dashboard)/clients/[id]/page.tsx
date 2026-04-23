'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type Client } from '@/lib/hooks/useClients'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, FileText,
  Pencil, Trash2, Kanban, DollarSign, TrendingUp,
} from 'lucide-react'

type Opportunity = {
  id: string
  title: string
  value: number
  status: 'open' | 'won' | 'lost'
  stage: { name: string; color: string } | null
  created_at: string
}

const companySizeLabels = {
  micro: 'Micro',
  small: 'Pequena',
  medium: 'Média',
  large: 'Grande',
}

const statusConfig = {
  open: { label: 'Em andamento', variant: 'secondary' as const },
  won: { label: 'Ganho', variant: 'default' as const },
  lost: { label: 'Perdido', variant: 'destructive' as const },
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [client, setClient] = useState<Client | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [{ data: clientData }, { data: oppsData }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase
          .from('opportunities')
          .select('id, title, value, status, created_at, stage:stages(name, color)')
          .eq('client_id', id)
          .order('created_at', { ascending: false }),
      ])

      setClient(clientData)
      setOpportunities((oppsData as unknown as Opportunity[]) || [])
      setLoading(false)
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (!error) router.push('/clients')
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
        <Link href="/clients" className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
          Voltar para Clientes
        </Link>
      </div>
    )
  }

  const totalRevenue = opportunities.filter(o => o.status === 'won').reduce((s, o) => s + o.value, 0)
  const openValue = opportunities.filter(o => o.status === 'open').reduce((s, o) => s + o.value, 0)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/clients" className={buttonVariants({ variant: 'ghost' })}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>

      {/* Título */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-blue/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-7 h-7 text-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {client.industry && <span className="text-gray-500 text-sm">{client.industry}</span>}
            {client.industry && client.company_size && <span className="text-gray-300">•</span>}
            {client.company_size && (
              <Badge variant="outline">{companySizeLabels[client.company_size]}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue/10 flex items-center justify-center">
                <Kanban className="w-4 h-4 text-blue" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Oportunidades</p>
                <p className="text-xl font-bold text-navy">{opportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Fechada</p>
                <p className="text-xl font-bold text-navy">
                  {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Negociação</p>
                <p className="text-xl font-bold text-navy">
                  {openValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contato</p>
              <p className="font-medium text-sm">{client.contact_name}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a href={`mailto:${client.contact_email}`} className="hover:text-blue truncate">
                {client.contact_email}
              </a>
            </div>

            {client.contact_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${client.contact_phone}`} className="hover:text-blue">
                  {client.contact_phone}
                </a>
              </div>
            )}

            {client.cnpj && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CNPJ</p>
                  <p className="text-sm font-mono">{client.cnpj}</p>
                </div>
              </>
            )}

            {client.address && (
              <>
                <Separator />
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{client.address}</span>
                </div>
              </>
            )}

            {client.notes && (
              <>
                <Separator />
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap">{client.notes}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Oportunidades */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Histórico de Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhuma oportunidade registrada para este cliente.
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map(opp => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: opp.stage?.color ?? '#6C7A89' }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-navy truncate">{opp.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {opp.stage?.name ?? '—'} •{' '}
                          {new Date(opp.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-sm text-blue">
                        {opp.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <Badge variant={statusConfig[opp.status].variant}>
                        {statusConfig[opp.status].label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
