'use client'

import { useState } from 'react'
import { useProducts } from '@/lib/hooks/useProducts'
import { Check, Package, Pencil, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ProductsPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingSaving, setEditingSaving] = useState(false)

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

  function startEditing(id: string, currentName: string) {
    setEditingId(id)
    setEditingName(currentName)
    setError(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingName('')
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) return

    setEditingSaving(true)
    setError(null)

    const { error } = await updateProduct(id, editingName)

    if (error) {
      setError(error.message)
      setEditingSaving(false)
      return
    }

    cancelEditing()
    setEditingSaving(false)
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
          <Input
            type="text"
            placeholder="Ex: Consultoria mensal, Licença SaaS, Desenvolvimento..."
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
            className="h-10 rounded-xl bg-slate-50"
          />
          <Button
            type="submit"
            disabled={saving || !name.trim()}
            className="h-10 rounded-xl bg-gradient-to-r from-blue to-blue-vivid text-white shadow-sm shrink-0 hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
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
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-blue" />
                    </div>
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="h-9 rounded-lg"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              void handleUpdate(p.id)
                            }
                            if (e.key === 'Escape') {
                              cancelEditing()
                            }
                          }}
                        />
                        <Button
                          size="icon-sm"
                          className="bg-blue hover:bg-blue/90 text-white shrink-0"
                          disabled={editingSaving || !editingName.trim()}
                          onClick={() => void handleUpdate(p.id)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="shrink-0"
                          disabled={editingSaving}
                          onClick={cancelEditing}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-navy truncate">{p.name}</span>
                    )}
                  </div>
                  {editingId !== p.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(p.id, p.name)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue text-muted-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deletingId === p.id}
                        className={cn(
                          'p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground',
                          deletingId === p.id && 'opacity-50 pointer-events-none'
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
