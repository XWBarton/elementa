import client from './client'
import type { Protocol, ProtocolCreate, ProtocolUpdate, PaginatedResponse } from '../types'

export async function getProtocols(params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<Protocol>> {
  const { data } = await client.get('/protocols/', { params })
  return data
}

export async function getAllProtocols(): Promise<Protocol[]> {
  const { data } = await client.get('/protocols/all')
  return data
}

export async function getProtocol(id: number): Promise<Protocol> {
  const { data } = await client.get(`/protocols/${id}`)
  return data
}

export async function createProtocol(payload: ProtocolCreate): Promise<Protocol> {
  const { data } = await client.post('/protocols/', payload)
  return data
}

export async function updateProtocol(id: number, payload: ProtocolUpdate): Promise<Protocol> {
  const { data } = await client.put(`/protocols/${id}`, payload)
  return data
}

export async function deleteProtocol(id: number): Promise<void> {
  await client.delete(`/protocols/${id}`)
}

export async function downloadProtocolPdf(id: number): Promise<void> {
  const response = await client.get(`/protocols/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
