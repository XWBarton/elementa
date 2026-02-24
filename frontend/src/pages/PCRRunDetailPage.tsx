import {
  Button, Card, Descriptions, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAddPCRSample, useDeletePCRRun, useDeletePCRSample, usePCRRun, useUpdatePCRSample } from '../hooks/usePCRRuns'
import { useAllExtractions } from '../hooks/useExtractionRuns'
import { Extraction, PCRSample, PCRSampleCreate, PCRSampleUpdate } from '../types'
import { useAuth } from '../context/AuthContext'

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

  const extractionOptions = allExtractions?.map(e => ({
    label: `${e.specimen_code} (ID ${e.id})`,
    value: e.id,
  })) ?? []

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

  const columns = [
    {
      title: 'Specimen Code',
      key: 'specimen',
      render: (_: unknown, r: PCRSample) => {
        const code = r.specimen_code ?? r.extraction?.specimen_code
        return code ? <Tag color="blue">{code}</Tag> : <Tag>—</Tag>
      },
    },
    {
      title: 'Extraction',
      dataIndex: 'extraction_id',
      key: 'extraction_id',
      render: (v: number) => v ? `ID ${v}` : '—',
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
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PCRSample) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditSample(record); editForm.setFieldsValue(record) }} />
          <Popconfirm title="Delete this sample?" onConfirm={() => deleteSample.mutateAsync(record.id).then(() => message.success('Deleted'))}>
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
          <Button onClick={() => navigate(`/pcr-runs/${runId}/edit`)}>Edit Run</Button>
          {user?.is_admin && (
            <Popconfirm title="Delete this run?" onConfirm={() => deleteRun.mutateAsync(runId).then(() => { message.success('Deleted'); navigate('/pcr-runs') })}>
              <Button danger>Delete Run</Button>
            </Popconfirm>
          )}
        </Space>
      </Space>
      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Date">{run.run_date ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Operator">{run.operator?.username ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Target Region">{run.target_region ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Polymerase">{run.polymerase ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Primers">{[run.primer_f, run.primer_r].filter(Boolean).join(' / ') || '—'}</Descriptions.Item>
          <Descriptions.Item label="Annealing Temp">{run.annealing_temp_c ? `${run.annealing_temp_c}°C` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Cycles">{run.cycles ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Amplicon Size">{run.amplicon_size_bp ? `${run.amplicon_size_bp} bp` : '—'}</Descriptions.Item>
          <Descriptions.Item label="# Samples"><Tag color="blue">{run.sample_count}</Tag></Descriptions.Item>
          {run.notes && <Descriptions.Item label="Notes" span={2}>{run.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>
      <Card title="Samples" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>Add Sample</Button>}>
        <Table dataSource={run.samples ?? []} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title="Add Sample" open={addModalOpen} onCancel={() => { setAddModalOpen(false); addForm.resetFields() }} footer={null}>
        <Form form={addForm} layout="vertical" onFinish={handleAddSample}>
          <Form.Item label="Extraction (optional — link to DB record)" name="extraction_id">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Search by specimen code…"
              options={extractionOptions}
              onChange={onExtractionChange(addForm)}
            />
          </Form.Item>
          <Form.Item label="Specimen Code" name="specimen_code" extra="Auto-filled when extraction is selected; edit freely for pre-database specimens">
            <Input placeholder="e.g. AMPH2024-042" />
          </Form.Item>
          <Form.Item label="Gel Result" name="gel_result">
            <Select allowClear options={GEL_OPTIONS} />
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
        <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
          <Form.Item label="Extraction (optional)" name="extraction_id">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={extractionOptions}
              onChange={onExtractionChange(editForm)}
            />
          </Form.Item>
          <Form.Item label="Specimen Code" name="specimen_code">
            <Input placeholder="e.g. AMPH2024-042" />
          </Form.Item>
          <Form.Item label="Gel Result" name="gel_result">
            <Select allowClear options={GEL_OPTIONS} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateSample.isPending}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
