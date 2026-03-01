import { useQuery } from '@tanstack/react-query'
import client from '../api/client'

async function fetchTesseraUrl(): Promise<string> {
  const { data } = await client.get<{ tessera_url: string }>('/admin/public-settings')
  return data.tessera_url ?? ''
}

export function useTesseraUrl(): string | null {
  const { data } = useQuery({
    queryKey: ['tessera-public-url'],
    queryFn: fetchTesseraUrl,
    staleTime: 5 * 60 * 1000,
  })
  const url = data?.trim()
  return url && (url.startsWith('http://') || url.startsWith('https://'))
    ? url.replace(/\/$/, '')
    : null
}
