import client from './client'

export async function getSetupStatus(): Promise<{ needs_setup: boolean }> {
  const { data } = await client.get('/setup/status')
  return data
}

export async function completeSetup(payload: {
  full_name: string
  username: string
  email: string
  password: string
}): Promise<void> {
  await client.post('/setup/complete', payload)
}
