import client from './client'
import {
  SangerRun,
  SangerRunCreate,
  SangerRunUpdate,
  SangerSample,
  SangerSampleCreate,
  SangerSampleUpdate,
  PaginatedResponse,
} from '../types'

export async function getSangerRuns(params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<SangerRun>> {
  const { data } = await client.get('/sanger-runs/', { params })
  return data
}

export async function getSangerRun(id: number): Promise<SangerRun> {
  const { data } = await client.get(`/sanger-runs/${id}`)
  return data
}

export async function createSangerRun(payload: SangerRunCreate): Promise<SangerRun> {
  const { data } = await client.post('/sanger-runs/', payload)
  return data
}

export async function updateSangerRun(id: number, payload: SangerRunUpdate): Promise<SangerRun> {
  const { data } = await client.put(`/sanger-runs/${id}`, payload)
  return data
}

export async function deleteSangerRun(id: number): Promise<void> {
  await client.delete(`/sanger-runs/${id}`)
}

export async function addSangerSample(runId: number, payload: SangerSampleCreate): Promise<SangerSample> {
  const { data } = await client.post(`/sanger-runs/${runId}/samples`, payload)
  return data
}

export async function updateSangerSample(runId: number, sampleId: number, payload: SangerSampleUpdate): Promise<SangerSample> {
  const { data } = await client.put(`/sanger-runs/${runId}/samples/${sampleId}`, payload)
  return data
}

export async function deleteSangerSample(runId: number, sampleId: number): Promise<void> {
  await client.delete(`/sanger-runs/${runId}/samples/${sampleId}`)
}
