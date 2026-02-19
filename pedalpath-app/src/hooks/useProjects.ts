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
        .order('created_at', { ascending: false })
      if (error) throw error
      // Only show projects that have at least one schematic (upload actually started)
      const visible = (data ?? []).filter(
        (p: any) => (p.schematics as any[]).length > 0
      )
      return visible as unknown as ProjectWithSchematics[]
    },
    enabled: !!user,
  })

  return { projects: projects ?? [], isLoading, error }
}
