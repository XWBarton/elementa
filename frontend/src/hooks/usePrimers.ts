import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPrimers, createPrimer, updatePrimer, deletePrimer } from '../api/primers'
import type { PrimerCreate, PrimerUpdate } from '../types'

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
