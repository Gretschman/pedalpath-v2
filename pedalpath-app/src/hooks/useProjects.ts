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
      // Show any project that has at least one schematic. This handles the case
      // where the project status update to 'in_progress' fails silently but the
      // schematic upload and AI analysis succeeded — the project should still
      // appear in the dashboard rather than being hidden as a 'draft'.
      const all = (data ?? []) as unknown as ProjectWithSchematics[]
      return all.filter(p => p.schematics.length > 0)
    },
    enabled: !!user,
  })

  return { projects: projects ?? [], isLoading, error }
}
