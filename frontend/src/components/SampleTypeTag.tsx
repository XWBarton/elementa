import { Tag, Select } from 'antd'

export const SAMPLE_TYPE_OPTIONS = [
  { value: 'specimen', label: 'Sample', color: 'blue' },
  { value: 'positive_control', label: 'Positive Control', color: 'green' },
  { value: 'extraction_blank', label: 'Extraction Blank', color: 'orange' },
  { value: 'ntc', label: 'NTC', color: 'magenta' },
]

export function SampleTypeTag({ type }: { type?: string | null }) {
  if (!type || type === 'specimen') return <Tag color="blue">Sample</Tag>
  const opt = SAMPLE_TYPE_OPTIONS.find(o => o.value === type)
  return <Tag color={opt?.color ?? 'default'}>{opt?.label ?? type}</Tag>
}

export function SampleTypeSelect({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <Select
      allowClear
      placeholder="Sample (default)"
      value={value}
      onChange={onChange}
      options={SAMPLE_TYPE_OPTIONS.map(o => ({
        value: o.value,
        label: <Tag color={o.color}>{o.label}</Tag>,
      }))}
      style={{ width: '100%' }}
    />
  )
}
