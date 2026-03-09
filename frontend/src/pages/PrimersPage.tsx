import { useState } from 'react'
import {
  Typography, Table, Button, Modal, Form, Input, InputNumber,
  Space, message, Popconfirm, Tag, Select, Tooltip,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons'
import { usePrimers, useCreatePrimer, useUpdatePrimer, useDeletePrimer } from '../hooks/usePrimers'
import { useAuth } from '../context/AuthContext'
import type { Primer, PrimerCreate } from '../types'

const DIRECTION_OPTIONS = [
  { value: 'F', label: 'F — Forward' },
  { value: 'R', label: 'R — Reverse' },
]

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
      title: 'Product (bp)',
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Add Primer
        </Button>
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
    </div>
  )
}
