import client from './client'
import {
  PCRRun,
  PCRRunCreate,
  PCRRunUpdate,
  PCRSample,
  PCRSampleCreate,
  PCRSampleUpdate,
  PaginatedResponse,
} from '../types'

export async function getPCRRuns(params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<PCRRun>> {
  const { data } = await client.get('/pcr-runs/', { params })
  return data
}

export async function getPCRRun(id: number): Promise<PCRRun> {
  const { data } = await client.get(`/pcr-runs/${id}`)
  return data
}

export async function createPCRRun(payload: PCRRunCreate): Promise<PCRRun> {
  const { data } = await client.post('/pcr-runs/', payload)
  return data
}

export async function updatePCRRun(id: number, payload: PCRRunUpdate): Promise<PCRRun> {
  const { data } = await client.put(`/pcr-runs/${id}`, payload)
  return data
}

export async function deletePCRRun(id: number): Promise<void> {
  await client.delete(`/pcr-runs/${id}`)
}

export async function addPCRSample(runId: number, payload: PCRSampleCreate): Promise<PCRSample> {
  const { data } = await client.post(`/pcr-runs/${runId}/samples`, payload)
  return data
}

export async function updatePCRSample(runId: number, sampleId: number, payload: PCRSampleUpdate): Promise<PCRSample> {
  const { data } = await client.put(`/pcr-runs/${runId}/samples/${sampleId}`, payload)
  return data
}

export async function deletePCRSample(runId: number, sampleId: number): Promise<void> {
  await client.delete(`/pcr-runs/${runId}/samples/${sampleId}`)
}

export async function getAllPCRSamples(): Promise<PCRSample[]> {
  const { data } = await client.get('/pcr-runs/all-samples')
  return data
}
