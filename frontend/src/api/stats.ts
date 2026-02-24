import client from './client'
import { Stats } from '../types'

export async function getStats(): Promise<Stats> {
  const { data } = await client.get('/stats')
  return data
}
