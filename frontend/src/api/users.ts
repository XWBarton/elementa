import client from './client'
import { User, PaginatedResponse } from '../types'

export async function getUsers(params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<User>> {
  const { data } = await client.get('/users/', { params })
  return data
}

export async function createUser(payload: {
  username: string
  password: string
  full_name?: string
  email?: string
  is_admin?: boolean
}): Promise<User> {
  const { data } = await client.post('/users/', payload)
  return data
}

export async function updateUser(id: number, payload: Partial<{ full_name: string; email: string; is_admin: boolean; is_active: boolean; password: string }>): Promise<User> {
  const { data } = await client.put(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id: number): Promise<User> {
  const { data } = await client.delete(`/users/${id}`)
  return data
}

export async function hardDeleteUser(id: number): Promise<void> {
  await client.delete(`/users/${id}/hard`)
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await client.post<User>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteAvatar(): Promise<User> {
  const { data } = await client.delete<User>('/users/me/avatar')
  return data
}

export async function getAvatarBlob(userId: number): Promise<string> {
  const response = await client.get(`/users/${userId}/avatar`, { responseType: 'blob' })
  return URL.createObjectURL(response.data)
}
