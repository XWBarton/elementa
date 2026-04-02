import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addSangerSample,
  bulkAddSangerSamples,
  createSangerRun,
  deleteSangerRun,
  deleteSangerSample,
  getSangerRun,
  getSangerRuns,
  lockSangerRun,
  unlockSangerRun,
  updateSangerRun,
  updateSangerSample,
} from '../api/sanger_runs'
import { SangerRunCreate, SangerRunUpdate, SangerSampleCreate, SangerSampleUpdate } from '../types'

export function useSangerRuns(params?: Parameters<typeof getSangerRuns>[0]) {
  return useQuery({ queryKey: ['sanger_runs', params], queryFn: () => getSangerRuns(params), staleTime: 30_000 })
}

export function useSangerRun(id: number) {
  return useQuery({ queryKey: ['sanger_runs', id], queryFn: () => getSangerRun(id), enabled: !!id })
}

export function useCreateSangerRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SangerRunCreate) => createSangerRun(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs'] }),
  })
}

export function useUpdateSangerRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SangerRunUpdate }) => updateSangerRun(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs'] }),
  })
}

export function useDeleteSangerRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSangerRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs'] }),
  })
}

export function useAddSangerSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SangerSampleCreate) => addSangerSample(runId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs', runId] }),
  })
}

export function useUpdateSangerSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sampleId, payload }: { sampleId: number; payload: SangerSampleUpdate }) =>
      updateSangerSample(runId, sampleId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs', runId] }),
  })
}

export function useDeleteSangerSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sampleId: number) => deleteSangerSample(runId, sampleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs', runId] }),
  })
}

export function useBulkAddSangerSamples(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (codes: string[]) => bulkAddSangerSamples(runId, codes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs', runId] }),
  })
}

export function useLockSangerRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: lockSangerRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs'] }),
  })
}

export function useUnlockSangerRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: unlockSangerRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanger_runs'] }),
  })
}
