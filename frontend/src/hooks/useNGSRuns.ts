import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNGSRuns, getNGSRun, createNGSRun, updateNGSRun, deleteNGSRun } from '../api/ngs'
import { NGSRunCreate, NGSRunUpdate } from '../types'

export function useNGSRuns(params?: Parameters<typeof getNGSRuns>[0]) {
  return useQuery({ queryKey: ['ngs_runs', params], queryFn: () => getNGSRuns(params), staleTime: 30_000 })
}

export function useNGSRun(id: number) {
  return useQuery({ queryKey: ['ngs_runs', id], queryFn: () => getNGSRun(id), enabled: !!id })
}

export function useCreateNGSRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: NGSRunCreate) => createNGSRun(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs'] }),
  })
}

export function useUpdateNGSRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NGSRunUpdate }) => updateNGSRun(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs'] }),
  })
}

export function useDeleteNGSRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteNGSRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs'] }),
  })
}
