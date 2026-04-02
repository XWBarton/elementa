import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addNGSLibrary,
  bulkAddNGSLibraries,
  createNGSRun,
  deleteNGSLibrary,
  deleteNGSRun,
  getNGSRun,
  getNGSRuns,
  lockNGSRun,
  unlockNGSRun,
  updateNGSLibrary,
  updateNGSRun,
} from '../api/ngs'
import { NGSRunCreate, NGSRunLibraryCreate, NGSRunLibraryUpdate, NGSRunUpdate } from '../types'

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

export function useAddNGSLibrary(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: NGSRunLibraryCreate) => addNGSLibrary(runId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs', runId] }),
  })
}

export function useUpdateNGSLibrary(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ libId, payload }: { libId: number; payload: NGSRunLibraryUpdate }) =>
      updateNGSLibrary(runId, libId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs', runId] }),
  })
}

export function useDeleteNGSLibrary(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (libId: number) => deleteNGSLibrary(runId, libId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs', runId] }),
  })
}

export function useBulkAddNGSLibraries(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (codes: string[]) => bulkAddNGSLibraries(runId, codes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs', runId] }),
  })
}

export function useLockNGSRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: lockNGSRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs'] }),
  })
}

export function useUnlockNGSRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: unlockNGSRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ngs_runs'] }),
  })
}
