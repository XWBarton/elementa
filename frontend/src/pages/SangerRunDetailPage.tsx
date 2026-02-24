import {
  Button, Card, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAddSangerSample, useDeleteSangerRun, useDeleteSangerSample, useSangerRun, useUpdateSangerSample } from '../hooks/useSangerRuns'
import { useAllPCRSamples } from '../hooks/usePCRRuns'
import { PCRSample, SangerSample, SangerSampleCreate, SangerSampleUpdate } from '../types'
import { useAuth } from '../context/AuthContext'

export default function SangerRunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: run, isLoading } = useSangerRun(runId)
  const { data: allPCRSamples } = useAllPCRSamples()
  const addSample = useAddSangerSample(runId)
  const updateSample = useUpdateSangerSample(runId)
  const deleteSample = useDeleteSangerSample(runId)
  const deleteRun = useDeleteSangerRun()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editSample, setEditSample] = useState<SangerSample | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  if (isLoading || !run) return <Typography.Text>Loading...</Typography.Text>

  const pcrSampleMap: Record<number, PCRSample> = {}
  allPCRSamples?.forEach(s => { pcrSampleMap[s.id] = s })

  const pcrOptions = allPCRSamples?.map(s => {
    const code = s.specimen_code ?? s.extraction?.specimen_code
    return {
      label: code ? `${code} (PCR #${s.id})` : `PCR Sample #${s.id}`,
      value: s.id,
    }
  }) ?? []

  const onPCRSampleChange = (form: ReturnType<typeof Form.useForm>[0]) => (pcrSampleId: number | undefined) => {
    if (pcrSampleId && pcrSampleMap[pcrSampleId]) {
      const s = pcrSampleMap[pcrSampleId]
      form.setFieldValue('specimen_code', s.specimen_code ?? s.extraction?.specimen_code)
    }
  }

  const handleAddSample = async (values: SangerSampleCreate) => {
    await addSample.mutateAsync(values)
    message.success('Sample added')
    addForm.resetFields()
    setAddModalOpen(false)
  }

  const handleEditSave = async (values: SangerSampleUpdate) => {
    if (!editSample) return
    await updateSample.mutateAsync({ sampleId: editSample.id, payload: values })
    message.success('Sample updated')
    setEditSample(null)
  }

  const columns = [
    {
      title: 'Specimen Code',
      key: 'specimen',
      render: (_: unknown, r: SangerSample) => {
        const code = r.specimen_code ?? r.pcr_sample?.specimen_code ?? r.pcr_sample?.extraction?.specimen_code
        return code ? <Tag color="blue">{code}</Tag> : '—'
      },
    },
    {
      title: 'PCR Sample',
      key: 'pcr_sample',
      render: (_: unknown, r: SangerSample) =>
        r.pcr_sample_id ? <Tag>PCR #{r.pcr_sample_id}</Tag> : '—',
    },
    { title: 'Seq. Length (bp)', dataIndex: 'sequence_length_bp', key: 'sequence_length_bp', render: (v: number) => v ?? '—' },
    { title: 'Quality Notes', dataIndex: 'quality_notes', key: 'quality_notes', render: (v: string) => v ?? '—' },
    { title: 'Output File', dataIndex: 'output_file_path', key: 'output_file_path', render: (v: string) => v ?? '—' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SangerSample) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditSample(record); editForm.setFieldsValue(record) }} />
          <Popconfirm title="Delete?" onConfirm={() => deleteSample.mutateAsync(record.id).then(() => message.success('Deleted'))}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SampleForm = ({ form, loading, onFinish }: { form: any; loading: boolean; onFinish: (v: SangerSampleCreate) => void }) => (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item label="PCR Sample (optional — link to DB record)" name="pcr_sample_id">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Search by specimen code…"
          options={pcrOptions}
          onChange={onPCRSampleChange(form)}
        />
      </Form.Item>
      <Form.Item label="Specimen Code" name="specimen_code" extra="Auto-filled when PCR sample is selected; edit freely for pre-database specimens or positive controls">
        <Input placeholder="e.g. AMPH2024-042 or PCTRL-01" />
      </Form.Item>
      <Form.Item label="Sequence Length (bp)" name="sequence_length_bp">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="Quality Notes" name="quality_notes">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Output File Path" name="output_file_path">
        <Input placeholder="/path/to/sequence.ab1" />
      </Form.Item>
      <Form.Item label="Notes" name="notes">
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Sanger Run #{run.id}</Typography.Title>
        <Space>
          <Button onClick={() => navigate(`/sanger-runs/${runId}/edit`)}>Edit Run</Button>
          {user?.is_admin && (
            <Popconfirm title="Delete this run?" onConfirm={() => deleteRun.mutateAsync(runId).then(() => { message.success('Deleted'); navigate('/sanger-runs') })}>
              <Button danger>Delete Run</Button>
            </Popconfirm>
          )}
        </Space>
      </Space>
      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Date">{run.run_date ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Operator">{run.operator?.username ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Primer">{run.primer ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Direction">{run.direction ? <Tag>{run.direction}</Tag> : '—'}</Descriptions.Item>
          <Descriptions.Item label="Provider">{run.service_provider ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Order ID">{run.order_id ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="# Samples"><Tag color="purple">{run.sample_count}</Tag></Descriptions.Item>
          {run.notes && <Descriptions.Item label="Notes" span={2}>{run.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>
      <Card title="Samples" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>Add Sample</Button>}>
        <Table dataSource={run.samples ?? []} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title="Add Sample" open={addModalOpen} onCancel={() => { setAddModalOpen(false); addForm.resetFields() }} footer={null}>
        <SampleForm form={addForm} loading={addSample.isPending} onFinish={handleAddSample} />
      </Modal>
      <Modal title="Edit Sample" open={!!editSample} onCancel={() => setEditSample(null)} footer={null}>
        <SampleForm form={editForm} loading={updateSample.isPending} onFinish={handleEditSave} />
      </Modal>
    </div>
  )
}
