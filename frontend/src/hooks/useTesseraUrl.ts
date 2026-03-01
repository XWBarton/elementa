import { useQuery } from '@tanstack/react-query'
import { getSettings } from '../api/admin'

export function useTesseraUrl(): string | null {
  const { data } = useQuery({
    queryKey: ['tessera-settings'],
    queryFn: getSettings,
    staleTime: 5 * 60 * 1000,
  })
  const url = data?.tessera_url?.trim()
  return url && (url.startsWith('http://') || url.startsWith('https://'))
    ? url.replace(/\/$/, '')
    : null
}
