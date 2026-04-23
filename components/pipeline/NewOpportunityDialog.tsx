'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useClients } from '@/lib/hooks/useClients'
import { useProducts } from '@/lib/hooks/useProducts'
import { Stage } from '@/lib/hooks/useOpportunities'

type Props = {
  funnelId: string | null
  stages: Stage[]
  onSuccess: () => void
}

export function NewOpportunityDialog({ funnelId, stages, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { clients } = useClients()
  const { products } = useProducts()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    stage_id: stages[0]?.id || '',
    product_id: '',
    value: '',
    payment_type: '' as '' | 'cash' | 'installment',
    installments: '',
    lead_temperature: '' as '' | 'cold' | 'warm' | 'hot',
    description: '',
  })

  function set(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    setFormData(prev => {
      const stageExists = stages.some(stage => stage.id === prev.stage_id)
      return {
        ...prev,
        stage_id: stageExists ? prev.stage_id : (stages[0]?.id || ''),
      }
    })
  }, [stages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Usuário não autenticado.'); setLoading(false); return }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!member) { setError('Você não está vinculado a nenhuma organização.'); setLoading(false); return }
    if (!funnelId) { setError('Nenhum funil selecionado.'); setLoading(false); return }
    if (!formData.stage_id) { setError('Crie uma etapa antes de adicionar oportunidades.'); setLoading(false); return }

    const { data: opp, error: insertError } = await supabase
      .from('opportunities')
      .insert({
        organization_id: member.organization_id,
        funnel_id: funnelId,
        title: formData.title,
        client_id: formData.client_id,
        stage_id: formData.stage_id,
        product_id: formData.product_id || null,
        value: parseFloat(formData.value),
        payment_type: formData.payment_type || null,
        installments: formData.payment_type === 'installment' && formData.installments
          ? parseInt(formData.installments)
          : null,
        lead_temperature: formData.lead_temperature || null,
        owner_id: user.id,
        description: formData.description,
        status: 'open',
      })
      .select('id')
      .single()

    if (insertError || !opp) {
      setError(`Erro ao criar: ${insertError?.message ?? 'erro desconhecido'}`)
      setLoading(false)
      return
    }

    await supabase.from('activities').insert({
      organization_id: member.organization_id,
      opportunity_id: opp.id,
      user_id: user.id,
      type: 'created',
      description: 'Criou a oportunidade',
    })

    setOpen(false)
    setFormData({ title: '', client_id: '', stage_id: stages[0]?.id || '', product_id: '', value: '', payment_type: '', installments: '', lead_temperature: '', description: '' })
    onSuccess()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={!funnelId || stages.length === 0}
        className={buttonVariants({
          className: 'bg-gradient-to-r from-blue to-blue-vivid hover:opacity-90 text-white rounded-xl shadow-sm disabled:cursor-not-allowed disabled:opacity-50',
        })}
      >
        <Plus className="w-4 h-4 mr-2" />
        Nova Oportunidade
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade</DialogTitle>
          <DialogDescription>Adicione uma nova oportunidade ao pipeline</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" placeholder="Ex: Dalla Lavacar - App Mobile" value={formData.title}
              onChange={e => set('title', e.target.value)} required />
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select value={formData.client_id} onValueChange={v => set('client_id', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente">
                  {(v: string) => clients.find(c => c.id === v)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clients.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado.</p>
            )}
          </div>

          {/* Produto */}
          <div className="space-y-1.5">
            <Label>Produto / Serviço</Label>
            <Select value={formData.product_id} onValueChange={v => set('product_id', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)">
                  {(v: string) => products.find(p => p.id === v)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {products.length === 0 && (
              <p className="text-xs text-muted-foreground">Cadastre produtos em <strong>Produtos</strong> no menu.</p>
            )}
          </div>

          {/* Etapa */}
          <div className="space-y-1.5">
            <Label>Etapa Inicial *</Label>
            <Select value={formData.stage_id} onValueChange={v => set('stage_id', v ?? '')}>
              <SelectTrigger>
                <SelectValue>
                  {(v: string) => stages.find(s => s.id === v)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {stages.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor + Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value">Valor (R$) *</Label>
              <Input id="value" type="number" step="0.01" min="0" placeholder="0,00"
                value={formData.value} onChange={e => set('value', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Pagamento</Label>
              <Select value={formData.payment_type} onValueChange={v => set('payment_type', v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione">
                    {(v: string) => v === 'cash' ? 'À vista' : v === 'installment' ? 'Parcelado' : ''}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">À vista</SelectItem>
                  <SelectItem value="installment">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parcelas */}
          {formData.payment_type === 'installment' && (
            <div className="space-y-1.5">
              <Label htmlFor="installments">Número de parcelas *</Label>
              <Input id="installments" type="number" min="2" max="360" placeholder="Ex: 12"
                value={formData.installments} onChange={e => set('installments', e.target.value)} required />
            </div>
          )}

          {/* Temperatura do lead */}
          <div className="space-y-1.5">
            <Label>Temperatura do Lead</Label>
            <div className="flex gap-2">
              {([
                { value: 'cold', emoji: '🧊', label: 'Frio' },
                { value: 'warm', emoji: '🌡️', label: 'Morno' },
                { value: 'hot',  emoji: '🔥', label: 'Quente' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('lead_temperature', formData.lead_temperature === opt.value ? '' : opt.value)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border text-sm font-medium transition-all ${
                    formData.lead_temperature === opt.value
                      ? 'border-blue bg-blue/10 text-blue'
                      : 'border-slate-200 text-muted-foreground hover:border-slate-300'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" placeholder="Detalhes sobre a oportunidade..."
              value={formData.description} onChange={e => set('description', e.target.value)} rows={2} />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={loading || !formData.client_id}
              className="flex-1 bg-gradient-to-r from-blue to-blue-vivid hover:opacity-90 text-white">
              {loading ? 'Criando...' : 'Criar Oportunidade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
