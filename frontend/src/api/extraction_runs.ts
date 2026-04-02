import client from './client'
import {
  Extraction,
  ExtractionCreate,
  ExtractionRun,
  ExtractionRunCreate,
  ExtractionRunUpdate,
  ExtractionUpdate,
  PaginatedResponse,
} from '../types'

export async function getExtractionRuns(params?: { skip?: number; limit?: number; project_id?: number; operator_id?: number }): Promise<PaginatedResponse<ExtractionRun>> {
  const { data } = await client.get('/extraction-runs/', { params })
  return data
}

export async function getExtractionRun(id: number): Promise<ExtractionRun> {
  const { data } = await client.get(`/extraction-runs/${id}`)
  return data
}

export async function createExtractionRun(payload: ExtractionRunCreate): Promise<ExtractionRun> {
  const { data } = await client.post('/extraction-runs/', payload)
  return data
}

export async function updateExtractionRun(id: number, payload: ExtractionRunUpdate): Promise<ExtractionRun> {
  const { data } = await client.put(`/extraction-runs/${id}`, payload)
  return data
}

export async function deleteExtractionRun(id: number): Promise<void> {
  await client.delete(`/extraction-runs/${id}`)
}

export async function addExtractionSample(runId: number, payload: ExtractionCreate): Promise<Extraction> {
  const { data } = await client.post(`/extraction-runs/${runId}/samples`, payload)
  return data
}

export async function addExtractionSamplesBulk(runId: number, specimenCodes: string[]): Promise<Extraction[]> {
  const { data } = await client.post(`/extraction-runs/${runId}/samples/bulk`, { specimen_codes: specimenCodes })
  return data
}

export async function updateExtractionSample(runId: number, sampleId: number, payload: ExtractionUpdate): Promise<Extraction> {
  const { data } = await client.put(`/extraction-runs/${runId}/samples/${sampleId}`, payload)
  return data
}

export async function deleteExtractionSample(runId: number, sampleId: number): Promise<void> {
  await client.delete(`/extraction-runs/${runId}/samples/${sampleId}`)
}

export async function getAllExtractions(): Promise<Extraction[]> {
  const { data } = await client.get('/extraction-runs/all-extractions')
  return data
}

export async function lockExtractionRun(id: number): Promise<ExtractionRun> {
  const { data } = await client.post(`/extraction-runs/${id}/lock`)
  return data
}

export async function unlockExtractionRun(id: number): Promise<ExtractionRun> {
  const { data } = await client.post(`/extraction-runs/${id}/unlock`)
  return data
}
