import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { ProjectWithSchematics } from '../types/database.types'

export function useProjects() {
  const { user } = useAuth()

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async (): Promise<ProjectWithSchematics[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select(`id, title, status, created_at, schematics(id, ai_confidence_score, processing_status)`)
        .eq('user_id', user!.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as ProjectWithSchematics[]
    },
    enabled: !!user,
  })

  return { projects: projects ?? [], isLoading, error }
}
