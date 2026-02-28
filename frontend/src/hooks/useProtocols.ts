import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProtocols,
  getAllProtocols,
  getProtocol,
  createProtocol,
  updateProtocol,
  deleteProtocol,
} from '../api/protocols'
import type { ProtocolCreate, ProtocolUpdate } from '../types'

export function useProtocols(skip = 0, limit = 100) {
  return useQuery({
    queryKey: ['protocols', skip, limit],
    queryFn: () => getProtocols({ skip, limit }),
  })
}

export function useAllProtocols() {
  return useQuery({
    queryKey: ['protocols', 'all'],
    queryFn: getAllProtocols,
  })
}

export function useProtocol(id: number) {
  return useQuery({
    queryKey: ['protocols', id],
    queryFn: () => getProtocol(id),
    enabled: !!id,
    retry: 1,
  })
}

export function useCreateProtocol() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProtocolCreate) => createProtocol(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocols'] }),
  })
}

export function useUpdateProtocol(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProtocolUpdate) => updateProtocol(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocols'] }),
  })
}

export function useDeleteProtocol() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProtocol(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocols'] }),
  })
}
