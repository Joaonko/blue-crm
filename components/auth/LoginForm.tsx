'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildAuthRedirectQuery } from '@/lib/auth/redirect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  initialEmail: string
  nextPath: string
}

export function LoginForm({ initialEmail, nextPath }: Props) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(nextPath)
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
      <div className="mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue to-blue-vivid flex items-center justify-center mb-4 shadow-sm lg:hidden">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <h1 className="text-2xl font-bold text-navy">Bem-vindo de volta</h1>
        <p className="text-muted-foreground text-sm mt-1">Entre na sua conta para continuar</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="joao@empresa.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-11 rounded-xl border-slate-200 focus:border-blue"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            className="h-11 rounded-xl border-slate-200 focus:border-blue"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-blue to-blue-vivid text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm mt-2"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Não tem conta?{' '}
        <Link
          href={`/register${buildAuthRedirectQuery(nextPath, email || initialEmail)}`}
          className="text-blue font-medium hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  )
}
