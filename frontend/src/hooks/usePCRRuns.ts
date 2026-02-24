import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addPCRSample,
  createPCRRun,
  deletePCRRun,
  deletePCRSample,
  getAllPCRSamples,
  getPCRRun,
  getPCRRuns,
  updatePCRRun,
  updatePCRSample,
} from '../api/pcr_runs'
import { PCRRunCreate, PCRRunUpdate, PCRSampleCreate, PCRSampleUpdate } from '../types'

export function usePCRRuns(params?: Parameters<typeof getPCRRuns>[0]) {
  return useQuery({ queryKey: ['pcr_runs', params], queryFn: () => getPCRRuns(params), staleTime: 30_000 })
}

export function usePCRRun(id: number) {
  return useQuery({ queryKey: ['pcr_runs', id], queryFn: () => getPCRRun(id), enabled: !!id })
}

export function useAllPCRSamples() {
  return useQuery({ queryKey: ['all_pcr_samples'], queryFn: getAllPCRSamples, staleTime: 60_000 })
}

export function useCreatePCRRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PCRRunCreate) => createPCRRun(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pcr_runs'] }),
  })
}

export function useUpdatePCRRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PCRRunUpdate }) => updatePCRRun(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pcr_runs'] }),
  })
}

export function useDeletePCRRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePCRRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pcr_runs'] }),
  })
}

export function useAddPCRSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PCRSampleCreate) => addPCRSample(runId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pcr_runs', runId] }),
  })
}

export function useUpdatePCRSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sampleId, payload }: { sampleId: number; payload: PCRSampleUpdate }) =>
      updatePCRSample(runId, sampleId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pcr_runs', runId] }),
  })
}

export function useDeletePCRSample(runId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sampleId: number) => deletePCRSample(runId, sampleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pcr_runs', runId] }),
  })
}
