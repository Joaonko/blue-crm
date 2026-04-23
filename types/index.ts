export type UserRole = "admin" | "manager" | "sales"

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Client {
  id: string
  organization_id: string
  name: string
  company: string
  email?: string
  phone?: string
  website?: string
  industry?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost"

export interface Deal {
  id: string
  organization_id: string
  client_id: string
  client?: Client
  title: string
  value: number
  stage: DealStage
  owner_id: string
  owner?: Profile
  expected_close_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  organization_id: string
  deal_id?: string
  client_id?: string
  user_id: string
  user?: Profile
  type: "call" | "email" | "meeting" | "note" | "task"
  title: string
  description?: string
  completed: boolean
  due_date?: string
  created_at: string
}

export interface DashboardStats {
  total_clients: number
  total_deals: number
  total_revenue: number
  deals_by_stage: Record<DealStage, number>
  monthly_revenue: { month: string; revenue: number }[]
}
