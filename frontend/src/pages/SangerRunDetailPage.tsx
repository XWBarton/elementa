import {
  Button, Card, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, Upload, message, notification,
} from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined, EyeOutlined, InboxOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAddSangerSample, useDeleteSangerRun, useDeleteSangerSample, useSangerRun, useUpdateSangerSample } from '../hooks/useSangerRuns'
import { useAllPCRSamples } from '../hooks/usePCRRuns'
import { PCRSample, SangerSample, SangerSampleCreate, SangerSampleUpdate } from '../types'
import { useAuth } from '../context/AuthContext'
import { QcStatusTag, QcStatusSelect } from '../components/QcStatusTag'
import { SpecimenCodeAutocomplete } from '../components/SpecimenCodeAutocomplete'
import { useTesseraUrl } from '../hooks/useTesseraUrl'
import { SampleTypeTag, SampleTypeSelect } from '../components/SampleTypeTag'
import RunAttachmentsPanel from '../components/RunAttachmentsPanel'

// ── Sequence file parsing ─────────────────────────────────────────────────────

interface ParsedSeq { name: string; sequence: string }

function parseSeqFile(text: string): ParsedSeq[] {
  const trimmed = text.trim()
  if (trimmed.startsWith('@')) {
    const lines = trimmed.split('\n').map(l => l.trim())
    const out: ParsedSeq[] = []
    for (let i = 0; i + 1 < lines.length; i += 4) {
      if (lines[i].startsWith('@') && lines[i + 1])
        out.push({ name: lines[i].slice(1).split(/\s+/)[0], sequence: lines[i + 1].replace(/\s/g, '').toUpperCase() })
    }
    return out
  }
  const out: ParsedSeq[] = []
  let name = '', seq = ''
  for (const raw of trimmed.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('>')) {
      if (name) out.push({ name, sequence: seq })
      name = line.slice(1).split(/\s+/)[0]; seq = ''
    } else if (line && !line.startsWith(';')) {
      seq += line.replace(/\s/g, '').toUpperCase()
    }
  }
  if (name) out.push({ name, sequence: seq })
  return out
}

// ── Visualisation ─────────────────────────────────────────────────────────────

const BASE_COLORS: Record<string, string> = {
  A: '#389e0d', T: '#cf1322', C: '#096dd9', G: '#434343', N: '#aaa',
}

function SequenceViewer({ sequence }: { sequence: string }) {
  const upper = sequence.toUpperCase()
  const gc = [...upper].filter(b => b === 'G' || b === 'C').length
  const gcPct = upper.length > 0 ? Math.round((gc / upper.length) * 100) : 0
  const ROW = 60, BLOCK = 10
  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Tag>{upper.length} bp</Tag>
        <Tag color={gcPct < 30 || gcPct > 70 ? 'orange' : 'green'}>GC {gcPct}%</Tag>
      </Space>
      <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: '20px', overflowX: 'auto', background: '#fafafa', padding: 12, borderRadius: 6 }}>
        {Array.from({ length: Math.ceil(upper.length / ROW) }, (_, ri) => {
          const rowSeq = upper.slice(ri * ROW, (ri + 1) * ROW)
          return (
            <div key={ri} style={{ display: 'flex', gap: 10, marginBottom: 4, alignItems: 'baseline' }}>
              <span style={{ color: '#bbb', width: 44, textAlign: 'right', flexShrink: 0, fontSize: 11 }}>{ri * ROW + 1}</span>
              <span>
                {Array.from({ length: Math.ceil(rowSeq.length / BLOCK) }, (_, bi) => (
                  <span key={bi} style={{ marginRight: 10 }}>
                    {[...rowSeq.slice(bi * BLOCK, (bi + 1) * BLOCK)].map((base, i) => (
                      <span key={i} style={{ color: BASE_COLORS[base] ?? '#333' }}>{base}</span>
                    ))}
                  </span>
                ))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SeqPreview({ sequence }: { sequence: string }) {
  const upper = sequence.toUpperCase().slice(0, 30)
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
      {[...upper].map((b, i) => <span key={i} style={{ color: BASE_COLORS[b] ?? '#333' }}>{b}</span>)}
      {sequence.length > 30 && <span style={{ color: '#aaa' }}>…</span>}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SangerRunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const tesseraUrl = useTesseraUrl()
  const { data: run, isLoading } = useSangerRun(runId)
  const { data: allPCRSamples } = useAllPCRSamples()
  const addSample = useAddSangerSample(runId)
  const updateSample = useUpdateSangerSample(runId)
  const deleteSample = useDeleteSangerSample(runId)
  const deleteRun = useDeleteSangerRun()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editSample, setEditSample] = useState<SangerSample | null>(null)
  const [viewSeqSample, setViewSeqSample] = useState<SangerSample | null>(null)
  const [draggingOver, setDraggingOver] = useState<number | null>(null)
  const [savingSeq, setSavingSeq] = useState<number | null>(null)
  // Unified sequence picker — callback decides what to do with the chosen sequence
  const [seqPicker, setSeqPicker] = useState<ParsedSeq[] | null>(null)
  const [seqPickerApply, setSeqPickerApply] = useState<((s: ParsedSeq) => void) | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  if (isLoading || !run) return <Typography.Text>Loading...</Typography.Text>

  const pcrSampleMap: Record<number, PCRSample> = {}
  allPCRSamples?.forEach(s => { pcrSampleMap[s.id] = s })

  const pcrOptions = allPCRSamples?.map(s => {
    const code = s.specimen_code ?? s.extraction?.specimen_code
    return { label: code ? `${code} (PCR #${s.id})` : `PCR Sample #${s.id}`, value: s.id }
  }) ?? []

  const onPCRSampleChange = (form: ReturnType<typeof Form.useForm>[0]) => (pcrSampleId: number | undefined) => {
    if (pcrSampleId && pcrSampleMap[pcrSampleId]) {
      const s = pcrSampleMap[pcrSampleId]
      form.setFieldValue('specimen_code', s.specimen_code ?? s.extraction?.specimen_code)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applySeqToForm = (seq: ParsedSeq, form: any) => {
    form.setFieldValue('sequence', seq.sequence)
    form.setFieldValue('sequence_length_bp', seq.sequence.length)
    if (!form.getFieldValue('specimen_code')) form.setFieldValue('specimen_code', seq.name)
    message.success(`${seq.sequence.length} bp loaded`)
  }

  const saveSeqToSample = async (seq: ParsedSeq, sample: SangerSample) => {
    setSavingSeq(sample.id)
    try {
      await updateSample.mutateAsync({
        sampleId: sample.id,
        payload: { sequence: seq.sequence, sequence_length_bp: seq.sequence.length } as SangerSampleUpdate,
      })
      message.success(`Sequence saved to ${sample.specimen_code ?? `Sample #${sample.id}`} (${seq.sequence.length} bp)`)
    } finally {
      setSavingSeq(null)
    }
  }

  const handleFileParsed = (seqs: ParsedSeq[], apply: (s: ParsedSeq) => void) => {
    if (!seqs.length) { message.error('No sequences found in file'); return }
    if (seqs.length === 1) { apply(seqs[0]); return }
    setSeqPicker(seqs)
    setSeqPickerApply(() => apply)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFileForForm = (file: File, form: any) => {
    const reader = new FileReader()
    reader.onload = e => handleFileParsed(parseSeqFile(e.target?.result as string), seq => applySeqToForm(seq, form))
    reader.readAsText(file)
    return false
  }

  const handleRowDrop = (e: React.DragEvent, sample: SangerSample) => {
    e.preventDefault()
    setDraggingOver(null)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => handleFileParsed(parseSeqFile(ev.target?.result as string), seq => saveSeqToSample(seq, sample))
    reader.readAsText(file)
  }

  const handleAddSample = async (values: SangerSampleCreate) => {
    await addSample.mutateAsync(values)
    message.success('Sample added')
    addForm.resetFields()
    setAddModalOpen(false)
    const code = values.specimen_code
    if (code && !['NTC', 'EXB'].includes(code) && tesseraUrl) {
      const params = new URLSearchParams({ code, elementa_ref: String(runId), run_type: 'sanger' })
      notification.info({
        message: 'Record usage in Tessera',
        description: `Log what was taken from ${code}`,
        btn: <Button type="primary" size="small" onClick={() => window.open(`${tesseraUrl}/specimens/find?${params}`, '_blank')}>Open Tessera</Button>,
        duration: 12,
      })
    }
  }

  const handleEditSave = async (values: SangerSampleUpdate) => {
    if (!editSample) return
    await updateSample.mutateAsync({ sampleId: editSample.id, payload: values })
    message.success('Sample updated')
    setEditSample(null)
  }

  const handleExport = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/sanger-runs/${run.id}/export`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `sanger-run-${run.id}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { title: 'Type', dataIndex: 'sample_type', key: 'sample_type', width: 140, render: (v: string) => <SampleTypeTag type={v} /> },
    {
      title: 'Sample Code', key: 'specimen',
      render: (_: unknown, r: SangerSample) => {
        const code = r.specimen_code ?? r.pcr_sample?.specimen_code ?? r.pcr_sample?.extraction?.specimen_code
        return code ? <Tag color="blue">{code}</Tag> : '—'
      },
    },
    {
      title: 'PCR Sample', key: 'pcr_sample',
      render: (_: unknown, r: SangerSample) => r.pcr_sample_id ? <Tag>PCR #{r.pcr_sample_id}</Tag> : '—',
    },
    {
      title: 'Sequence', key: 'sequence',
      render: (_: unknown, r: SangerSample) => {
        if (savingSeq === r.id) return <Typography.Text type="secondary" style={{ fontSize: 12 }}>Saving…</Typography.Text>
        if (!r.sequence) return <Typography.Text type="secondary" style={{ fontSize: 12 }}>Drop file here</Typography.Text>
        return (
          <Space size={6}>
            <SeqPreview sequence={r.sequence} />
            <Button type="link" icon={<EyeOutlined />} size="small" style={{ padding: 0 }} onClick={() => setViewSeqSample(r)} />
          </Space>
        )
      },
    },
    { title: 'Length (bp)', dataIndex: 'sequence_length_bp', key: 'sequence_length_bp', render: (v: number) => v ?? '—' },
    { title: 'Quality Notes', dataIndex: 'quality_notes', key: 'quality_notes', render: (v: string) => v ?? '—' },
    { title: 'QC', dataIndex: 'qc_status', key: 'qc_status', render: (v: string) => <QcStatusTag status={v} /> },
    {
      title: 'Actions', key: 'actions',
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
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={(c) => {
        if (c.sample_type === 'ntc') form.setFieldValue('specimen_code', 'NTC')
        if (c.sample_type === 'extraction_blank') form.setFieldValue('specimen_code', 'EXB')
        if (c.sequence !== undefined) {
          const len = (c.sequence as string).replace(/\s/g, '').length
          if (len > 0) form.setFieldValue('sequence_length_bp', len)
        }
      }}
    >
      <Form.Item label="Sample Type" name="sample_type"><SampleTypeSelect /></Form.Item>
      <Form.Item label="PCR Sample (optional)" name="pcr_sample_id">
        <Select allowClear showSearch optionFilterProp="label" placeholder="Search by specimen code…" options={pcrOptions} onChange={onPCRSampleChange(form)} />
      </Form.Item>
      <Form.Item label="Sample Code" name="specimen_code">
        <SpecimenCodeAutocomplete placeholder="e.g. AMPH2024-042 or PCTRL-01" />
      </Form.Item>
      <Form.Item label="Sequence">
        <Upload.Dragger
          accept=".fasta,.fa,.fastq,.fq,.txt"
          maxCount={1}
          showUploadList={false}
          beforeUpload={f => handleFileForForm(f, form)}
          style={{ marginBottom: 8, padding: '8px 0' }}
        >
          <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
            <InboxOutlined style={{ marginRight: 6, color: '#096dd9' }} />
            Drop .fasta / .fa / .fastq here, or click to browse
          </p>
        </Upload.Dragger>
        <Form.Item name="sequence" noStyle>
          <Input.TextArea rows={3} placeholder="…or paste sequence directly" style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </Form.Item>
      </Form.Item>
      <Form.Item label="Sequence Length (bp)" name="sequence_length_bp" extra="Auto-filled from sequence">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="Quality Notes" name="quality_notes"><Input.TextArea rows={2} /></Form.Item>
      <Form.Item label="Output File Path" name="output_file_path"><Input placeholder="/path/to/sequence.ab1" /></Form.Item>
      <Form.Item name="qc_status" label="QC Status"><QcStatusSelect /></Form.Item>
      <Form.Item label="Notes" name="notes"><Input /></Form.Item>
      <Form.Item><Button type="primary" htmlType="submit" loading={loading}>Save</Button></Form.Item>
    </Form>
  )

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Sanger Run #{run.id}</Typography.Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
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
          <Descriptions.Item label="Protocol">
            {run.protocol
              ? <Button type="link" icon={<FileTextOutlined />} style={{ padding: 0 }} onClick={() => navigate(`/protocols/${run.protocol!.id}`)}>{run.protocol.name}{run.protocol.version ? ` ${run.protocol.version}` : ''}</Button>
              : '—'}
          </Descriptions.Item>
          {run.notes && <Descriptions.Item label="Notes" span={2}>{run.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card
        title="Samples"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>Add Sample</Button>}
      >
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          Drag a .fasta / .fastq file directly onto a row to load its sequence
        </Typography.Text>
        <Table
          dataSource={run.samples ?? []}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20 }}
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({
            onDragOver: (e) => { e.preventDefault(); setDraggingOver(record.id) },
            onDragLeave: () => setDraggingOver(null),
            onDrop: (e) => handleRowDrop(e as unknown as React.DragEvent, record),
            style: draggingOver === record.id
              ? { background: '#e6f7ff', outline: '2px dashed #096dd9', cursor: 'copy' }
              : { cursor: 'default' },
          })}
        />
      </Card>

      <Modal title="Add Sample" open={addModalOpen} onCancel={() => { setAddModalOpen(false); addForm.resetFields() }} footer={null} width={560}>
        <SampleForm form={addForm} loading={addSample.isPending} onFinish={handleAddSample} />
      </Modal>
      <Modal title="Edit Sample" open={!!editSample} onCancel={() => setEditSample(null)} footer={null} width={560}>
        <SampleForm form={editForm} loading={updateSample.isPending} onFinish={handleEditSave} />
      </Modal>

      {/* Multi-record picker */}
      <Modal
        title={`${seqPicker?.length} sequences found — select one`}
        open={!!seqPicker}
        onCancel={() => { setSeqPicker(null); setSeqPickerApply(null) }}
        footer={null}
        width={560}
      >
        <Table
          size="small"
          dataSource={seqPicker ?? []}
          rowKey="name"
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Length', key: 'len', render: (_: unknown, r: ParsedSeq) => `${r.sequence.length} bp` },
            { title: 'Preview', key: 'prev', render: (_: unknown, r: ParsedSeq) => <SeqPreview sequence={r.sequence} /> },
            {
              title: '', key: 'use',
              render: (_: unknown, r: ParsedSeq) => (
                <Button size="small" onClick={() => { seqPickerApply?.(r); setSeqPicker(null); setSeqPickerApply(null) }}>Use</Button>
              ),
            },
          ]}
        />
      </Modal>

      {/* Sequence viewer */}
      <Modal
        title={viewSeqSample ? `Sequence — ${viewSeqSample.specimen_code ?? `Sample #${viewSeqSample.id}`}` : 'Sequence'}
        open={!!viewSeqSample}
        onCancel={() => setViewSeqSample(null)}
        footer={null}
        width={720}
      >
        {viewSeqSample?.sequence && <SequenceViewer sequence={viewSeqSample.sequence} />}
      </Modal>

      <RunAttachmentsPanel runType="sanger" runId={run.id} />
    </div>
  )
}
