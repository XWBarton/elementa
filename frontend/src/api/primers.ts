import client from './client'
import type { Primer, PrimerCreate, PrimerUpdate } from '../types'

export const getPrimers = async (q?: string): Promise<Primer[]> => {
  const { data } = await client.get<Primer[]>('/primers/', { params: q ? { q } : {} })
  return data
}

export const createPrimer = async (data: PrimerCreate): Promise<Primer> => {
  const { data: res } = await client.post<Primer>('/primers/', data)
  return res
}

export const updatePrimer = async (id: number, data: PrimerUpdate): Promise<Primer> => {
  const { data: res } = await client.put<Primer>(`/primers/${id}`, data)
  return res
}

export const deletePrimer = async (id: number): Promise<void> => {
  await client.delete(`/primers/${id}`)
}
