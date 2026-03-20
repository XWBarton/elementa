import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPrimers, createPrimer, updatePrimer, deletePrimer, bulkCreatePrimers,
  getPrimerPairs, createPrimerPair, updatePrimerPair, deletePrimerPair,
} from '../api/primers'
import type { PrimerCreate, PrimerUpdate, PrimerPairCreate, PrimerPairUpdate } from '../types'

// ── Primers ───────────────────────────────────────────────────────

export const usePrimers = (q?: string) =>
  useQuery({ queryKey: ['primers', q], queryFn: () => getPrimers(q) })

export const useCreatePrimer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PrimerCreate) => createPrimer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primers'] }),
  })
}

export const useUpdatePrimer = (id: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PrimerUpdate) => updatePrimer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primers'] }),
  })
}

export const useDeletePrimer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePrimer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primers'] }),
  })
}

export const useBulkCreatePrimers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PrimerCreate[]) => bulkCreatePrimers(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primers'] }),
  })
}

// ── Primer Pairs ──────────────────────────────────────────────────

export const usePrimerPairs = (q?: string) =>
  useQuery({ queryKey: ['primer-pairs', q], queryFn: () => getPrimerPairs(q) })

export const useCreatePrimerPair = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PrimerPairCreate) => createPrimerPair(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primer-pairs'] }),
  })
}

export const useUpdatePrimerPair = (id: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PrimerPairUpdate) => updatePrimerPair(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primer-pairs'] }),
  })
}

export const useDeletePrimerPair = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePrimerPair(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primer-pairs'] }),
  })
}
