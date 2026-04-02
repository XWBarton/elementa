import {
  Button, Card, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined, LockOutlined, UnlockOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  useAddNGSLibrary,
  useBulkAddNGSLibraries,
  useDeleteNGSLibrary,
  useDeleteNGSRun,
  useLockNGSRun,
  useNGSRun,
  useUnlockNGSRun,
  useUpdateNGSLibrary,
} from '../hooks/useNGSRuns'
import { useAllLibraryPreps } from '../hooks/useLibraryPrepRuns'
import { LibraryPrep, NGSRunLibrary, NGSRunLibraryCreate, NGSRunLibraryUpdate } from '../types'
import { useAuth } from '../context/AuthContext'
import { QcStatusTag, QcStatusSelect } from '../components/QcStatusTag'
import { useTesseraUrl } from '../hooks/useTesseraUrl'
import RunAttachmentsPanel from '../components/RunAttachmentsPanel'

export default function NGSRunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const tesseraUrl = useTesseraUrl()
  const { data: run, isLoading } = useNGSRun(runId)
  const { data: allLibraryPreps } = useAllLibraryPreps()
  const addLibrary = useAddNGSLibrary(runId)
  const updateLibrary = useUpdateNGSLibrary(runId)
  const deleteLibrary = useDeleteNGSLibrary(runId)
  const bulkAdd = useBulkAddNGSLibraries(runId)
  const deleteRun = useDeleteNGSRun()
  const lockRun = useLockNGSRun()
  const unlockRun = useUnlockNGSRun()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editLib, setEditLib] = useState<NGSRunLibrary | null>(null)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  if (isLoading || !run) return <Typography.Text>Loading...</Typography.Text>

  const libPrepMap: Record<number, LibraryPrep> = {}
  allLibraryPreps?.forEach(lp => { libPrepMap[lp.id] = lp })

  const libPrepOptions = allLibraryPreps?.map(lp => {
    return { label: `${lp.specimen_code} — Lib Prep Run #${lp.run_id}`, value: lp.id }
  }) ?? []

  const onLibPrepChange = (form: ReturnType<typeof Form.useForm>[0]) => (libPrepId: number | undefined) => {
    if (libPrepId && libPrepMap[libPrepId]) {
      form.setFieldValue('specimen_code', libPrepMap[libPrepId].specimen_code)
      if (!form.getFieldValue('sample_name')) {
        form.setFieldValue('sample_name', libPrepMap[libPrepId].specimen_code)
      }
    }
  }

  const handleAddLibrary = async (values: NGSRunLibraryCreate) => {
    await addLibrary.mutateAsync(values)
    message.success('Library added')
    addForm.resetFields()
    setAddModalOpen(false)
  }

  const handleEditSave = async (values: NGSRunLibraryUpdate) => {
    if (!editLib) return
    await updateLibrary.mutateAsync({ libId: editLib.id, payload: values })
    message.success('Library updated')
    setEditLib(null)
  }

  const handleBulkPaste = async () => {
    const codes = bulkText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    if (!codes.length) { message.error('No codes entered'); return }
    await bulkAdd.mutateAsync(codes)
    message.success(`${codes.length} libraries added`)
    setBulkText('')
    setBulkModalOpen(false)
  }

  const handleExport = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/ngs-runs/${run.id}/export`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ngs-run-${run.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const PLATFORM_COLORS: Record<string, string> = { Illumina: 'blue', ONT: 'orange', PacBio: 'purple', Other: 'default' }

  const columns = [
    {
      title: 'Specimen Code', key: 'specimen',
      render: (_: unknown, r: NGSRunLibrary) => {
        const code = r.specimen_code ?? r.library_prep?.specimen_code
        if (!code) return '—'
        if (tesseraUrl) {
          return (
            <a href={`${tesseraUrl}/specimens/find?code=${code}`} target="_blank" rel="noopener noreferrer">
              <Tag color="blue">{code}</Tag>
            </a>
          )
        }
        return <Tag color="blue">{code}</Tag>
      },
    },
    {
      title: 'Sample Name', dataIndex: 'sample_name', key: 'sample_name',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'From Lib Prep', key: 'library_prep',
      render: (_: unknown, r: NGSRunLibrary) => {
        if (!r.library_prep_id) return '—'
        return (
          <Button type="link" size="small" style={{ padding: 0 }}
            onClick={() => navigate(`/library-prep-runs/${r.library_prep?.run_id}`)}>
            LP Run #{r.library_prep?.run_id}
          </Button>
        )
      },
    },
    {
      title: 'Reads (M)', dataIndex: 'reads_millions', key: 'reads_millions',
      render: (v: number) => v != null ? v.toFixed(2) : '—',
    },
    {
      title: 'QC', dataIndex: 'qc_status', key: 'qc_status',
      render: (v: string) => <QcStatusTag status={v} />,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: NGSRunLibrary) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} disabled={run.is_locked}
            onClick={() => { setEditLib(record); editForm.setFieldsValue(record) }} />
          <Popconfirm title="Delete this library?" onConfirm={() => deleteLibrary.mutateAsync(record.id).then(() => message.success('Deleted'))}>
            <Button type="link" danger icon={<DeleteOutlined />} disabled={run.is_locked} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LibraryForm = ({ form, loading, onFinish }: { form: any; loading: boolean; onFinish: (v: NGSRunLibraryCreate) => void }) => (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item label="Library Prep (link to DB record)" name="library_prep_id">
        <Select allowClear showSearch optionFilterProp="label" placeholder="Search by specimen code…"
          options={libPrepOptions} onChange={onLibPrepChange(form)} />
      </Form.Item>
      <Form.Item label="Specimen Code" name="specimen_code" extra="Auto-filled from library prep above">
        <Input placeholder="e.g. AMPH2024-042" />
      </Form.Item>
      <Form.Item label="Sample Name" name="sample_name">
        <Input placeholder="e.g. AMPH2024-042_S1" />
      </Form.Item>
      <Form.Item label="Reads (millions)" name="reads_millions">
        <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="QC Status" name="qc_status">
        <QcStatusSelect />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Typography.Title level={3} style={{ margin: 0 }}>NGS Run #{run.id}</Typography.Title>
          {run.is_locked && <Tag icon={<LockOutlined />} color="warning">Locked</Tag>}
        </Space>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
          <Button disabled={run.is_locked} onClick={() => navigate(`/ngs-runs/${runId}/edit`)}>Edit Run</Button>
          {(user?.is_admin || run.operator_id === user?.id) && (
            run.is_locked
              ? <Button icon={<UnlockOutlined />} onClick={() => unlockRun.mutateAsync(runId).then(() => message.success('Run unlocked'))} loading={unlockRun.isPending}>Unlock</Button>
              : <Button icon={<LockOutlined />} onClick={() => lockRun.mutateAsync(runId).then(() => message.success('Run locked'))} loading={lockRun.isPending}>Lock</Button>
          )}
          {user?.is_admin && (
            <Popconfirm title="Delete this run?" onConfirm={() => deleteRun.mutateAsync(runId).then(() => { message.success('Deleted'); navigate('/ngs-runs') })}>
              <Button danger disabled={run.is_locked}>Delete Run</Button>
            </Popconfirm>
          )}
        </Space>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Date">{run.date ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Operator">{run.operator?.username ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Project">
            {run.project ? <Tag color="blue">{run.project.code} — {run.project.name}</Tag> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Platform">
            <Tag color={PLATFORM_COLORS[run.platform]}>{run.platform}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Instrument">{run.instrument ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Run ID">{run.run_id ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Flow Cell">{run.flow_cell_id ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Reagent Kit">{run.reagent_kit ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Total Reads">{run.total_reads?.toLocaleString() ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Q30%">{run.q30_percent != null ? `${run.q30_percent}%` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Mean Read Length">{run.mean_read_length_bp ? `${run.mean_read_length_bp} bp` : '—'}</Descriptions.Item>
          <Descriptions.Item label="# Libraries"><Tag color="geekblue">{run.libraries?.length ?? 0}</Tag></Descriptions.Item>
          <Descriptions.Item label="Protocol">
            {run.protocol
              ? <Button type="link" icon={<FileTextOutlined />} style={{ padding: 0 }} onClick={() => navigate(`/protocols/${run.protocol!.id}`)}>{run.protocol.name}{run.protocol.version ? ` ${run.protocol.version}` : ''}</Button>
              : '—'}
          </Descriptions.Item>
          {(run.storage_host || run.output_path) && (
            <Descriptions.Item label="Data Location" span={2}>
              {run.storage_host && <><strong>Host:</strong> <code>{run.storage_host}</code>{run.output_path ? '  ' : ''}</>}
              {run.output_path && <><strong>Path:</strong> <code>{run.output_path}</code></>}
            </Descriptions.Item>
          )}
          {run.notes && <Descriptions.Item label="Notes" span={2}>{run.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card
        title="Libraries"
        extra={
          <Space>
            <Button icon={<UnorderedListOutlined />} disabled={run.is_locked} onClick={() => setBulkModalOpen(true)}>Bulk Add</Button>
            <Button type="primary" icon={<PlusOutlined />} disabled={run.is_locked} onClick={() => setAddModalOpen(true)}>Add Library</Button>
          </Space>
        }
      >
        <Table dataSource={run.libraries ?? []} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title="Add Library" open={addModalOpen} onCancel={() => { setAddModalOpen(false); addForm.resetFields() }} footer={null}>
        <LibraryForm form={addForm} loading={addLibrary.isPending} onFinish={handleAddLibrary} />
      </Modal>

      <Modal title="Edit Library" open={!!editLib} onCancel={() => setEditLib(null)} footer={null}>
        <LibraryForm form={editForm} loading={updateLibrary.isPending} onFinish={handleEditSave} />
      </Modal>

      <Modal
        title="Bulk Add Libraries"
        open={bulkModalOpen}
        onCancel={() => { setBulkModalOpen(false); setBulkText('') }}
        onOk={handleBulkPaste}
        okText="Add Libraries"
        confirmLoading={bulkAdd.isPending}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          Paste specimen codes (one per line or comma-separated). Each code will be linked to a library from the most recent library prep run for that specimen.
        </Typography.Paragraph>
        <Input.TextArea
          rows={10}
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
          placeholder="AMPH2024-001&#10;AMPH2024-002&#10;AMPH2024-003"
        />
      </Modal>

      <RunAttachmentsPanel runType="ngs" runId={run.id} />
    </div>
  )
}
