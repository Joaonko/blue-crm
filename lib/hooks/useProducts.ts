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

  function sortProducts(list: Product[]) {
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }

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

    setProducts(sortProducts(data ?? []))
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

    if (!error && data) setProducts(prev => sortProducts([...prev, data]))
    return { error }
  }

  async function updateProduct(id: string, name: string) {
    const trimmedName = name.trim()
    if (!trimmedName) return { error: new Error('Nome obrigatório') }

    const { data, error } = await supabase
      .from('products')
      .update({ name: trimmedName })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setProducts(prev =>
        sortProducts(
          prev.map(product => product.id === id ? data : product)
        )
      )
    }

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

  return { products, loading, createProduct, updateProduct, deleteProduct, refresh: fetchProducts }
}
