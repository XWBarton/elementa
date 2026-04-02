import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addExtractionSample,
  addExtractionSamplesBulk,
  createExtractionRun,
  deleteExtractionRun,
  deleteExtractionSample,
  getAllExtractions,
  getExtractionRun,
  getExtractionRuns,
  lockExtractionRun,
  unlockExtractionRun,
  updateExtractionRun,
  updateExtractionSample,
} from '../api/extraction_runs'
import { ExtractionCreate, ExtractionRunCreate, ExtractionRunUpdate, ExtractionUpdate } from '../types'

export function useExtractionRuns(params?: Parameters<typeof getExtractionRuns>[0]) {
  return useQuery({ queryKey: ['extraction_runs', params], queryFn: () => getExtractionRuns(params), staleTime: 30_000 })
}

export function useExtractionRun(id: number) {
  return useQuery({
    queryKey: ['extraction_runs', id],
    queryFn: () => getExtractionRun(id),
    enabled: !!id,
    retry: (failureCount, error: any) => error?.response?.status === 404 ? false : failureCount < 3,
  })
}

export function useAllExtractions() {
  return useQuery({ queryKey: ['all_extractions'], queryFn: getAllExtractions, staleTime: 60_000 })
}

export function useCreateExtractionRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExtractionRunCreate) => createExtractionRun(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs'] }),
  })
}

export function useUpdateExtractionRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExtractionRunUpdate }) => updateExtractionRun(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs'] }),
  })
}

export function useDeleteExtractionRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteExtractionRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs'] }),
  })
}

export function useAddExtractionSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExtractionCreate) => addExtractionSample(runId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs', runId] }),
  })
}

export function useAddExtractionSamplesBulk(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (codes: string[]) => addExtractionSamplesBulk(runId, codes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs', runId] }),
  })
}

export function useUpdateExtractionSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sampleId, payload }: { sampleId: number; payload: ExtractionUpdate }) =>
      updateExtractionSample(runId, sampleId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs', runId] }),
  })
}

export function useDeleteExtractionSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sampleId: number) => deleteExtractionSample(runId, sampleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs', runId] }),
  })
}

export function useLockExtractionRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: lockExtractionRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs'] }),
  })
}

export function useUnlockExtractionRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: unlockExtractionRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extraction_runs'] }),
  })
}
