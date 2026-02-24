import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addLibraryPrep,
  createLibraryPrepRun,
  deleteLibraryPrep,
  deleteLibraryPrepRun,
  getAllLibraryPreps,
  getLibraryPrepRun,
  getLibraryPrepRuns,
  updateLibraryPrep,
  updateLibraryPrepRun,
} from '../api/library_prep_runs'
import { LibraryPrepCreate, LibraryPrepRunCreate, LibraryPrepRunUpdate, LibraryPrepUpdate } from '../types'

export function useLibraryPrepRuns(params?: Parameters<typeof getLibraryPrepRuns>[0]) {
  return useQuery({ queryKey: ['library_prep_runs', params], queryFn: () => getLibraryPrepRuns(params), staleTime: 30_000 })
}

export function useLibraryPrepRun(id: number) {
  return useQuery({ queryKey: ['library_prep_runs', id], queryFn: () => getLibraryPrepRun(id), enabled: !!id })
}

export function useAllLibraryPreps() {
  return useQuery({ queryKey: ['all_library_preps'], queryFn: getAllLibraryPreps, staleTime: 60_000 })
}

export function useCreateLibraryPrepRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LibraryPrepRunCreate) => createLibraryPrepRun(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library_prep_runs'] }),
  })
}

export function useUpdateLibraryPrepRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LibraryPrepRunUpdate }) => updateLibraryPrepRun(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library_prep_runs'] }),
  })
}

export function useDeleteLibraryPrepRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteLibraryPrepRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library_prep_runs'] }),
  })
}

export function useAddLibraryPrep(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LibraryPrepCreate) => addLibraryPrep(runId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library_prep_runs', runId] })
      qc.invalidateQueries({ queryKey: ['all_library_preps'] })
    },
  })
}

export function useUpdateLibraryPrep(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sampleId, payload }: { sampleId: number; payload: LibraryPrepUpdate }) =>
      updateLibraryPrep(runId, sampleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library_prep_runs', runId] })
      qc.invalidateQueries({ queryKey: ['all_library_preps'] })
    },
  })
}

export function useDeleteLibraryPrep(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sampleId: number) => deleteLibraryPrep(runId, sampleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library_prep_runs', runId] })
      qc.invalidateQueries({ queryKey: ['all_library_preps'] })
    },
  })
}
