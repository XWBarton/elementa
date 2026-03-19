import {
  Button, Card, Descriptions, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAddPCRSample, useDeletePCRRun, useDeletePCRSample, usePCRRun, useUpdatePCRSample } from '../hooks/usePCRRuns'
import { useAllExtractions } from '../hooks/useExtractionRuns'
import { Extraction, PCRSample, PCRSampleCreate, PCRSampleUpdate } from '../types'
import { useAuth } from '../context/AuthContext'
import { QcStatusTag, QcStatusSelect } from '../components/QcStatusTag'
import { useTesseraUrl } from '../hooks/useTesseraUrl'
import { SampleTypeTag, SampleTypeSelect } from '../components/SampleTypeTag'
import RunAttachmentsPanel from '../components/RunAttachmentsPanel'

const GEL_OPTIONS = [
  { label: 'Pass', value: 'pass' },
  { label: 'Fail', value: 'fail' },
  { label: 'Weak', value: 'weak' },
  { label: 'Multiple Bands', value: 'multiple_bands' },
]

export default function PCRRunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const tesseraUrl = useTesseraUrl()
  const { data: run, isLoading } = usePCRRun(runId)
  const { data: allExtractions } = useAllExtractions()
  const addSample = useAddPCRSample(runId)
  const updateSample = useUpdatePCRSample(runId)
  const deleteSample = useDeletePCRSample(runId)
  const deleteRun = useDeletePCRRun()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editSample, setEditSample] = useState<PCRSample | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  if (isLoading || !run) return <Typography.Text>Loading...</Typography.Text>

  const extractionMap: Record<number, Extraction> = {}
  allExtractions?.forEach(e => { extractionMap[e.id] = e })

  const extractionOptions = allExtractions?.map(e => {
    const runLabel = e.run_date ? e.run_date : `Run #${e.run_id}`
    const typeLabel = e.extraction_type ? ` · ${e.extraction_type}` : ''
    return { label: `${e.specimen_code} — Ext. Run #${e.run_id} (${runLabel}${typeLabel})`, value: e.id }
  }) ?? []

  const gelColor: Record<string, string> = { pass: 'green', fail: 'red', weak: 'orange', multiple_bands: 'purple' }

  const handleAddSample = async (values: PCRSampleCreate) => {
    await addSample.mutateAsync(values)
    message.success('Sample added')
    addForm.resetFields()
    setAddModalOpen(false)
  }

  const handleEditSave = async (values: PCRSampleUpdate) => {
    if (!editSample) return
    await updateSample.mutateAsync({ sampleId: editSample.id, payload: values })
    message.success('Sample updated')
    setEditSample(null)
  }

  const onExtractionChange = (form: ReturnType<typeof Form.useForm>[0]) => (extractionId: number | undefined) => {
    if (extractionId && extractionMap[extractionId]) {
      form.setFieldValue('specimen_code', extractionMap[extractionId].specimen_code)
    }
  }

  const handleExport = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/pcr-runs/${run.id}/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pcr-run-${run.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      title: 'Type',
      dataIndex: 'sample_type',
      key: 'sample_type',
      width: 140,
      render: (v: string) => <SampleTypeTag type={v} />,
    },
    {
      title: 'Sample Code',
      key: 'specimen',
      render: (_: unknown, r: PCRSample) => {
        const code = r.specimen_code ?? r.extraction?.specimen_code
        if (!code) return <Tag>—</Tag>
        if (tesseraUrl && !['NTC', 'EXB'].includes(code)) {
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
      title: 'From Extraction',
      key: 'extraction',
      render: (_: unknown, r: PCRSample) => {
        if (!r.extraction) return '—'
        return (
          <Button type="link" size="small" style={{ padding: 0 }}
            onClick={() => navigate(`/extraction-runs/${r.extraction!.run_id}`)}>
            Ext. Run #{r.extraction.run_id}
          </Button>
        )
      },
    },
    {
      title: 'Gel Result',
      dataIndex: 'gel_result',
      key: 'gel_result',
      render: (v: string) => v ? <Tag color={gelColor[v]}>{v}</Tag> : '—',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'QC',
      dataIndex: 'qc_status',
      key: 'qc_status',
      render: (v: string) => <QcStatusTag status={v} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PCRSample) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditSample(record); editForm.setFieldsValue(record) }} />
          <Popconfirm
            title="Delete this sample?"
            description={(() => {
              const code = record.specimen_code || record.extraction?.specimen_code
              return tesseraUrl && code && !['NTC', 'EXB'].includes(code)
                ? 'This will unlink the specimen from its Tessera usage record. The usage record itself will not be deleted.'
                : undefined
            })()}
            onConfirm={() => deleteSample.mutateAsync(record.id).then(() => message.success('Deleted'))}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>PCR Run #{run.id}</Typography.Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
          <Button onClick={() => navigate(`/pcr-runs/${runId}/edit`)}>Edit Run</Button>
          {user?.is_admin && (
            <Popconfirm
              title="Delete this run?"
              description={(() => {
                if (!tesseraUrl) return undefined
                const n = (run.samples ?? []).filter(s => {
                  const code = s.specimen_code || s.extraction?.specimen_code
                  return code && !['NTC', 'EXB'].includes(code)
                }).length
                return n > 0
                  ? `${n} specimen${n === 1 ? '' : 's'} will be unlinked from their Tessera usage records. The usage records themselves will not be deleted.`
                  : undefined
              })()}
              onConfirm={() => deleteRun.mutateAsync(runId).then(() => { message.success('Deleted'); navigate('/pcr-runs') })}
            >
              <Button danger>Delete Run</Button>
            </Popconfirm>
          )}
        </Space>
      </Space>
      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Date">{run.run_date ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Operator">{run.operator?.username ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Project">
            {run.project ? <Tag color="blue">{run.project.code} — {run.project.name}</Tag> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Target Region">{run.target_region ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Polymerase">{run.polymerase ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Primers">{[run.primer_f, run.primer_r].filter(Boolean).join(' / ') || '—'}</Descriptions.Item>
          <Descriptions.Item label="Annealing Temp">{run.annealing_temp_c ? `${run.annealing_temp_c}°C` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Cycles">{run.cycles ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Amplicon Size">{run.amplicon_size_bp ? `${run.amplicon_size_bp} bp` : '—'}</Descriptions.Item>
          <Descriptions.Item label="# Samples"><Tag color="blue">{run.sample_count}</Tag></Descriptions.Item>
          <Descriptions.Item label="Protocol">
            {run.protocol
              ? <Button type="link" icon={<FileTextOutlined />} style={{ padding: 0 }} onClick={() => navigate(`/protocols/${run.protocol!.id}`)}>{run.protocol.name}{run.protocol.version ? ` ${run.protocol.version}` : ''}</Button>
              : '—'}
          </Descriptions.Item>
          {run.notes && <Descriptions.Item label="Notes" span={2}>{run.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>
      <Card title="Samples" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>Add Sample</Button>}>
        <Table dataSource={run.samples ?? []} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title="Add Sample" open={addModalOpen} onCancel={() => { setAddModalOpen(false); addForm.resetFields() }} footer={null}>
        <Form form={addForm} layout="vertical" onFinish={handleAddSample} onValuesChange={(c) => { if (c.sample_type === 'ntc') addForm.setFieldValue('specimen_code', 'NTC'); if (c.sample_type === 'extraction_blank') addForm.setFieldValue('specimen_code', 'EXB') }}>
          <Form.Item label="Sample Type" name="sample_type">
            <SampleTypeSelect />
          </Form.Item>
          <Form.Item label="Extraction (link to DB record)" name="extraction_id">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Search by specimen code…"
              options={extractionOptions}
              onChange={onExtractionChange(addForm)}
            />
          </Form.Item>
          <Form.Item label="Sample Code" name="specimen_code" extra="Auto-filled from extraction above; edit freely for pre-database specimens">
            <Input placeholder="e.g. AMPH2024-042" />
          </Form.Item>
          <Form.Item label="Gel Result" name="gel_result">
            <Select allowClear options={GEL_OPTIONS} />
          </Form.Item>
          <Form.Item name="qc_status" label="QC Status">
            <QcStatusSelect />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={addSample.isPending}>Add</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Edit Sample" open={!!editSample} onCancel={() => setEditSample(null)} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEditSave} onValuesChange={(c) => { if (c.sample_type === 'ntc') editForm.setFieldValue('specimen_code', 'NTC'); if (c.sample_type === 'extraction_blank') editForm.setFieldValue('specimen_code', 'EXB') }}>
          <Form.Item label="Sample Type" name="sample_type">
            <SampleTypeSelect />
          </Form.Item>
          <Form.Item label="Extraction" name="extraction_id">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={extractionOptions}
              onChange={onExtractionChange(editForm)}
            />
          </Form.Item>
          <Form.Item label="Sample Code" name="specimen_code">
            <Input placeholder="e.g. AMPH2024-042" />
          </Form.Item>
          <Form.Item label="Gel Result" name="gel_result">
            <Select allowClear options={GEL_OPTIONS} />
          </Form.Item>
          <Form.Item name="qc_status" label="QC Status">
            <QcStatusSelect />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateSample.isPending}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>

      <RunAttachmentsPanel runType="pcr" runId={run.id} />
    </div>
  )
}
