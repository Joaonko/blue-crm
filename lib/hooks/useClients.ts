'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export type Client = {
  id: string
  name: string
  cnpj?: string | null
  contact_name: string
  contact_email: string
  contact_phone?: string | null
  industry?: string | null
  company_size?: 'micro' | 'small' | 'medium' | 'large' | null
  address?: string | null
  notes?: string | null
  created_at: string
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    setClients(data || [])
    setLoading(false)
  }

  async function deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (!error) {
      setClients(prev => prev.filter(c => c.id !== id))
    }

    return { error }
  }

  useEffect(() => {
    fetchClients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { clients, loading, refresh: fetchClients, deleteClient }
}
