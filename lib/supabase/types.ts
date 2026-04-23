export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          settings: Record<string, unknown>
          created_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'manager' | 'member'
          active: boolean
          invited_by: string | null
          joined_at: string
          created_at: string
        }
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          name: string
          cnpj: string | null
          contact_name: string
          contact_email: string
          contact_phone: string | null
          industry: string | null
          company_size: 'micro' | 'small' | 'medium' | 'large' | null
          address: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
      }
      opportunities: {
        Row: {
          id: string
          organization_id: string
          title: string
          client_id: string
          funnel_id: string
          stage_id: string
          owner_id: string
          value: number
          expected_close_date: string | null
          probability: number | null
          status: 'open' | 'won' | 'lost'
          lost_reason: string | null
          description: string | null
          created_at: string
          updated_at: string
          closed_at: string | null
        }
      }
      funnels: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          active: boolean
          created_by: string
          created_at: string
        }
      }
      stages: {
        Row: {
          id: string
          organization_id: string
          funnel_id: string
          name: string
          order: number
          color: string
          probability: number
          created_at: string
        }
      }
    }
  }
}
