import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addProjectMember,
  createProject,
  deleteProject,
  getProjects,
  removeProjectMember,
  updateProject,
} from '../api/projects'
import type { ProjectCreate, ProjectUpdate } from '../types'

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: getProjects, staleTime: 60_000 })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProjectCreate) => createProject(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProjectUpdate) => updateProject(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useAddProjectMember(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => addProjectMember(projectId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useRemoveProjectMember(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => removeProjectMember(projectId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
