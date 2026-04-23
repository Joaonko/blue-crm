'use client'

import { useDashboard } from '@/lib/hooks/useDashboard'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart,
} from 'recharts'
import { TrendingUp, DollarSign, Target, Zap, ArrowUpRight } from 'lucide-react'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}min atrás`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h atrás`
  return `${Math.floor(diffHours / 24)}d atrás`
}

const activityTypeLabel: Record<string, string> = {
  note: 'Nota adicionada',
  stage_change: 'Etapa alterada',
  status_change: 'Status alterado',
  proposal_upload: 'Proposta enviada',
  created: 'Oportunidade criada',
}

const activityDot: Record<string, string> = {
  note: 'bg-indigo-500',
  stage_change: 'bg-blue',
  status_change: 'bg-emerald-500',
  proposal_upload: 'bg-amber-500',
  created: 'bg-purple-500',
}

export default function DashboardPage() {
  const { metrics, loading } = useDashboard()

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const kpis = [
    {
      label: 'Receita Total',
      value: formatCurrency(metrics.totalRevenue),
      sub: `${metrics.wonDeals} negócios ganhos`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Pipeline Aberto',
      value: formatCurrency(metrics.pipelineValue),
      sub: `${metrics.openDeals} negócios ativos`,
      icon: TrendingUp,
      gradient: 'from-blue to-blue-vivid',
      bg: 'bg-blue/10',
      text: 'text-blue',
    },
    {
      label: 'Taxa de Conversão',
      value: `${metrics.conversionRate}%`,
      sub: 'negócios ganhos vs perdidos',
      icon: Target,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
    {
      label: 'Atividade Recente',
      value: `${metrics.recentActivities.length}`,
      sub: 'últimas movimentações',
      icon: Zap,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-navy tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Visão geral do seu pipeline de vendas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-white/80 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-sm`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/40" />
            </div>
            <p className="text-2xl font-bold text-navy leading-none">{kpi.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1.5">{kpi.label}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly revenue area chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-navy text-sm">Receita Mensal</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={metrics.monthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E86C1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2E86C1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(v) => [formatCurrency(Number(v)), 'Receita']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2E86C1" strokeWidth={2.5} fill="url(#blueGrad)" dot={{ r: 4, fill: '#2E86C1', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Deals by stage bar chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/80">
          <div className="mb-6">
            <h2 className="font-semibold text-navy text-sm">Negócios por Etapa</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pipeline aberto</p>
          </div>
          {metrics.dealsByStage.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Nenhum negócio aberto
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.dealsByStage} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(v) => [Number(v), 'Negócios']}
                />
                <Bar dataKey="count" fill="#2E86C1" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pipeline value by stage */}
      {metrics.dealsByStage.some(s => s.value > 0) && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/80">
          <div className="mb-6">
            <h2 className="font-semibold text-navy text-sm">Valor em Pipeline por Etapa</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Total em R$ por etapa aberta</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={metrics.dealsByStage} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(v) => [formatCurrency(Number(v)), 'Valor']}
              />
              <Bar dataKey="value" fill="#1A3A5C" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent activities */}
      {metrics.recentActivities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-white/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-navy text-sm">Atividades Recentes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Últimas movimentações do time</p>
          </div>
          <div className="divide-y divide-slate-50">
            {metrics.recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${activityDot[activity.type] ?? 'bg-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy font-medium truncate">{activity.description}</p>
                  {activity.opportunity_title && (
                    <p className="text-xs text-muted-foreground truncate">{activity.opportunity_title}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-navy/70">{activity.author_name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatRelativeTime(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
