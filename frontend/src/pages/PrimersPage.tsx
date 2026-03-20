import { useState, useMemo } from 'react'
import {
  Typography, Table, Button, Modal, Form, Input, InputNumber,
  Space, message, Popconfirm, Tag, Select, Tooltip, Alert, Tabs,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, UnorderedListOutlined, DownloadOutlined } from '@ant-design/icons'
import {
  usePrimers, useCreatePrimer, useUpdatePrimer, useDeletePrimer, useBulkCreatePrimers,
  usePrimerPairs, useCreatePrimerPair, useUpdatePrimerPair, useDeletePrimerPair,
} from '../hooks/usePrimers'
import { useAuth } from '../context/AuthContext'
import type { Primer, PrimerCreate, PrimerPairRecord, PrimerPairCreate } from '../types'

const BASE_COLORS: Record<string, string> = {
  A: '#27ae60',
  T: '#e74c3c',
  C: '#2980b9',
  G: '#2c3e50',
  U: '#e74c3c',
}
const DEGENERATE_COLOR = '#8e44ad'

function NucleotideSeq({ seq, maxLen }: { seq: string; maxLen?: number }) {
  const display = maxLen && seq.length > maxLen ? seq.slice(0, maxLen) : seq
  const truncated = maxLen ? seq.length > maxLen : false
  return (
    <span style={{ fontFamily: 'monospace', letterSpacing: 1, fontSize: 11 }}>
      {display.toUpperCase().split('').map((base, i) => (
        <span key={i} style={{ color: BASE_COLORS[base] ?? DEGENERATE_COLOR, fontWeight: 600 }}>
          {base}
        </span>
      ))}
      {truncated && <span style={{ color: '#aaa' }}>…</span>}
    </span>
  )
}

const DIRECTION_OPTIONS = [
  { value: 'F', label: 'F — Forward' },
  { value: 'R', label: 'R — Reverse' },
]

const BULK_TEMPLATE = `name\tdirection\tsequence\ttarget_gene\ttarget_taxa\tannealing_temp_c\treference\tnotes
16S-F\tF\tAGAGTTTGATCMTGGCTCAG\t16S rRNA\tBacteria\t55\tLane 1991\t
16S-R\tR\tGGTTACCTTGTTACGACTT\t16S rRNA\tBacteria\t55\tLane 1991\t`

const COLUMN_HEADERS: Record<string, keyof PrimerCreate> = {
  name: 'name',
  direction: 'direction',
  sequence: 'sequence',
  target_gene: 'target_gene',
  target_taxa: 'target_taxa',
  annealing_temp_c: 'annealing_temp_c',
  reference: 'reference',
  notes: 'notes',
}

function parseBulkText(text: string): { rows: PrimerCreate[]; errors: string[] } {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return { rows: [], errors: ['Paste at least a header row and one data row.'] }

  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase())

  const errors: string[] = []
  const rows: PrimerCreate[] = []
  const seenNames = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter)
    const obj: Record<string, string | number | undefined> = {}

    headers.forEach((h, idx) => {
      const field = COLUMN_HEADERS[h]
      if (!field) return
      const val = cells[idx]?.trim()
      if (!val) return
      if (field === 'annealing_temp_c') {
        const n = parseFloat(val)
        obj[field] = isNaN(n) ? undefined : n
      } else {
        obj[field] = val
      }
    })

    const requiredFields = ['name', 'direction', 'sequence', 'target_gene', 'target_taxa'] as const
    const missing = requiredFields.filter(f => obj[f] == null || obj[f] === '')
    if (missing.length > 0) {
      errors.push(`Row ${i + 1}: missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`)
      continue
    }

    const name = obj['name'] as string
    if (seenNames.has(name)) {
      errors.push(`Row ${i + 1}: duplicate name "${name}" — each primer must have a unique name`)
      continue
    }
    seenNames.add(name)

    rows.push(obj as unknown as PrimerCreate)
  }

  return { rows, errors }
}

function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function BulkAddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const bulkCreate = useBulkCreatePrimers()

  const { rows, errors } = useMemo(() => parseBulkText(text), [text])

  const handleSubmit = async () => {
    if (!rows.length) return
    try {
      const created = await bulkCreate.mutateAsync(rows)
      message.success(`Added ${created.length} primer${created.length !== 1 ? 's' : ''}`)
      setText('')
      onClose()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Failed to add primers')
    }
  }

  const handleClose = () => {
    setText('')
    onClose()
  }

  const previewColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string) => <strong style={{ fontFamily: 'monospace' }}>{v}</strong> },
    { title: 'Dir', dataIndex: 'direction', key: 'direction', width: 50, render: (v: string) => v ? <Tag color={v === 'F' ? 'blue' : 'volcano'}>{v}</Tag> : null },
    { title: 'Sequence', dataIndex: 'sequence', key: 'sequence', render: (v: string) => v ? <NucleotideSeq seq={v} maxLen={24} /> : <span style={{ color: '#bbb' }}>—</span> },
    { title: 'Target Gene', dataIndex: 'target_gene', key: 'target_gene', render: (v: string) => v || <span style={{ color: '#bbb' }}>—</span> },
    { title: 'Target Taxa', dataIndex: 'target_taxa', key: 'target_taxa', render: (v: string) => v || <span style={{ color: '#bbb' }}>—</span> },
    { title: 'Ta (°C)', dataIndex: 'annealing_temp_c', key: 'annealing_temp_c', width: 70, render: (v: number) => v != null ? `${v}°C` : <span style={{ color: '#bbb' }}>—</span> },
  ]

  return (
    <Modal
      title="Bulk Add Primers"
      open={open}
      onCancel={handleClose}
      width={800}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={bulkCreate.isPending}
            disabled={rows.length === 0}
          >
            Add {rows.length > 0 ? `${rows.length} Primer${rows.length !== 1 ? 's' : ''}` : 'Primers'}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Paste tab-separated (TSV) or comma-separated (CSV) data with a header row. Required columns: <Typography.Text code>name</Typography.Text>, <Typography.Text code>direction</Typography.Text>, <Typography.Text code>sequence</Typography.Text>, <Typography.Text code>target_gene</Typography.Text>, <Typography.Text code>target_taxa</Typography.Text>.
          Optional: <Typography.Text code>annealing_temp_c</Typography.Text>, <Typography.Text code>reference</Typography.Text>, <Typography.Text code>notes</Typography.Text>.
        </Typography.Text>

        <div>
          <Space style={{ marginBottom: 4 }}>
            <Typography.Text style={{ fontSize: 12 }}>Paste data here:</Typography.Text>
            <Button
              size="small"
              type="link"
              style={{ padding: 0, fontSize: 12 }}
              onClick={() => setText(BULK_TEMPLATE)}
            >
              Load example
            </Button>
          </Space>
          <Input.TextArea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
            placeholder={'name\tdirection\tsequence\ttarget_gene\n16S-F\tF\tAGAGTTTGATCMTGGCTCAG\t16S rRNA'}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </div>

        {errors.length > 0 && (
          <Alert
            type="warning"
            message="Parsing issues"
            description={<ul style={{ margin: 0, paddingLeft: 16 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
            showIcon
          />
        )}

        {rows.length > 0 && (
          <div>
            <Typography.Text style={{ fontSize: 12 }} type="secondary">
              Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} ready to import:
            </Typography.Text>
            <Table
              dataSource={rows}
              columns={previewColumns}
              rowKey="name"
              size="small"
              pagination={false}
              style={{ marginTop: 6 }}
              scroll={{ y: 200 }}
            />
          </div>
        )}
      </Space>
    </Modal>
  )
}

function PrimerForm({
  onFinish,
  loading,
  initialValues,
}: {
  onFinish: (v: PrimerCreate) => void
  loading: boolean
  initialValues?: Partial<Primer>
}) {
  const [form] = Form.useForm()

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialValues}>
      <Space style={{ width: '100%' }} direction="vertical" size={0}>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="name" label="Primer Name" rules={[{ required: true }]} style={{ flex: 1, marginRight: 8 }}>
            <Input placeholder="e.g. 16S-F" />
          </Form.Item>
          <Form.Item name="direction" label="Direction" rules={[{ required: true }]} style={{ width: 160 }}>
            <Select options={DIRECTION_OPTIONS} placeholder="F / R" />
          </Form.Item>
        </Space.Compact>

        <Form.Item name="sequence" label="Sequence (5′→3′)" rules={[{ required: true }]}>
          <Input
            placeholder="e.g. AGAGTTTGATCMTGGCTCAG"
            style={{ fontFamily: 'monospace', letterSpacing: 1 }}
          />
        </Form.Item>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="target_gene" label="Target Gene / Region" rules={[{ required: true }]} style={{ flex: 1, marginRight: 8 }}>
            <Input placeholder="e.g. 16S rRNA, COI, ITS1" />
          </Form.Item>
          <Form.Item name="target_taxa" label="Target Taxa" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input placeholder="e.g. Bacteria, Amphibia" />
          </Form.Item>
        </Space.Compact>

        <Form.Item name="annealing_temp_c" label="Annealing Temp (°C)">
          <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} placeholder="e.g. 55" />
        </Form.Item>

        <Form.Item name="reference" label="Reference / Source">
          <Input placeholder="e.g. Lane 1991, DOI, or kit name" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
        </Form.Item>
      </Space>
    </Form>
  )
}

function PrimerPairForm({
  onFinish,
  loading,
  initialValues,
}: {
  onFinish: (v: PrimerPairCreate) => void
  loading: boolean
  initialValues?: Partial<PrimerPairRecord>
}) {
  const { data: allPrimers } = usePrimers()
  const [form] = Form.useForm()

  const fOptions = (allPrimers ?? [])
    .filter(p => p.direction === 'F' || !p.direction)
    .map(p => ({ label: `${p.name}${p.direction ? ` (${p.direction})` : ''}${p.target_gene ? ` — ${p.target_gene}` : ''}`, value: p.id }))
  const rOptions = (allPrimers ?? [])
    .filter(p => p.direction === 'R' || !p.direction)
    .map(p => ({ label: `${p.name}${p.direction ? ` (${p.direction})` : ''}${p.target_gene ? ` — ${p.target_gene}` : ''}`, value: p.id }))

  const formInitialValues = initialValues ? {
    name: initialValues.name,
    forward_primer_id: initialValues.forward_primer_id,
    reverse_primer_id: initialValues.reverse_primer_id,
    amplicon_size_bp: initialValues.amplicon_size_bp,
    annealing_temp_c: initialValues.annealing_temp_c,
    target_gene: initialValues.target_gene,
    target_taxa: initialValues.target_taxa,
    notes: initialValues.notes,
    reference: initialValues.reference,
  } : undefined

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={formInitialValues}>
      <Space style={{ width: '100%' }} direction="vertical" size={0}>
        <Form.Item name="name" label="Pair Name (optional)">
          <Input placeholder="e.g. 515F/806R, V3-V4" />
        </Form.Item>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="forward_primer_id" label="Forward Primer" style={{ flex: 1, marginRight: 8 }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select forward primer…"
              options={fOptions}
            />
          </Form.Item>
          <Form.Item name="reverse_primer_id" label="Reverse Primer" style={{ flex: 1 }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select reverse primer…"
              options={rOptions}
            />
          </Form.Item>
        </Space.Compact>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="amplicon_size_bp" label="Amplicon Size (bp)" style={{ flex: 1, marginRight: 8 }}>
            <InputNumber style={{ width: '100%' }} min={0} step={1} placeholder="e.g. 291" />
          </Form.Item>
          <Form.Item name="annealing_temp_c" label="Annealing Temp (°C)" style={{ flex: 1 }}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} placeholder="e.g. 55" />
          </Form.Item>
        </Space.Compact>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="target_gene" label="Target Gene / Region" style={{ flex: 1, marginRight: 8 }}>
            <Input placeholder="e.g. 16S rRNA V4" />
          </Form.Item>
          <Form.Item name="target_taxa" label="Target Taxa" style={{ flex: 1 }}>
            <Input placeholder="e.g. Bacteria" />
          </Form.Item>
        </Space.Compact>

        <Form.Item name="reference" label="Reference / Source">
          <Input placeholder="e.g. Caporaso 2011" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
        </Form.Item>
      </Space>
    </Form>
  )
}

function PrimersTab() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const { data: allPrimers, isLoading } = usePrimers()
  const createPrimer = useCreatePrimer()
  const deletePrimer = useDeletePrimer()
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingPrimer, setEditingPrimer] = useState<Primer | null>(null)
  const [viewingPrimer, setViewingPrimer] = useState<Primer | null>(null)
  const updatePrimer = useUpdatePrimer(editingPrimer?.id ?? 0)

  const primers = useMemo(() => {
    let list = allPrimers ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.target_gene?.toLowerCase().includes(q) ||
        p.target_taxa?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allPrimers, search])

  const handleCreate = async (values: PrimerCreate) => {
    try {
      await createPrimer.mutateAsync(values)
      message.success('Primer added')
      setCreateOpen(false)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Failed to add primer')
    }
  }

  const handleEdit = async (values: PrimerCreate) => {
    try {
      await updatePrimer.mutateAsync(values)
      message.success('Primer updated')
      setEditingPrimer(null)
    } catch {
      message.error('Failed to update primer')
    }
  }

  const columns = [
    {
      title: 'Name',
      key: 'name',
      width: 220,
      sorter: (a: Primer, b: Primer) => a.name.localeCompare(b.name),
      render: (_: unknown, r: Primer) => (
        <Space size={6}>
          <Typography.Link
            style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}
            onClick={() => setViewingPrimer(r)}
          >
            {r.name}
          </Typography.Link>
          {r.direction && (
            <Tag color={r.direction === 'F' ? 'blue' : 'volcano'} style={{ margin: 0, fontWeight: 600 }}>
              {r.direction}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Sequence (5′ → 3′)",
      key: 'sequence',
      render: (_: unknown, r: Primer) => r.sequence ? (
        <Space size={4}>
          <Tooltip title={<NucleotideSeq seq={r.sequence} />} color="#1a1a1a" overlayInnerStyle={{ padding: '6px 10px' }}>
            <span style={{ background: '#f5f5f5', borderRadius: 3, padding: '2px 6px', border: '1px solid #e8e8e8', cursor: 'default', display: 'inline-block' }}>
              <NucleotideSeq seq={r.sequence} maxLen={30} />
            </span>
          </Tooltip>
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            style={{ color: '#bbb', padding: '0 2px' }}
            onClick={() => { navigator.clipboard.writeText(r.sequence!); message.success('Copied') }}
          />
        </Space>
      ) : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Target Gene',
      key: 'target_gene',
      width: 110,
      render: (_: unknown, r: Primer) => r.target_gene
        ? <span style={{ fontWeight: 500 }}>{r.target_gene}</span>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Target Taxa',
      key: 'target_taxa',
      render: (_: unknown, r: Primer) => r.target_taxa
        ? <Space size={[4, 4]} wrap>{r.target_taxa.split(',').map(t => <Tag key={t.trim()} style={{ fontSize: 11 }}>{t.trim()}</Tag>)}</Space>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Ta (°C)',
      key: 'ta',
      width: 80,
      render: (_: unknown, r: Primer) => r.annealing_temp_c != null
        ? <span style={{ fontSize: 12 }}>{r.annealing_temp_c}°C</span>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: '',
      key: 'actions',
      width: user?.is_admin ? 72 : 36,
      render: (_: unknown, record: Primer) => (
        <Space size={4}>
          <Button icon={<EditOutlined />} size="small" onClick={() => setEditingPrimer(record)} />
          {user?.is_admin && (
            <Popconfirm
              title="Delete this primer?"
              onConfirm={() =>
                deletePrimer.mutateAsync(record.id)
                  .then(() => message.success('Deleted'))
                  .catch(() => message.error('Failed to delete'))
              }
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="Search by name, gene or taxa…"
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              const header = ['name', 'direction', 'sequence', 'target_gene', 'target_taxa', 'annealing_temp_c', 'reference', 'notes']
              const rows = primers.map(p => [p.name, p.direction ?? '', p.sequence ?? '', p.target_gene ?? '', p.target_taxa ?? '', p.annealing_temp_c ?? '', p.reference ?? '', p.notes ?? ''])
              downloadCsv('primers.csv', [header, ...rows])
            }}
          >
            Export CSV
          </Button>
          <Button icon={<UnorderedListOutlined />} onClick={() => setBulkOpen(true)}>
            Bulk Add
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Add Primer
          </Button>
        </Space>
      </div>

      <Table
        dataSource={primers}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="middle"
        pagination={{ pageSize: 25, showSizeChanger: false }}
        onRow={(record) => ({
          title: [record.reference && `Ref: ${record.reference}`, record.notes && `Notes: ${record.notes}`].filter(Boolean).join(' | ') || undefined,
        })}
      />

      <Modal title="Add Primer" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={520} destroyOnClose>
        <PrimerForm onFinish={handleCreate} loading={createPrimer.isPending} />
      </Modal>

      <Modal title={`Edit — ${editingPrimer?.name}`} open={!!editingPrimer} onCancel={() => setEditingPrimer(null)} footer={null} width={520} destroyOnClose>
        {editingPrimer && (
          <PrimerForm
            key={editingPrimer.id}
            onFinish={handleEdit}
            loading={updatePrimer.isPending}
            initialValues={editingPrimer}
          />
        )}
      </Modal>

      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} />

      <Modal
        open={!!viewingPrimer}
        onCancel={() => setViewingPrimer(null)}
        footer={
          <Space>
            <Button onClick={() => { setEditingPrimer(viewingPrimer); setViewingPrimer(null) }}>Edit</Button>
            <Button type="primary" onClick={() => setViewingPrimer(null)}>Close</Button>
          </Space>
        }
        width={520}
        title={
          viewingPrimer && (
            <Space size={8}>
              <span style={{ fontFamily: 'monospace', fontSize: 16 }}>{viewingPrimer.name}</span>
              {viewingPrimer.direction && (
                <Tag color={viewingPrimer.direction === 'F' ? 'blue' : 'volcano'} style={{ fontWeight: 600 }}>
                  {viewingPrimer.direction}
                </Tag>
              )}
            </Space>
          )
        }
      >
        {viewingPrimer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {viewingPrimer.sequence && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Sequence (5′ → 3′)</Typography.Text>
                <Space size={8} align="center">
                  <span style={{ background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: 4, padding: '4px 10px', display: 'inline-block' }}>
                    <NucleotideSeq seq={viewingPrimer.sequence} />
                  </span>
                  <Button
                    size="small" type="text" icon={<CopyOutlined />}
                    onClick={() => { navigator.clipboard.writeText(viewingPrimer.sequence!); message.success('Copied') }}
                  />
                </Space>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Target Gene</Typography.Text>
                <span>{viewingPrimer.target_gene || <Typography.Text type="secondary">—</Typography.Text>}</span>
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Target Taxa</Typography.Text>
                <span>{viewingPrimer.target_taxa
                  ? <Space size={4} wrap>{viewingPrimer.target_taxa.split(',').map(t => <Tag key={t.trim()}>{t.trim()}</Tag>)}</Space>
                  : <Typography.Text type="secondary">—</Typography.Text>}
                </span>
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Annealing Temp</Typography.Text>
                <span>{viewingPrimer.annealing_temp_c != null ? `${viewingPrimer.annealing_temp_c}°C` : <Typography.Text type="secondary">—</Typography.Text>}</span>
              </div>
            </div>
            {viewingPrimer.reference && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Reference</Typography.Text>
                <span>{viewingPrimer.reference}</span>
              </div>
            )}
            {viewingPrimer.notes && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Notes</Typography.Text>
                <Typography.Paragraph style={{ margin: 0, background: '#fafafa', padding: '8px 12px', borderRadius: 4, border: '1px solid #f0f0f0' }}>
                  {viewingPrimer.notes}
                </Typography.Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

function PrimerPairsTab() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const { data: allPairs, isLoading } = usePrimerPairs()
  const createPair = useCreatePrimerPair()
  const deletePair = useDeletePrimerPair()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingPair, setEditingPair] = useState<PrimerPairRecord | null>(null)
  const updatePair = useUpdatePrimerPair(editingPair?.id ?? 0)

  const pairs = useMemo(() => {
    let list = allPairs ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.target_gene?.toLowerCase().includes(q) ||
        p.target_taxa?.toLowerCase().includes(q) ||
        p.forward_primer?.name.toLowerCase().includes(q) ||
        p.reverse_primer?.name.toLowerCase().includes(q) ||
        p.reference?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allPairs, search])

  const handleCreate = async (values: PrimerPairCreate) => {
    try {
      await createPair.mutateAsync(values)
      message.success('Primer pair added')
      setCreateOpen(false)
    } catch {
      message.error('Failed to add primer pair')
    }
  }

  const handleEdit = async (values: PrimerPairCreate) => {
    try {
      await updatePair.mutateAsync(values)
      message.success('Primer pair updated')
      setEditingPair(null)
    } catch {
      message.error('Failed to update primer pair')
    }
  }

  const columns = [
    {
      title: 'Pair Name',
      key: 'name',
      width: 160,
      render: (_: unknown, r: PrimerPairRecord) => r.name
        ? <strong style={{ fontFamily: 'monospace' }}>{r.name}</strong>
        : <span style={{ color: '#bbb', fontSize: 12 }}>unnamed</span>,
    },
    {
      title: 'Forward Primer',
      key: 'forward',
      render: (_: unknown, r: PrimerPairRecord) => r.forward_primer ? (
        <Space size={6}>
          <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600, margin: 0 }}>{r.forward_primer.name}</Tag>
          {r.forward_primer.sequence && <NucleotideSeq seq={r.forward_primer.sequence} maxLen={18} />}
        </Space>
      ) : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Reverse Primer',
      key: 'reverse',
      render: (_: unknown, r: PrimerPairRecord) => r.reverse_primer ? (
        <Space size={6}>
          <Tag color="volcano" style={{ fontFamily: 'monospace', fontWeight: 600, margin: 0 }}>{r.reverse_primer.name}</Tag>
          {r.reverse_primer.sequence && <NucleotideSeq seq={r.reverse_primer.sequence} maxLen={18} />}
        </Space>
      ) : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Amplicon',
      key: 'amplicon',
      width: 90,
      render: (_: unknown, r: PrimerPairRecord) => r.amplicon_size_bp != null
        ? <span style={{ fontSize: 12 }}>~{r.amplicon_size_bp} bp</span>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Ta (°C)',
      key: 'ta',
      width: 75,
      render: (_: unknown, r: PrimerPairRecord) => r.annealing_temp_c != null
        ? <span style={{ fontSize: 12 }}>{r.annealing_temp_c}°C</span>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Target Gene',
      key: 'target_gene',
      width: 110,
      render: (_: unknown, r: PrimerPairRecord) => r.target_gene
        ? <span style={{ fontWeight: 500 }}>{r.target_gene}</span>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: '',
      key: 'actions',
      width: user?.is_admin ? 72 : 36,
      render: (_: unknown, record: PrimerPairRecord) => (
        <Space size={4}>
          <Button icon={<EditOutlined />} size="small" onClick={() => setEditingPair(record)} />
          {user?.is_admin && (
            <Popconfirm
              title="Delete this primer pair?"
              onConfirm={() =>
                deletePair.mutateAsync(record.id)
                  .then(() => message.success('Deleted'))
                  .catch(() => message.error('Failed to delete'))
              }
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="Search name, gene, taxa, primer, reference…"
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              const header = ['name', 'forward_primer', 'reverse_primer', 'amplicon_size_bp', 'annealing_temp_c', 'target_gene', 'target_taxa', 'reference', 'notes']
              const rows = pairs.map(p => [
                p.name ?? '',
                p.forward_primer?.name ?? '',
                p.reverse_primer?.name ?? '',
                p.amplicon_size_bp ?? '',
                p.annealing_temp_c ?? '',
                p.target_gene ?? '',
                p.target_taxa ?? '',
                p.reference ?? '',
                p.notes ?? '',
              ])
              downloadCsv('primer_pairs.csv', [header, ...rows])
            }}
          >
            Export CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Add Primer Pair
          </Button>
        </Space>
      </div>

      <Table
        dataSource={pairs}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="middle"
        pagination={{ pageSize: 25, showSizeChanger: false }}
        onRow={(record) => ({
          title: [record.reference && `Ref: ${record.reference}`, record.notes && `Notes: ${record.notes}`].filter(Boolean).join(' | ') || undefined,
        })}
      />

      <Modal title="Add Primer Pair" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={560} destroyOnClose>
        <PrimerPairForm onFinish={handleCreate} loading={createPair.isPending} />
      </Modal>

      <Modal title={`Edit — ${editingPair?.name ?? 'Primer Pair'}`} open={!!editingPair} onCancel={() => setEditingPair(null)} footer={null} width={560} destroyOnClose>
        {editingPair && (
          <PrimerPairForm
            key={editingPair.id}
            onFinish={handleEdit}
            loading={updatePair.isPending}
            initialValues={editingPair}
          />
        )}
      </Modal>
    </>
  )
}

export default function PrimersPage() {
  return (
    <div>
      <Typography.Title level={3} style={{ margin: '0 0 16px' }}>Primer Library</Typography.Title>
      <Tabs
        defaultActiveKey="primers"
        items={[
          { key: 'primers', label: 'Primers', children: <PrimersTab /> },
          { key: 'pairs', label: 'Primer Pairs', children: <PrimerPairsTab /> },
        ]}
      />
    </div>
  )
}
