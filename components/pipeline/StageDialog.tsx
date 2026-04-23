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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  loading?: boolean
  error?: string | null
  initialName?: string
  initialColor?: string
  onSubmit: (values: { name: string; color: string }) => Promise<void> | void
}

export function StageDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  loading = false,
  error = null,
  initialName = '',
  initialColor = '#6C7A89',
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)

  useEffect(() => {
    if (!open) return
    setName(initialName)
    setColor(initialColor)
  }, [initialColor, initialName, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({ name, color })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stage-name">Nome *</Label>
            <Input
              id="stage-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Reunião agendada"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stage-color">Cor</Label>
            <div className="flex items-center gap-3">
              <Input
                id="stage-color"
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
              />
              <Input
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="#6C7A89"
                className="font-mono uppercase"
              />
            </div>
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
