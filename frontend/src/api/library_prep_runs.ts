import client from './client'
import {
  LibraryPrep,
  LibraryPrepCreate,
  LibraryPrepRun,
  LibraryPrepRunCreate,
  LibraryPrepRunUpdate,
  LibraryPrepUpdate,
  PaginatedResponse,
} from '../types'

export async function getLibraryPrepRuns(params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<LibraryPrepRun>> {
  const { data } = await client.get('/library-prep-runs/', { params })
  return data
}

export async function getLibraryPrepRun(id: number): Promise<LibraryPrepRun> {
  const { data } = await client.get(`/library-prep-runs/${id}`)
  return data
}

export async function createLibraryPrepRun(payload: LibraryPrepRunCreate): Promise<LibraryPrepRun> {
  const { data } = await client.post('/library-prep-runs/', payload)
  return data
}

export async function updateLibraryPrepRun(id: number, payload: LibraryPrepRunUpdate): Promise<LibraryPrepRun> {
  const { data } = await client.put(`/library-prep-runs/${id}`, payload)
  return data
}

export async function deleteLibraryPrepRun(id: number): Promise<void> {
  await client.delete(`/library-prep-runs/${id}`)
}

export async function addLibraryPrep(runId: number, payload: LibraryPrepCreate): Promise<LibraryPrep> {
  const { data } = await client.post(`/library-prep-runs/${runId}/samples`, payload)
  return data
}

export async function updateLibraryPrep(runId: number, sampleId: number, payload: LibraryPrepUpdate): Promise<LibraryPrep> {
  const { data } = await client.put(`/library-prep-runs/${runId}/samples/${sampleId}`, payload)
  return data
}

export async function deleteLibraryPrep(runId: number, sampleId: number): Promise<void> {
  await client.delete(`/library-prep-runs/${runId}/samples/${sampleId}`)
}

export async function getAllLibraryPreps(): Promise<LibraryPrep[]> {
  const { data } = await client.get('/library-prep-runs/all-preps')
  return data
}
