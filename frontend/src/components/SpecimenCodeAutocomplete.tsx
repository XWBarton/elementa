import { AutoComplete } from 'antd'
import { useState, useRef } from 'react'
import { searchTessera, TesseraSpecimen } from '../api/admin'

interface Props {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
}

export function SpecimenCodeAutocomplete({ value, onChange, placeholder = 'e.g. AMPH2024-042' }: Props) {
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = (text: string) => {
    if (timer.current) clearTimeout(timer.current)
    if (!text || text.length < 2) { setOptions([]); return }
    timer.current = setTimeout(async () => {
      try {
        const results = await searchTessera(text)
        setOptions(results.map((r: TesseraSpecimen) => ({
          value: r.specimen_code,
          label: (
            <span>
              <strong>{r.specimen_code}</strong>
              {r.primary_species && <span style={{ color: '#555' }}> — {r.primary_species}</span>}
              {r.project_code && <span style={{ color: '#aaa' }}> ({r.project_code})</span>}
            </span>
          ),
        })))
      } catch {
        setOptions([])
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
    />
  )
}
