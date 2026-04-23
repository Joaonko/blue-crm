import Link from 'next/link'
import { Opportunity } from '@/lib/hooks/useOpportunities'
import { Package } from 'lucide-react'

type Props = {
  opportunity: Opportunity
}

function paymentLabel(type?: string | null, installments?: number | null) {
  if (!type) return null
  if (type === 'cash') return 'À vista'
  if (type === 'installment' && installments) return `${installments}x`
  return 'Parcelado'
}

const temperatureEmoji: Record<string, string> = {
  cold: '🧊',
  warm: '🌡️',
  hot: '🔥',
}

export function OpportunityCard({ opportunity }: Props) {
  const payment = paymentLabel(opportunity.payment_type, opportunity.installments)

  return (
    <Link href={`/pipeline/${opportunity.id}`} tabIndex={-1}>
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-2.5 cursor-pointer hover:shadow-md hover:border-blue/30 hover:-translate-y-0.5 transition-all duration-150 group">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <h3 className="font-semibold text-navy text-[13px] leading-snug group-hover:text-blue transition-colors line-clamp-2 flex-1">
            {opportunity.title}
          </h3>
          {opportunity.lead_temperature && (
            <span className="text-base leading-none shrink-0 mt-0.5" title={{ cold: 'Lead Frio', warm: 'Lead Morno', hot: 'Lead Quente' }[opportunity.lead_temperature]}>
              {temperatureEmoji[opportunity.lead_temperature]}
            </span>
          )}
        </div>

        {opportunity.product && (
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="w-3 h-3 text-blue/60 shrink-0" />
            <span className="text-[11px] text-blue/80 font-medium truncate">{opportunity.product.name}</span>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mb-3 truncate">
          {opportunity.client?.name || 'Cliente não informado'}
        </p>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy text-sm">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(opportunity.value)}
            </span>
            {payment && (
              <span className="text-[10px] font-semibold text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded-full">
                {payment}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[90px]">
            {opportunity.owner?.full_name?.split(' ')[0] || 'Sem dono'}
          </span>
        </div>
      </div>
    </Link>
  )
}
