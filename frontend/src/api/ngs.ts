import client from './client'
import { NGSRun, NGSRunCreate, NGSRunUpdate, PaginatedResponse } from '../types'

export async function getNGSRuns(params?: { skip?: number; limit?: number; platform?: string; date_from?: string; date_to?: string }): Promise<PaginatedResponse<NGSRun>> {
  const { data } = await client.get('/ngs-runs/', { params })
  return data
}

export async function getNGSRun(id: number): Promise<NGSRun> {
  const { data } = await client.get(`/ngs-runs/${id}`)
  return data
}

export async function createNGSRun(payload: NGSRunCreate): Promise<NGSRun> {
  const { data } = await client.post('/ngs-runs/', payload)
  return data
}

export async function updateNGSRun(id: number, payload: NGSRunUpdate): Promise<NGSRun> {
  const { data } = await client.put(`/ngs-runs/${id}`, payload)
  return data
}

export async function deleteNGSRun(id: number): Promise<void> {
  await client.delete(`/ngs-runs/${id}`)
}
