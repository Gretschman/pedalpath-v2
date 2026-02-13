// Database types will be generated from Supabase schema
// For now, we'll define basic types manually

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string  // Column name in database (not 'title')
  description?: string
  schematic_url?: string
  status: 'draft' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface BuildStep {
  id: string
  project_id: string
  step_number: number
  title: string
  description: string
  image_url?: string
  completed: boolean
  created_at: string
}

export interface Component {
  id: string
  project_id: string
  name: string
  value: string
  quantity: number
  category: string
  notes?: string
  created_at: string
}
