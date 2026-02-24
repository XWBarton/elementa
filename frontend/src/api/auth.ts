import client from './client'
import { User } from '../types'

export async function login(username: string, password: string): Promise<{ access_token: string }> {
  const form = new URLSearchParams({ username, password })
  const { data } = await client.post('/auth/login', form)
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await client.get('/auth/me')
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await client.post('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
}
