import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { ProjectWithSchematics } from '../types/database.types'

export function useProjects() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: projects, isLoading, error, refetch } = useQuery({
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

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      // Delete in dependency order (no guaranteed cascade on these tables).
      // 1. bom_items → via schematics
      const project = (projects ?? []).find(p => p.id === projectId)
      if (project) {
        const schematicIds = project.schematics.map(s => s.id)
        if (schematicIds.length > 0) {
          await supabase.from('bom_items').delete().in('schematic_id', schematicIds)
          await supabase.from('enclosure_recommendations').delete().in('schematic_id', schematicIds)
          await supabase.from('power_requirements').delete().in('schematic_id', schematicIds)
        }
        // 2. schematics
        await supabase.from('schematics').delete().eq('project_id', projectId)
      }
      // 3. project row
      const { error } = await supabase.from('projects').delete().eq('id', projectId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
    },
  })

  return {
    projects: projects ?? [],
    isLoading,
    error,
    refetch,
    deleteProject: deleteProjectMutation.mutate,
    isDeleting: deleteProjectMutation.isPending,
  }
}
