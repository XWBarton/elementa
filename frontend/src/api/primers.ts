import client from './client'
import type { Primer, PrimerCreate, PrimerUpdate, PrimerPairRecord, PrimerPairCreate, PrimerPairUpdate } from '../types'

// ── Primers ───────────────────────────────────────────────────────

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

export const bulkCreatePrimers = async (data: PrimerCreate[]): Promise<Primer[]> => {
  const { data: res } = await client.post<Primer[]>('/primers/bulk', data)
  return res
}

// ── Primer Pairs ──────────────────────────────────────────────────

export const getPrimerPairs = async (q?: string): Promise<PrimerPairRecord[]> => {
  const { data } = await client.get<PrimerPairRecord[]>('/primer-pairs/', { params: q ? { q } : {} })
  return data
}

export const createPrimerPair = async (data: PrimerPairCreate): Promise<PrimerPairRecord> => {
  const { data: res } = await client.post<PrimerPairRecord>('/primer-pairs/', data)
  return res
}

export const updatePrimerPair = async (id: number, data: PrimerPairUpdate): Promise<PrimerPairRecord> => {
  const { data: res } = await client.put<PrimerPairRecord>(`/primer-pairs/${id}`, data)
  return res
}

export const deletePrimerPair = async (id: number): Promise<void> => {
  await client.delete(`/primer-pairs/${id}`)
}
