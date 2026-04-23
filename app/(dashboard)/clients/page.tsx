'use client'

import { useState } from 'react'
import { useClients, type Client } from '@/lib/hooks/useClients'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Mail, Phone, User, LayoutGrid, List, ArrowUpDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const companySizeLabels: Record<string, string> = {
  micro: 'Micro',
  small: 'Pequena',
  medium: 'Média',
  large: 'Grande',
}

const companySizeBg: Record<string, string> = {
  micro: 'bg-slate-100 text-slate-600',
  small: 'bg-blue/10 text-blue',
  medium: 'bg-violet-50 text-violet-600',
  large: 'bg-emerald-50 text-emerald-600',
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

type SortKey = 'name' | 'industry' | 'created_at'

export default function ClientsPage() {
  const { clients, loading } = useClients()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const filtered = clients
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_email.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = (a[sortKey] ?? '') as string
      const vb = (b[sortKey] ?? '') as string
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-9 bg-slate-200 rounded-xl w-40 animate-pulse" />
        <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </p>
        </div>
        <Link href="/clients/new" className={buttonVariants({ className: 'bg-gradient-to-r from-blue to-blue-vivid hover:opacity-90 text-white rounded-xl shadow-sm' })}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar por nome, contato, setor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-4 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              view === 'grid' ? 'bg-blue text-white shadow-sm' : 'text-muted-foreground hover:text-navy'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cards
          </button>
          <button
            onClick={() => setView('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              view === 'table' ? 'bg-blue text-white shadow-sm' : 'text-muted-foreground hover:text-navy'
            )}
          >
            <List className="w-3.5 h-3.5" />
            Tabela
          </button>
        </div>
      </div>

      {/* Empty state */}
      {clients.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-navy mb-1">Nenhum cliente cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-6">Comece adicionando seu primeiro cliente</p>
          <Link href="/clients/new" className={buttonVariants({ className: 'bg-gradient-to-r from-blue to-blue-vivid text-white rounded-xl' })}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Cliente
          </Link>
        </div>
      )}

      {/* No results */}
      {clients.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <p className="text-muted-foreground text-sm">Nenhum cliente encontrado para &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client: Client) => (
            <Link key={client.id} href={`/clients/${client.id}`} className="group block">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md hover:border-blue/30 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue/20 to-blue-vivid/20 flex items-center justify-center shrink-0">
                    <span className="text-blue font-bold text-sm">{initials(client.name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-navy text-sm truncate group-hover:text-blue transition-colors">
                      {client.name}
                    </h3>
                    {client.industry && (
                      <p className="text-xs text-muted-foreground truncate">{client.industry}</p>
                    )}
                  </div>
                  {client.company_size && (
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', companySizeBg[client.company_size])}>
                      {companySizeLabels[client.company_size]}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{client.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{client.contact_email}</span>
                  </div>
                  {client.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{client.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-navy transition-colors"
                  >
                    Empresa
                    <ArrowUpDown className={cn('w-3 h-3', sortKey === 'name' ? 'text-blue' : 'text-slate-300')} />
                  </button>
                </th>
                <th className="text-left px-5 py-3.5">
                  <button
                    onClick={() => toggleSort('industry')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-navy transition-colors"
                  >
                    Setor
                    <ArrowUpDown className={cn('w-3 h-3', sortKey === 'industry' ? 'text-blue' : 'text-slate-300')} />
                  </button>
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contato</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Telefone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Porte</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((client: Client) => (
                <tr key={client.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue/15 to-blue-vivid/15 flex items-center justify-center shrink-0">
                        <span className="text-blue font-bold text-xs">{initials(client.name)}</span>
                      </div>
                      <span className="font-medium text-navy">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">
                    {client.industry ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">
                    {client.contact_name}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                    {client.contact_email}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                    {client.contact_phone ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {client.company_size ? (
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', companySizeBg[client.company_size])}>
                        {companySizeLabels[client.company_size]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/clients/${client.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                      Ver
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-muted-foreground">
            {filtered.length} de {clients.length} clientes
          </div>
        </div>
      )}
    </div>
  )
}
