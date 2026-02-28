import client from './client'

export interface TesseraSettings {
  tessera_url: string
  tessera_token_set: boolean
}

export interface TesseraSpecimen {
  specimen_code: string
  primary_species: string
  project_code: string
  collection_date: string | null
}

export async function getSettings(): Promise<TesseraSettings> {
  const { data } = await client.get('/admin/settings/')
  return data
}

export async function saveSetting(key: string, value: string): Promise<void> {
  await client.put(`/admin/settings/${key}`, { value })
}

export async function testTessera(url?: string, token?: string): Promise<void> {
  await client.get('/admin/tessera/test', { params: { url, token } })
}

export async function searchTessera(q: string): Promise<TesseraSpecimen[]> {
  const { data } = await client.get('/admin/tessera/search', { params: { q } })
  return data
}
