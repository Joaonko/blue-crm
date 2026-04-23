'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export type Product = {
  id: string
  name: string
  active: boolean
  created_at: string
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchProducts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!member) { setLoading(false); return }

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', member.organization_id)
      .eq('active', true)
      .order('name')

    setProducts(data ?? [])
    setLoading(false)
  }

  async function createProduct(name: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Não autenticado') }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!member) return { error: new Error('Sem organização') }

    const { data, error } = await supabase
      .from('products')
      .insert({ organization_id: member.organization_id, name: name.trim() })
      .select()
      .single()

    if (!error && data) setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { error }
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id)

    if (!error) setProducts(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  useEffect(() => {
    fetchProducts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { products, loading, createProduct, deleteProduct, refresh: fetchProducts }
}
