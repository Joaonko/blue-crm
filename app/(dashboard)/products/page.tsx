'use client'

import { useState } from 'react'
import { useProducts } from '@/lib/hooks/useProducts'
import { Package, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const { products, loading, createProduct, deleteProduct } = useProducts()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const { error } = await createProduct(name)
    if (error) setError(error.message)
    else setName('')
    setSaving(false)
  }

  async function handleDelete(id: string, productName: string) {
    if (!confirm(`Remover "${productName}"?`)) return
    setDeletingId(id)
    await deleteProduct(id)
    setDeletingId(null)
  }

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy tracking-tight">Produtos & Serviços</h1>
        <p className="text-muted-foreground text-sm mt-1">Catálogo do que você vende — selecione nos negócios do pipeline</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h2 className="font-semibold text-navy text-sm mb-4">Adicionar produto ou serviço</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            placeholder="Ex: Consultoria mensal, Licença SaaS, Desenvolvimento..."
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
            className="flex-1 h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-gradient-to-r from-blue to-blue-vivid text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </form>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-3">{error}</p>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {products.length} {products.length === 1 ? 'produto' : 'produtos'}
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 group hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-blue" />
                    </div>
                    <span className="text-sm font-medium text-navy">{p.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deletingId === p.id}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground',
                      deletingId === p.id && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
