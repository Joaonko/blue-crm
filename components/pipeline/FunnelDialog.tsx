'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  loading?: boolean
  error?: string | null
  initialName?: string
  initialDescription?: string | null
  onSubmit: (values: { name: string; description: string }) => Promise<void> | void
}

export function FunnelDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  loading = false,
  error = null,
  initialName = '',
  initialDescription = '',
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName)
  const [details, setDetails] = useState(initialDescription ?? '')

  useEffect(() => {
    if (!open) return
    setName(initialName)
    setDetails(initialDescription ?? '')
  }, [initialDescription, initialName, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({ name, description: details })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="funnel-name">Nome *</Label>
            <Input
              id="funnel-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Vendas Enterprise"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="funnel-description">Descrição</Label>
            <Textarea
              id="funnel-description"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Opcional"
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
