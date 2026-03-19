import {
  Alert,
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
  Tooltip,
  Typography,
  message,
  notification,
} from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import ContainerView, { nextPosition } from '../components/ContainerView'
import { QcStatusTag, QcStatusSelect } from '../components/QcStatusTag'
import { SpecimenCodeAutocomplete } from '../components/SpecimenCodeAutocomplete'
import { useTesseraUrl } from '../hooks/useTesseraUrl'
import { SampleTypeTag, SampleTypeSelect } from '../components/SampleTypeTag'
import RunAttachmentsPanel from '../components/RunAttachmentsPanel'

export default function ExtractionRunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const specimenParam = searchParams.get('specimen')
  const { user } = useAuth()

  const tesseraUrl = useTesseraUrl()
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

  if (isLoading) return <Typography.Text>Loading...</Typography.Text>
  if (!run) return (
    <div>
      <Typography.Text type="secondary">Extraction run not found.</Typography.Text>
      <br />
      <Button type="link" style={{ paddingLeft: 0 }} onClick={() => navigate('/extraction-runs/new')}>
        Create a new extraction run
      </Button>
    </div>
  )

  const samples = run.samples ?? []
  const containerType = run.container_type

  const handleAddSingle = async (values: ExtractionCreate) => {
    await addSample.mutateAsync(values)
    message.success('Sample added')
    addForm.resetFields()
    setAddModalOpen(false)
    const code = values.specimen_code
    if (code && !['NTC', 'EXB'].includes(code) && tesseraUrl) {
      const params = new URLSearchParams({ code, elementa_ref: String(runId), run_type: 'extraction' })
      notification.info({
        message: `Log usage of ${code} in Tessera`,
        description: 'Record how much tissue was taken from this specimen for this extraction.',
        btn: <Button type="primary" size="small" onClick={() => window.open(`${tesseraUrl}/specimens/find?${params}`, '_blank')}>Open Tessera ↗</Button>,
        duration: 15,
      })
    }
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

  const handleExport = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/extraction-runs/${run.id}/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extraction-run-${run.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openAdd = () => {
    if (containerType) {
      const suggested = nextPosition(containerType, samples)
      if (suggested) addForm.setFieldValue('position', suggested)
    }
    setAddModalOpen(true)
  }

  // Sort samples by position when a container type is set
  const sortedSamples = containerType
    ? [...samples].sort((a, b) => {
        if (!a.position && !b.position) return 0
        if (!a.position) return 1
        if (!b.position) return -1
        return a.position.localeCompare(b.position, undefined, { numeric: true, sensitivity: 'base' })
      })
    : samples

  const positionField = (
    <Form.Item label="Position" name="position" extra={
      containerType ? `e.g. ${containerType.includes('plate') ? 'A1, B3, H12' : '1, 2, 12'}` : undefined
    }>
      <Input placeholder={containerType ? (containerType.includes('plate') ? 'A1' : '1') : 'e.g. A1 or 12'} style={{ width: 120 }} />
    </Form.Item>
  )

  const sampleColumns = [
    ...(containerType ? [{
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '—',
    }] : []),
    { title: 'Type', dataIndex: 'sample_type', key: 'sample_type', width: 140, render: (v: string) => <SampleTypeTag type={v} /> },
    {
      title: 'Sample Code', dataIndex: 'specimen_code', key: 'specimen_code',
      render: (v: string) => {
        if (tesseraUrl && v && !['NTC', 'EXB'].includes(v)) {
          return (
            <a href={`${tesseraUrl}/specimens/find?code=${v}`} target="_blank" rel="noopener noreferrer">
              <Tag color="blue">{v}</Tag>
            </a>
          )
        }
        return <Tag color="blue">{v}</Tag>
      },
    },
    { title: 'Yield (ng/µl)', dataIndex: 'yield_ng_ul', key: 'yield_ng_ul', render: (v: number) => v ?? '—' },
    { title: 'A260/280', dataIndex: 'a260_280', key: 'a260_280', render: (v: number) => v ?? '—' },
    { title: 'A260/230', dataIndex: 'a260_230', key: 'a260_230', render: (v: number) => v ?? '—' },
    { title: 'RIN', dataIndex: 'rin_score', key: 'rin_score', render: (v: number) => v ?? '—' },
    { title: 'Storage', dataIndex: 'storage_location', key: 'storage_location', render: (v: string) => v ?? '—' },
    { title: 'QC', dataIndex: 'qc_status', key: 'qc_status', render: (v: string) => <QcStatusTag status={v} /> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Extraction) => (
        <Space>
          {tesseraUrl && record.specimen_code && !['NTC', 'EXB'].includes(record.specimen_code) && (
            <Tooltip title="Log specimen usage in Tessera">
              <Button
                type="link"
                icon={<LinkOutlined />}
                onClick={() => {
                  const params = new URLSearchParams({ code: record.specimen_code, elementa_ref: String(runId), run_type: 'extraction' })
                  window.open(`${tesseraUrl}/specimens/find?${params}`, '_blank')
                }}
              />
            </Tooltip>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditSample(record)
              editForm.setFieldsValue(record)
            }}
          />
          <Popconfirm
            title="Delete this sample?"
            description={tesseraUrl && record.specimen_code && !['NTC', 'EXB'].includes(record.specimen_code)
              ? 'This will unlink the specimen from its Tessera usage record. The usage record itself will not be deleted.'
              : undefined}
            onConfirm={() => handleDeleteSample(record.id)}
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
        <Typography.Title level={3} style={{ margin: 0 }}>
          Extraction Run #{run.id}
        </Typography.Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
          <Button onClick={() => navigate(`/extraction-runs/${runId}/edit`)}>Edit Run</Button>
          {user?.is_admin && (
            <Popconfirm
              title="Delete this run and all its samples?"
              description={(() => {
                if (!tesseraUrl) return undefined
                const n = (run.samples ?? []).filter(s => s.specimen_code && !['NTC', 'EXB'].includes(s.specimen_code)).length
                return n > 0
                  ? `${n} specimen${n === 1 ? '' : 's'} will be unlinked from their Tessera usage records. The usage records themselves will not be deleted.`
                  : undefined
              })()}
              onConfirm={handleDeleteRun}
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
          <Descriptions.Item label="Kit">{run.kit ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Type">{run.extraction_type ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Container">{run.container_type ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Elution Volume">{run.elution_volume_ul ? `${run.elution_volume_ul} µl` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Samples"><Tag color="blue">{run.sample_count}</Tag></Descriptions.Item>
          <Descriptions.Item label="Protocol">
            {run.protocol
              ? <Button type="link" icon={<FileTextOutlined />} style={{ padding: 0 }} onClick={() => navigate(`/protocols/${run.protocol!.id}`)}>{run.protocol.name}{run.protocol.version ? ` ${run.protocol.version}` : ''}</Button>
              : '—'}
          </Descriptions.Item>
          {run.protocol_notes && <Descriptions.Item label="Protocol Notes" span={2}>{run.protocol_notes}</Descriptions.Item>}
          {run.notes && <Descriptions.Item label="Notes" span={2}>{run.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>

      {specimenParam && (
        <Alert
          message={`Linked from Tessera — specimen ${specimenParam}`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Container visualisation */}
      {containerType && (
        <Card title={containerType === 'tubes' ? 'Tube Layout' : containerType === '96-well plate' ? '96-Well Plate Layout' : '384-Well Plate Layout'} style={{ marginBottom: 16 }}>
          <ContainerView
            containerType={containerType}
            samples={samples}
            highlightCode={specimenParam ?? undefined}
            onWellClick={(sample) => {
              if (sample) {
                setEditSample(sample)
                editForm.setFieldsValue(sample)
              } else {
                openAdd()
              }
            }}
          />
        </Card>
      )}

      <Card
        title="Samples"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Add Sample
          </Button>
        }
      >
        <Table
          dataSource={sortedSamples}
          columns={sampleColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20 }}
          onRow={(record) => ({
            style: record.specimen_code === specimenParam ? { background: '#e6f7ff' } : {},
          })}
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
                <Form form={addForm} layout="vertical" onFinish={handleAddSingle} onValuesChange={(c) => { if (c.sample_type === 'ntc') addForm.setFieldValue('specimen_code', 'NTC'); if (c.sample_type === 'extraction_blank') addForm.setFieldValue('specimen_code', 'EXB') }}>
                  <Form.Item label="Sample Type" name="sample_type">
                    <SampleTypeSelect />
                  </Form.Item>
                  <Form.Item label="Sample Code" name="specimen_code" rules={[{ required: true }]}>
                    <SpecimenCodeAutocomplete placeholder="e.g. AMPH2024-001 or POS-CTRL-1" />
                  </Form.Item>
                  {positionField}
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
                  <Form.Item name="qc_status" label="QC Status">
                    <QcStatusSelect />
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
                  <Typography.Text type="secondary">Paste specimen codes — one per line. Positions will be auto-assigned in order.</Typography.Text>
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
        <Form form={editForm} layout="vertical" onFinish={handleEditSave} onValuesChange={(c) => { if (c.sample_type === 'ntc') editForm.setFieldValue('specimen_code', 'NTC'); if (c.sample_type === 'extraction_blank') editForm.setFieldValue('specimen_code', 'EXB') }}>
          <Form.Item label="Sample Type" name="sample_type">
            <SampleTypeSelect />
          </Form.Item>
          <Form.Item label="Sample Code" name="specimen_code" rules={[{ required: true }]}>
            <SpecimenCodeAutocomplete />
          </Form.Item>
          {positionField}
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
          <Form.Item name="qc_status" label="QC Status">
            <QcStatusSelect />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateSample.isPending}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>

      <RunAttachmentsPanel runType="extraction" runId={run.id} />
    </div>
  )
}
