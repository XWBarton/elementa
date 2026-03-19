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

    if (!obj['name']) {
      errors.push(`Row ${i + 1}: missing required "name" column`)
      continue
    }

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
          Paste tab-separated (TSV) or comma-separated (CSV) data with a header row. Required column: <Typography.Text code>name</Typography.Text>.
          Optional: <Typography.Text code>direction</Typography.Text>, <Typography.Text code>sequence</Typography.Text>, <Typography.Text code>target_gene</Typography.Text>, <Typography.Text code>target_taxa</Typography.Text>, <Typography.Text code>annealing_temp_c</Typography.Text>, <Typography.Text code>product_size_bp</Typography.Text>, <Typography.Text code>reference</Typography.Text>, <Typography.Text code>notes</Typography.Text>.
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
          <Form.Item name="direction" label="Direction" style={{ width: 160 }}>
            <Select options={DIRECTION_OPTIONS} allowClear placeholder="F / R" />
          </Form.Item>
        </Space.Compact>

        <Form.Item name="sequence" label="Sequence (5′→3′)">
          <Input
            placeholder="e.g. AGAGTTTGATCMTGGCTCAG"
            style={{ fontFamily: 'monospace', letterSpacing: 1 }}
          />
        </Form.Item>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="target_gene" label="Target Gene / Region" style={{ flex: 1, marginRight: 8 }}>
            <Input placeholder="e.g. 16S rRNA, COI, ITS1" />
          </Form.Item>
          <Form.Item name="target_taxa" label="Target Taxa" style={{ flex: 1 }}>
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
  const { data: primers, isLoading } = usePrimers(search || undefined)
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <strong style={{ fontFamily: 'monospace' }}>{v}</strong>,
      sorter: (a: Primer, b: Primer) => a.name.localeCompare(b.name),
    },
    {
      title: 'Dir',
      dataIndex: 'direction',
      key: 'direction',
      width: 60,
      render: (v: string) => v
        ? <Tag color={v === 'F' ? 'blue' : 'volcano'}>{v}</Tag>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Target Gene',
      dataIndex: 'target_gene',
      key: 'target_gene',
      render: (v: string) => v || <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Target Taxa',
      dataIndex: 'target_taxa',
      key: 'target_taxa',
      render: (v: string) => v
        ? v.split(',').map(t => <Tag key={t.trim()}>{t.trim()}</Tag>)
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Ta (°C)',
      dataIndex: 'annealing_temp_c',
      key: 'annealing_temp_c',
      width: 80,
      render: (v: number) => v != null ? `${v}°C` : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Product',
      dataIndex: 'product_size_bp',
      key: 'product_size_bp',
      width: 100,
      render: (v: number) => v != null ? `~${v} bp` : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: '',
      key: 'actions',
      width: user?.is_admin ? 80 : 40,
      render: (_: unknown, record: Primer) => (
        <Space>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0, whiteSpace: 'nowrap' }}>Primer Library</Typography.Title>
        <Input.Search
          placeholder="Search by name, gene or taxa…"
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
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
        size="small"
        expandable={{
          expandedRowRender: (record: Primer) => (
            <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {record.sequence && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Sequence:</Typography.Text>
                  <Typography.Text code style={{ fontSize: 13, letterSpacing: 1 }}>{record.sequence}</Typography.Text>
                  <Tooltip title="Copy sequence">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      type="text"
                      onClick={() => { navigator.clipboard.writeText(record.sequence!); message.success('Copied') }}
                    />
                  </Tooltip>
                </div>
              )}
              {record.reference && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Reference:</Typography.Text>
                  <Typography.Text style={{ fontSize: 12 }}>{record.reference}</Typography.Text>
                </div>
              )}
              {record.notes && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Notes:</Typography.Text>
                  <Typography.Text style={{ fontSize: 12 }}>{record.notes}</Typography.Text>
                </div>
              )}
              {!record.sequence && !record.reference && !record.notes && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>No additional details recorded.</Typography.Text>
              )}
            </div>
          ),
          rowExpandable: () => true,
        }}
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
          />
        )}
      </Modal>

      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  )
}
