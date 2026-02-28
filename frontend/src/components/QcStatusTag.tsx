import { Tag, Select } from 'antd'

const QC_OPTIONS = [
  { value: 'pass', label: 'Pass', color: 'success' },
  { value: 'fail', label: 'Fail', color: 'error' },
  { value: 'rerun', label: 'Rerun', color: 'warning' },
]

export function QcStatusTag({ status }: { status?: string | null }) {
  if (!status) return <span style={{ color: '#bbb' }}>—</span>
  const opt = QC_OPTIONS.find(o => o.value === status)
  return <Tag color={opt?.color ?? 'default'}>{opt?.label ?? status}</Tag>
}

export function QcStatusSelect({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <Select
      allowClear
      placeholder="Not set"
      value={value}
      onChange={onChange}
      options={QC_OPTIONS.map(o => ({ value: o.value, label: <Tag color={o.color}>{o.label}</Tag> }))}
      style={{ width: '100%' }}
    />
  )
}
