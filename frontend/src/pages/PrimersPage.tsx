import { useState, useMemo } from 'react'
import {
  Typography, Table, Button, Modal, Form, Input, InputNumber,
  Space, message, Popconfirm, Tag, Select, Tooltip, Alert,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { usePrimers, useCreatePrimer, useUpdatePrimer, useDeletePrimer, useBulkCreatePrimers } from '../hooks/usePrimers'
import { useAuth } from '../context/AuthContext'
import type { Primer, PrimerCreate } from '../types'

const DIRECTION_OPTIONS = [
  { value: 'F', label: 'F — Forward' },
  { value: 'R', label: 'R — Reverse' },
]

const BULK_TEMPLATE = `name\tdirection\tsequence\ttarget_gene\ttarget_taxa\tannealing_temp_c\tproduct_size_bp\treference\tnotes
16S-F\tF\tAGAGTTTGATCMTGGCTCAG\t16S rRNA\tBacteria\t55\t1500\tLane 1991\t
16S-R\tR\tGGTTACCTTGTTACGACTT\t16S rRNA\tBacteria\t55\t1500\tLane 1991\t`

const COLUMN_HEADERS: Record<string, keyof PrimerCreate> = {
  name: 'name',
  direction: 'direction',
  sequence: 'sequence',
  target_gene: 'target_gene',
  target_taxa: 'target_taxa',
  annealing_temp_c: 'annealing_temp_c',
  product_size_bp: 'product_size_bp',
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
      } else if (field === 'product_size_bp') {
        const n = parseInt(val, 10)
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
    { title: 'Sequence', dataIndex: 'sequence', key: 'sequence', render: (v: string) => v ? <Typography.Text code style={{ fontSize: 11 }}>{v}</Typography.Text> : <span style={{ color: '#bbb' }}>—</span> },
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
          Optional: <Typography.Text code>annealing_temp_c</Typography.Text>, <Typography.Text code>product_size_bp</Typography.Text>, <Typography.Text code>reference</Typography.Text>, <Typography.Text code>notes</Typography.Text>.
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
  currentId,
}: {
  onFinish: (v: PrimerCreate) => void
  loading: boolean
  initialValues?: Partial<Primer>
  currentId?: number
}) {
  const { data: allPrimers } = usePrimers()
  const [form] = Form.useForm()

  const pairOptions = (allPrimers ?? [])
    .filter(p => p.id !== currentId)
    .map(p => ({ label: `${p.name}${p.direction ? ` (${p.direction})` : ''}`, value: p.id }))

  const formInitialValues = initialValues
    ? { ...initialValues, pair_ids: initialValues.pairs?.map(p => p.id) ?? [] }
    : undefined

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={formInitialValues}>
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

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="annealing_temp_c" label="Annealing Temp (°C)" style={{ flex: 1, marginRight: 8 }}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} placeholder="e.g. 55" />
          </Form.Item>
          <Form.Item name="product_size_bp" label="Product Size (bp)" style={{ flex: 1 }}>
            <InputNumber style={{ width: '100%' }} min={0} step={1} placeholder="e.g. 450" />
          </Form.Item>
        </Space.Compact>

        <Form.Item name="reference" label="Reference / Source">
          <Input placeholder="e.g. Lane 1991, DOI, or kit name" />
        </Form.Item>

        <Form.Item name="pair_ids" label="Pairs with">
          <Select
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Select compatible primers…"
            options={pairOptions}
          />
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

export default function PrimersPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [pairFilterId, setPairFilterId] = useState<number | null>(null)
  const { data: allPrimers, isLoading } = usePrimers()

  const primers = useMemo(() => {
    let list = allPrimers ?? []
    if (pairFilterId != null) {
      const anchor = list.find(p => p.id === pairFilterId)
      const pairIds = new Set(anchor?.pairs.map(p => p.id) ?? [])
      pairIds.add(pairFilterId)
      list = list.filter(p => pairIds.has(p.id))
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.target_gene?.toLowerCase().includes(q) ||
        p.target_taxa?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allPrimers, pairFilterId, search])
  const createPrimer = useCreatePrimer()
  const deletePrimer = useDeletePrimer()
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingPrimer, setEditingPrimer] = useState<Primer | null>(null)
  const updatePrimer = useUpdatePrimer(editingPrimer?.id ?? 0)

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
      title: 'Primer',
      key: 'name',
      sorter: (a: Primer, b: Primer) => a.name.localeCompare(b.name),
      render: (_: unknown, r: Primer) => (
        <div>
          <Space size={6} style={{ marginBottom: r.sequence ? 4 : 0 }}>
            <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.name}</strong>
            {r.direction && (
              <Tag color={r.direction === 'F' ? 'blue' : 'volcano'} style={{ margin: 0, fontWeight: 600 }}>
                {r.direction}
              </Tag>
            )}
          </Space>
          {r.sequence && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Typography.Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>5′—</Typography.Text>
              <Tooltip title={r.sequence}>
                <Typography.Text
                  code
                  style={{ fontSize: 11, letterSpacing: 0.5, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}
                >
                  {r.sequence}
                </Typography.Text>
              </Tooltip>
              <Typography.Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>—3′</Typography.Text>
              <Tooltip title="Copy sequence">
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  style={{ padding: '0 2px', height: 18, color: '#aaa' }}
                  onClick={() => { navigator.clipboard.writeText(r.sequence!); message.success('Copied') }}
                />
              </Tooltip>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Target',
      key: 'target',
      render: (_: unknown, r: Primer) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{r.target_gene || <span style={{ color: '#bbb' }}>—</span>}</div>
          {r.target_taxa && (
            <div style={{ marginTop: 3 }}>
              {r.target_taxa.split(',').map(t => (
                <Tag key={t.trim()} style={{ fontSize: 11, marginBottom: 2 }}>{t.trim()}</Tag>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Ta / Size',
      key: 'ta',
      width: 90,
      render: (_: unknown, r: Primer) => (
        <div style={{ fontSize: 12, lineHeight: '18px' }}>
          {r.annealing_temp_c != null
            ? <div style={{ fontWeight: 500 }}>{r.annealing_temp_c}°C</div>
            : <div style={{ color: '#bbb' }}>—</div>}
          {r.product_size_bp != null && (
            <div style={{ color: '#888' }}>~{r.product_size_bp} bp</div>
          )}
        </div>
      ),
    },
    {
      title: 'Pairs with',
      key: 'pairs',
      render: (_: unknown, r: Primer) => r.pairs?.length > 0 ? (
        <Space size={[4, 4]} wrap>
          {r.pairs.map(p => (
            <Tag
              key={p.id}
              color={p.direction === 'F' ? 'blue' : p.direction === 'R' ? 'volcano' : 'default'}
              style={{ fontSize: 11, cursor: 'pointer' }}
              onClick={() => setPairFilterId(p.id)}
            >
              {p.name}
            </Tag>
          ))}
        </Space>
      ) : <span style={{ color: '#bbb', fontSize: 12 }}>—</span>,
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={3} style={{ margin: 0, whiteSpace: 'nowrap' }}>Primer Library</Typography.Title>
        <Input.Search
          placeholder="Search by name, gene or taxa…"
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Show pairs for…"
          style={{ width: 220, borderColor: pairFilterId != null ? '#1677ff' : undefined }}
          value={pairFilterId}
          onChange={v => setPairFilterId(v ?? null)}
          options={(allPrimers ?? [])
            .filter(p => p.pairs.length > 0)
            .map(p => ({ label: `${p.name}${p.direction ? ` (${p.direction})` : ''}`, value: p.id }))}
        />
        <Space>
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

      <Modal
        title="Add Primer"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <PrimerForm onFinish={handleCreate} loading={createPrimer.isPending} />
      </Modal>

      <Modal
        title={`Edit — ${editingPrimer?.name}`}
        open={!!editingPrimer}
        onCancel={() => setEditingPrimer(null)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {editingPrimer && (
          <PrimerForm
            key={editingPrimer.id}
            onFinish={handleEdit}
            loading={updatePrimer.isPending}
            initialValues={editingPrimer}
            currentId={editingPrimer.id}
          />
        )}
      </Modal>

      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  )
}
