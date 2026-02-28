import client from './client'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filenameFromHeaders(headers: any, fallback: string): string {
  const disposition: string = headers['content-disposition'] ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  return match ? match[1] : fallback
}

export async function exportExtractions() {
  const { data, headers } = await client.get('/export/extractions', { responseType: 'blob' })
  downloadBlob(data, filenameFromHeaders(headers, 'extractions.csv'))
}

export async function exportPCRSamples() {
  const { data, headers } = await client.get('/export/pcr-samples', { responseType: 'blob' })
  downloadBlob(data, filenameFromHeaders(headers, 'pcr_samples.csv'))
}

export async function exportSangerSamples() {
  const { data, headers } = await client.get('/export/sanger-samples', { responseType: 'blob' })
  downloadBlob(data, filenameFromHeaders(headers, 'sanger_samples.csv'))
}

export async function exportLibraryPreps() {
  const { data, headers } = await client.get('/export/library-preps', { responseType: 'blob' })
  downloadBlob(data, filenameFromHeaders(headers, 'library_preps.csv'))
}

export async function exportNGSLibraries() {
  const { data, headers } = await client.get('/export/ngs-libraries', { responseType: 'blob' })
  downloadBlob(data, filenameFromHeaders(headers, 'ngs_libraries.csv'))
}

export async function downloadBackup() {
  const { data, headers } = await client.get('/export/backup', { responseType: 'blob' })
  downloadBlob(data, filenameFromHeaders(headers, 'elementa_backup.db'))
}

export async function restoreBackup(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await client.post('/export/restore', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
