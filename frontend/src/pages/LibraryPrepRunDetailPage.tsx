import {
  Button, Card, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  useAddLibraryPrep,
  useDeleteLibraryPrep,
  useDeleteLibraryPrepRun,
  useLibraryPrepRun,
  useUpdateLibraryPrep,
} from '../hooks/useLibraryPrepRuns'
import { useAllExtractions } from '../hooks/useExtractionRuns'
import { useAllPCRSamples } from '../hooks/usePCRRuns'
import { Extraction, LibraryPrep, LibraryPrepCreate, LibraryPrepUpdate, PCRSample } from '../types'
import { useAuth } from '../context/AuthContext'
import { QcStatusTag, QcStatusSelect } from '../components/QcStatusTag'
import { useTesseraUrl } from '../hooks/useTesseraUrl'
import { SampleTypeTag, SampleTypeSelect } from '../components/SampleTypeTag'
import RunAttachmentsPanel from '../components/RunAttachmentsPanel'

export default function LibraryPrepRunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const tesseraUrl = useTesseraUrl()
  const { data: run, isLoading } = useLibraryPrepRun(runId)
  const { data: allExtractions } = useAllExtractions()
  const { data: allPCRSamples } = useAllPCRSamples()
  const addPrep = useAddLibraryPrep(runId)
  const updatePrep = useUpdateLibraryPrep(runId)
  const deletePrep = useDeleteLibraryPrep(runId)
  const deleteRun = useDeleteLibraryPrepRun()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editSample, setEditSample] = useState<LibraryPrep | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  if (isLoading || !run) return <Typography.Text>Loading...</Typography.Text>

  const extractionMap: Record<number, Extraction> = {}
  allExtractions?.forEach(e => { extractionMap[e.id] = e })

  const pcrSampleMap: Record<number, PCRSample> = {}
  allPCRSamples?.forEach(s => { pcrSampleMap[s.id] = s })

  const extractionOptions = allExtractions?.map(e => {
    const runLabel = e.run_date ? e.run_date : `Run #${e.run_id}`
    const typeLabel = e.extraction_type ? ` · ${e.extraction_type}` : ''
    return { label: `${e.specimen_code} — Ext. Run #${e.run_id} (${runLabel}${typeLabel})`, value: e.id }
  }) ?? []

  const pcrOptions = allPCRSamples?.map(s => {
    const code = s.specimen_code
    const runLabel = s.run_date ? s.run_date : `Run #${s.run_id}`
    const regionLabel = s.target_region ? ` · ${s.target_region}` : ''
    return {
      label: code ? `${code} — PCR Run #${s.run_id} (${runLabel}${regionLabel})` : `PCR Sample #${s.id}`,
      value: s.id,
    }
  }) ?? []

  const handleAddPrep = async (values: LibraryPrepCreate) => {
    await addPrep.mutateAsync(values)
    message.success('Library prep added')
    addForm.resetFields()
    setAddModalOpen(false)
  }

  const handleEditSave = async (values: LibraryPrepUpdate) => {
    if (!editSample) return
    await updatePrep.mutateAsync({ sampleId: editSample.id, payload: values })
    message.success('Updated')
    setEditSample(null)
  }

  const onExtractionChange = (form: ReturnType<typeof Form.useForm>[0]) => (extractionId: number | undefined) => {
    if (extractionId && extractionMap[extractionId]) {
      form.setFieldValue('specimen_code', extractionMap[extractionId].specimen_code)
      form.setFieldValue('pcr_sample_id', undefined)
    }
  }

  const onPCRSampleChange = (form: ReturnType<typeof Form.useForm>[0]) => (pcrSampleId: number | undefined) => {
    if (pcrSampleId && pcrSampleMap[pcrSampleId]) {
      form.setFieldValue('specimen_code', pcrSampleMap[pcrSampleId].specimen_code)
      form.setFieldValue('extraction_id', undefined)
    }
  }

  const handleExport = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/library-prep-runs/${run.id}/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `library-prep-run-${run.id}.csv`
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
      render: (_: unknown, r: LibraryPrep) => {
        const code = r.specimen_code ?? r.extraction?.specimen_code ?? r.pcr_sample?.specimen_code
        if (!code) return '—'
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
      title: 'From',
      key: 'source',
      render: (_: unknown, r: LibraryPrep) => {
        if (r.extraction) {
          return (
            <Button type="link" size="small" style={{ padding: 0 }}
              onClick={() => navigate(`/extraction-runs/${r.extraction!.run_id}`)}>
              Ext. Run #{r.extraction.run_id}
            </Button>
          )
        }
        if (r.pcr_sample) {
          return (
            <Button type="link" size="small" style={{ padding: 0 }}
              onClick={() => navigate(`/pcr-runs/${r.pcr_sample!.run_id}`)}>
              PCR Run #{r.pcr_sample.run_id}
            </Button>
          )
        }
        return '—'
      },
    },
    { title: 'Sample Name', dataIndex: 'sample_name', key: 'sample_name', render: (v: string) => v ?? '—' },
    { title: 'Index i7', dataIndex: 'index_i7', key: 'index_i7', render: (v: string) => v ?? '—' },
    { title: 'Index i5', dataIndex: 'index_i5', key: 'index_i5', render: (v: string) => v ?? '—' },
    { title: 'Input (ng)', dataIndex: 'input_ng', key: 'input_ng', render: (v: number) => v ?? '—' },
    { title: 'Conc. (ng/µl)', dataIndex: 'library_concentration_ng_ul', key: 'library_concentration_ng_ul', render: (v: number) => v ?? '—' },
    { title: 'Avg Size (bp)', dataIndex: 'average_fragment_size_bp', key: 'average_fragment_size_bp', render: (v: number) => v ?? '—' },
    { title: 'QC', dataIndex: 'qc_status', key: 'qc_status', render: (v: string) => <QcStatusTag status={v} /> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: LibraryPrep) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditSample(record); editForm.setFieldsValue(record) }} />
          <Popconfirm
            title="Delete?"
            onConfirm={() => deletePrep.mutateAsync(record.id).then(() => message.success('Deleted'))}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PrepForm = ({ form, loading, onFinish }: { form: any; loading: boolean; onFinish: (v: LibraryPrepCreate) => void }) => (
    <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={(c) => { if (c.sample_type === 'ntc') form.setFieldValue('specimen_code', 'NTC'); if (c.sample_type === 'extraction_blank') form.setFieldValue('specimen_code', 'EXB') }}>
      <Form.Item label="Sample Type" name="sample_type">
        <SampleTypeSelect />
      </Form.Item>
      <Form.Item label="Link to extraction" name="extraction_id" extra="Select if this library was prepared from a stored DNA extract">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Search by specimen code…"
          options={extractionOptions}
          onChange={onExtractionChange(form)}
        />
      </Form.Item>
      <Form.Item label="— or — Link to PCR product" name="pcr_sample_id" extra="Select if this library was prepared from a PCR amplicon">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Search by specimen code…"
          options={pcrOptions}
          onChange={onPCRSampleChange(form)}
        />
      </Form.Item>
      <Form.Item label="Sample Code" name="specimen_code" extra="Auto-filled from extraction or PCR sample above">
        <Input placeholder="e.g. AMPH2024-042" />
      </Form.Item>
      <Form.Item label="Sample Name" name="sample_name"><Input placeholder="Library sample name" /></Form.Item>
      <Form.Item label="Index i7" name="index_i7"><Input placeholder="e.g. N701" /></Form.Item>
      <Form.Item label="Index i5" name="index_i5"><Input placeholder="e.g. S502" /></Form.Item>
      <Form.Item label="Input (ng)" name="input_ng"><InputNumber min={0} step={0.1} style={{ width: '100%' }} /></Form.Item>
      <Form.Item label="Avg. Fragment Size (bp)" name="average_fragment_size_bp"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
      <Form.Item label="Library Concentration (ng/µl)" name="library_concentration_ng_ul">
        <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="qc_status" label="QC Status">
        <QcStatusSelect />
      </Form.Item>
      <Form.Item label="Notes" name="notes"><Input /></Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Library Prep Run #{run.id}</Typography.Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
          <Button onClick={() => navigate(`/library-prep-runs/${runId}/edit`)}>Edit Run</Button>
          {user?.is_admin && (
            <Popconfirm
              title="Delete this run?"
              onConfirm={() => deleteRun.mutateAsync(runId).then(() => { message.success('Deleted'); navigate('/library-prep-runs') })}
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
          <Descriptions.Item label="Target Region">{run.target_region ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Primers">{[run.primer_f, run.primer_r].filter(Boolean).join(' / ') || '—'}</Descriptions.Item>
          <Descriptions.Item label="# Samples"><Tag color="orange">{run.sample_count}</Tag></Descriptions.Item>
          <Descriptions.Item label="Protocol">
            {run.protocol
              ? <Button type="link" icon={<FileTextOutlined />} style={{ padding: 0 }} onClick={() => navigate(`/protocols/${run.protocol!.id}`)}>{run.protocol.name}{run.protocol.version ? ` ${run.protocol.version}` : ''}</Button>
              : '—'}
          </Descriptions.Item>
          {run.notes && <Descriptions.Item label="Notes" span={2}>{run.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>
      <Card title="Library Preps" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>Add Library</Button>}>
        <Table dataSource={run.samples ?? []} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title="Add Library Prep" open={addModalOpen} onCancel={() => { setAddModalOpen(false); addForm.resetFields() }} footer={null}>
        <PrepForm form={addForm} loading={addPrep.isPending} onFinish={handleAddPrep} />
      </Modal>
      <Modal title="Edit Library Prep" open={!!editSample} onCancel={() => setEditSample(null)} footer={null}>
        <PrepForm form={editForm} loading={updatePrep.isPending} onFinish={handleEditSave} />
      </Modal>

      <RunAttachmentsPanel runType="library_prep" runId={run.id} />
    </div>
  )
}
