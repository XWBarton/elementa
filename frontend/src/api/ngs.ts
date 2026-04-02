import client from './client'
import { NGSRun, NGSRunCreate, NGSRunUpdate, NGSRunLibrary, NGSRunLibraryCreate, NGSRunLibraryUpdate, PaginatedResponse } from '../types'

export async function getNGSRuns(params?: { skip?: number; limit?: number; platform?: string; date_from?: string; date_to?: string; project_id?: number; operator_id?: number }): Promise<PaginatedResponse<NGSRun>> {
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

export async function addNGSLibrary(runId: number, payload: NGSRunLibraryCreate): Promise<NGSRunLibrary> {
  const { data } = await client.post(`/ngs-runs/${runId}/libraries`, payload)
  return data
}

export async function updateNGSLibrary(runId: number, libId: number, payload: NGSRunLibraryUpdate): Promise<NGSRunLibrary> {
  const { data } = await client.put(`/ngs-runs/${runId}/libraries/${libId}`, payload)
  return data
}

export async function deleteNGSLibrary(runId: number, libId: number): Promise<void> {
  await client.delete(`/ngs-runs/${runId}/libraries/${libId}`)
}

export async function bulkAddNGSLibraries(runId: number, specimenCodes: string[]): Promise<NGSRunLibrary[]> {
  const { data } = await client.post(`/ngs-runs/${runId}/libraries/bulk`, { specimen_codes: specimenCodes })
  return data
}

export async function lockNGSRun(id: number): Promise<NGSRun> {
  const { data } = await client.post(`/ngs-runs/${id}/lock`)
  return data
}

export async function unlockNGSRun(id: number): Promise<NGSRun> {
  const { data } = await client.post(`/ngs-runs/${id}/unlock`)
  return data
}
