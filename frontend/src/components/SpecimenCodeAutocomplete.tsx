import { AutoComplete, Spin, Tag } from 'antd'
import { useState, useRef } from 'react'
import { searchTessera, TesseraSpecimen } from '../api/admin'

interface Props {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
}

export function SpecimenCodeAutocomplete({ value, onChange, placeholder = 'e.g. AMPH2024-042' }: Props) {
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = (text: string) => {
    if (timer.current) clearTimeout(timer.current)
    if (!text || text.length < 2) { setOptions([]); setLoading(false); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const results = await searchTessera(text)
        setOptions(results.map((r: TesseraSpecimen) => ({
          value: r.specimen_code,
          label: (
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <strong>{r.specimen_code}</strong>
                {r.primary_species && <span style={{ color: '#555' }}> — {r.primary_species}</span>}
                {r.project_code && <span style={{ color: '#aaa' }}> ({r.project_code})</span>}
              </span>
              <Tag color="geekblue" style={{ marginLeft: 8, fontSize: 11, lineHeight: '18px' }}>Tessera</Tag>
            </span>
          ),
        })))
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  return (
    <AutoComplete
      value={value}
      onChange={onChange}
      options={options}
      onSearch={handleSearch}
      filterOption={false}
      placeholder={placeholder}
      style={{ width: '100%' }}
      notFoundContent={loading ? <Spin size="small" style={{ padding: '4px 8px' }} /> : null}
    />
  )
}
