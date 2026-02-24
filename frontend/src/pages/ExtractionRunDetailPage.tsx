import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  useAddExtractionSample,
  useAddExtractionSamplesBulk,
  useDeleteExtractionRun,
  useDeleteExtractionSample,
  useExtractionRun,
  useUpdateExtractionSample,
} from '../hooks/useExtractionRuns'
import { Extraction, ExtractionCreate, ExtractionUpdate } from '../types'
import { useAuth } from '../context/AuthContext'

export default function ExtractionRunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: run, isLoading } = useExtractionRun(runId)
  const addSample = useAddExtractionSample(runId)
  const addBulk = useAddExtractionSamplesBulk(runId)
  const updateSample = useUpdateExtractionSample(runId)
  const deleteSample = useDeleteExtractionSample(runId)
  const deleteRun = useDeleteExtractionRun()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editSample, setEditSample] = useState<Extraction | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [bulkText, setBulkText] = useState('')

  if (isLoading || !run) return <Typography.Text>Loading...</Typography.Text>

  const handleAddSingle = async (values: ExtractionCreate) => {
    await addSample.mutateAsync(values)
    message.success('Sample added')
    addForm.resetFields()
    setAddModalOpen(false)
  }

  const handleAddBulk = async () => {
    const codes = bulkText.split('\n').map(s => s.trim()).filter(Boolean)
    if (!codes.length) return message.error('Enter at least one specimen code')
    await addBulk.mutateAsync(codes)
    message.success(`${codes.length} samples added`)
    setBulkText('')
    setAddModalOpen(false)
  }

  const handleEditSave = async (values: ExtractionUpdate) => {
    if (!editSample) return
    await updateSample.mutateAsync({ sampleId: editSample.id, payload: values })
    message.success('Sample updated')
    setEditSample(null)
  }

  const handleDeleteSample = async (sampleId: number) => {
    await deleteSample.mutateAsync(sampleId)
    message.success('Sample deleted')
  }

  const handleDeleteRun = async () => {
    await deleteRun.mutateAsync(runId)
    message.success('Run deleted')
    navigate('/extraction-runs')
  }

  const sampleColumns = [
    { title: 'Specimen Code', dataIndex: 'specimen_code', key: 'specimen_code', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Yield (ng/µl)', dataIndex: 'yield_ng_ul', key: 'yield_ng_ul', render: (v: number) => v ?? '—' },
    { title: 'A260/280', dataIndex: 'a260_280', key: 'a260_280', render: (v: number) => v ?? '—' },
    { title: 'A260/230', dataIndex: 'a260_230', key: 'a260_230', render: (v: number) => v ?? '—' },
    { title: 'RIN', dataIndex: 'rin_score', key: 'rin_score', render: (v: number) => v ?? '—' },
    { title: 'Storage', dataIndex: 'storage_location', key: 'storage_location', render: (v: string) => v ?? '—' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Extraction) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditSample(record)
              editForm.setFieldsValue(record)
            }}
          />
          <Popconfirm title="Delete this sample?" onConfirm={() => handleDeleteSample(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Extraction Run #{run.id}
        </Typography.Title>
        <Space>
          <Button onClick={() => navigate(`/extraction-runs/${runId}/edit`)}>Edit Run</Button>
          {user?.is_admin && (
            <Popconfirm title="Delete this run and all its samples?" onConfirm={handleDeleteRun}>
              <Button danger>Delete Run</Button>
            </Popconfirm>
          )}
        </Space>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Date">{run.run_date ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Operator">{run.operator?.username ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Kit">{run.kit ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Type">{run.extraction_type ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Elution Volume">{run.elution_volume_ul ? `${run.elution_volume_ul} µl` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Samples"><Tag color="blue">{run.sample_count}</Tag></Descriptions.Item>
          {run.protocol_notes && <Descriptions.Item label="Protocol Notes" span={2}>{run.protocol_notes}</Descriptions.Item>}
          {run.notes && <Descriptions.Item label="Notes" span={2}>{run.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card
        title="Samples"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            Add Sample
          </Button>
        }
      >
        <Table
          dataSource={run.samples ?? []}
          columns={sampleColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Add Sample Modal */}
      <Modal
        title="Add Sample"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); addForm.resetFields(); setBulkText('') }}
        footer={null}
        width={500}
      >
        <Tabs
          items={[
            {
              key: 'single',
              label: 'Single',
              children: (
                <Form form={addForm} layout="vertical" onFinish={handleAddSingle}>
                  <Form.Item label="Specimen Code" name="specimen_code" rules={[{ required: true }]}>
                    <Input placeholder="e.g. AMPH2024-001" />
                  </Form.Item>
                  <Form.Item label="Input Quantity" name="input_quantity">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Unit" name="input_quantity_unit">
                    <Input placeholder="mg / µl / etc." />
                  </Form.Item>
                  <Form.Item label="Yield (ng/µl)" name="yield_ng_ul">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="A260/280" name="a260_280">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="A260/230" name="a260_230">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="RIN Score" name="rin_score">
                    <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Storage Location" name="storage_location">
                    <Input placeholder="Box / rack / position" />
                  </Form.Item>
                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={addSample.isPending}>Add Sample</Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'bulk',
              label: 'Bulk Paste',
              children: (
                <div>
                  <Typography.Text type="secondary">Paste specimen codes — one per line</Typography.Text>
                  <Input.TextArea
                    rows={8}
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={'AMPH2024-001\nAMPH2024-002\nAMPH2024-003'}
                    style={{ marginTop: 8, marginBottom: 16 }}
                  />
                  <Button type="primary" loading={addBulk.isPending} onClick={handleAddBulk}>
                    Add {bulkText.split('\n').filter(s => s.trim()).length} Samples
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Modal>

      {/* Edit Sample Modal */}
      <Modal
        title="Edit Sample"
        open={!!editSample}
        onCancel={() => setEditSample(null)}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
          <Form.Item label="Specimen Code" name="specimen_code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Input Quantity" name="input_quantity">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Unit" name="input_quantity_unit">
            <Input />
          </Form.Item>
          <Form.Item label="Yield (ng/µl)" name="yield_ng_ul">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="A260/280" name="a260_280">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="A260/230" name="a260_230">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="RIN Score" name="rin_score">
            <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Storage Location" name="storage_location">
            <Input />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateSample.isPending}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
