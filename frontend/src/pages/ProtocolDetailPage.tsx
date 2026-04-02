import {
  Button,
  Card,
  Descriptions,
  Space,
  Tag,
  Typography,
  Popconfirm,
  message,
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useProtocol, useDeleteProtocol } from '../hooks/useProtocols'
import { useAuth } from '../context/AuthContext'
import { downloadProtocolPdf } from '../api/protocols'
import type { Protocol, ProtocolStep } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  extraction: 'green',
  pcr: 'blue',
  sanger: 'purple',
  library_prep: 'orange',
  ngs: 'cyan',
  general: 'default',
}

function exportProtocolAsText(protocol: Protocol): string {
  const lines: string[] = []
  lines.push(`PROTOCOL: ${protocol.name}`)
  if (protocol.category) lines.push(`CATEGORY: ${protocol.category}`)
  if (protocol.version) lines.push(`VERSION: ${protocol.version}`)

  if (protocol.description) {
    lines.push('')
    lines.push('DESCRIPTION:')
    lines.push(protocol.description)
  }

  if (protocol.materials && protocol.materials.length > 0) {
    lines.push('')
    lines.push('MATERIALS:')
    protocol.materials.forEach(m => lines.push(`- ${m}`))
  }

  if (protocol.steps && protocol.steps.length > 0) {
    lines.push('')
    lines.push('STEPS:')
    protocol.steps.forEach((step, idx) => {
      let titleLine = `${idx + 1}. ${step.title}`
      if (step.duration_min != null) titleLine += ` [${step.duration_min} min]`
      if (step.temp_c != null) titleLine += ` [${step.temp_c}°C]`
      if (step.rpm != null) titleLine += ` [${step.rpm} RPM]`
      lines.push(titleLine)
      if (step.description) {
        step.description.split('\n').forEach(l => lines.push(`   ${l}`))
      }
      if (step.step_type === 'thermocycling') {
        if (step.cycles != null) lines.push(`   Cycles: ${step.cycles}`)
        if (step.initial_denat_temp_c != null || step.initial_denat_time_s != null)
          lines.push(`   Initial denaturation: ${step.initial_denat_temp_c ?? '?'}°C for ${step.initial_denat_time_s ?? '?'} s`)
        if (step.denat_temp_c != null || step.denat_time_s != null)
          lines.push(`   Denaturation: ${step.denat_temp_c ?? '?'}°C for ${step.denat_time_s ?? '?'} s`)
        if (step.anneal_temp_c != null || step.anneal_time_s != null)
          lines.push(`   Annealing: ${step.anneal_temp_c ?? '?'}°C for ${step.anneal_time_s ?? '?'} s`)
        if (step.extend_temp_c != null || step.extend_time_s != null)
          lines.push(`   Extension: ${step.extend_temp_c ?? '?'}°C for ${step.extend_time_s ?? '?'} s`)
        if (step.final_extend_temp_c != null || step.final_extend_time_s != null)
          lines.push(`   Final extension: ${step.final_extend_temp_c ?? '?'}°C for ${step.final_extend_time_s ?? '?'} s`)
      }
      lines.push('')
    })
  }

  if (protocol.references && protocol.references.length > 0) {
    lines.push('')
    lines.push('REFERENCES:')
    protocol.references.forEach(r => {
      if (r.title && r.url) lines.push(`- ${r.title}: ${r.url}`)
      else if (r.title) lines.push(`- ${r.title}`)
      else if (r.url) lines.push(`- ${r.url}`)
    })
  }

  if (protocol.notes) {
    lines.push('NOTES:')
    lines.push(protocol.notes)
  }

  return lines.join('\n')
}

function ThermocyclingStepDetail({ step }: { step: ProtocolStep }) {
  const fmt = (temp?: number, time?: number) => {
    const parts = []
    if (temp != null) parts.push(`${temp}°C`)
    if (time != null) parts.push(`${time} s`)
    return parts.join(', ') || '—'
  }

  return (
    <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '8px 12px', marginTop: 8 }}>
      <Space wrap size={[24, 8]}>
        {step.cycles != null && (
          <span><Typography.Text type="secondary" style={{ fontSize: 12 }}>Cycles: </Typography.Text><Tag color="orange">{step.cycles}×</Tag></span>
        )}
        {(step.initial_denat_temp_c != null || step.initial_denat_time_s != null) && (
          <span><Typography.Text type="secondary" style={{ fontSize: 12 }}>Init. denat.: </Typography.Text><Tag>{fmt(step.initial_denat_temp_c, step.initial_denat_time_s)}</Tag></span>
        )}
        {(step.denat_temp_c != null || step.denat_time_s != null) && (
          <span><Typography.Text type="secondary" style={{ fontSize: 12 }}>Denat.: </Typography.Text><Tag color="volcano">{fmt(step.denat_temp_c, step.denat_time_s)}</Tag></span>
        )}
        {(step.anneal_temp_c != null || step.anneal_time_s != null) && (
          <span><Typography.Text type="secondary" style={{ fontSize: 12 }}>Anneal: </Typography.Text><Tag color="blue">{fmt(step.anneal_temp_c, step.anneal_time_s)}</Tag></span>
        )}
        {(step.extend_temp_c != null || step.extend_time_s != null) && (
          <span><Typography.Text type="secondary" style={{ fontSize: 12 }}>Extend: </Typography.Text><Tag color="green">{fmt(step.extend_temp_c, step.extend_time_s)}</Tag></span>
        )}
        {(step.final_extend_temp_c != null || step.final_extend_time_s != null) && (
          <span><Typography.Text type="secondary" style={{ fontSize: 12 }}>Final ext.: </Typography.Text><Tag>{fmt(step.final_extend_temp_c, step.final_extend_time_s)}</Tag></span>
        )}
      </Space>
    </div>
  )
}

export default function ProtocolDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: protocol, isLoading } = useProtocol(Number(id))
  const deleteProtocol = useDeleteProtocol()
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleDelete = async () => {
    await deleteProtocol.mutateAsync(Number(id))
    message.success('Protocol deleted')
    navigate('/protocols')
  }

  const handlePdf = async () => {
    setPdfLoading(true)
    try {
      await downloadProtocolPdf(Number(id))
    } catch {
      message.error('Failed to generate PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleExportText = () => {
    if (!protocol) return
    const text = exportProtocolAsText(protocol)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const slug = protocol.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    a.download = `${slug}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || !protocol) return <Typography.Text>Loading…</Typography.Text>

  return (
    <div style={{ maxWidth: 800 }}>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/protocols')}>
            Back
          </Button>
          <Typography.Title level={3} style={{ margin: 0 }}>{protocol.name}</Typography.Title>
        </Space>
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={handlePdf} loading={pdfLoading}>
            Export PDF
          </Button>
          <Button icon={<FileTextOutlined />} onClick={handleExportText}>
            Export Text
          </Button>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/protocols/${id}/edit`)}>
            Edit
          </Button>
          {user?.is_admin && (
            <Popconfirm
              title="Delete this protocol?"
              onConfirm={handleDelete}
              okText="Delete"
              okType="danger"
            >
              <Button danger icon={<DeleteOutlined />} loading={deleteProtocol.isPending}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      </Space>

      {/* Metadata card */}
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Category">
            {protocol.category
              ? <Tag color={CATEGORY_COLORS[protocol.category]}>{protocol.category}</Tag>
              : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Version">{protocol.version ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Created by">
            {protocol.created_by?.full_name || protocol.created_by?.username || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(protocol.created_at).toLocaleDateString()}
          </Descriptions.Item>
          {protocol.description && (
            <Descriptions.Item label="Description" span={2}>
              {protocol.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Materials */}
      {protocol.materials && protocol.materials.length > 0 && (
        <Card title="Materials" style={{ marginBottom: 16 }}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {protocol.materials.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Steps */}
      <Card title={`Steps (${protocol.steps?.length ?? 0})`} style={{ marginBottom: 16 }}>
        {(!protocol.steps || protocol.steps.length === 0) ? (
          <Typography.Text type="secondary">No steps defined.</Typography.Text>
        ) : (
          protocol.steps.map((step: ProtocolStep, idx) => (
            <Card
              key={idx}
              size="small"
              style={{ marginBottom: 12, borderLeft: `4px solid ${step.step_type === 'thermocycling' ? '#fa8c16' : '#1677ff'}` }}
              title={
                <span>
                  <span style={{ fontWeight: 700, marginRight: 8, color: step.step_type === 'thermocycling' ? '#fa8c16' : '#1677ff' }}>{idx + 1}.</span>
                  {step.title}
                  {step.step_type === 'thermocycling' && (
                    <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Thermocycling</Tag>
                  )}
                </span>
              }
              extra={
                step.step_type !== 'thermocycling' ? (
                  <Space wrap>
                    {step.duration_min != null && (
                      <Tag color="geekblue">{step.duration_min} min</Tag>
                    )}
                    {step.temp_c != null && (
                      <Tag color="volcano">{step.temp_c}°C</Tag>
                    )}
                    {step.rpm != null && (
                      <Tag color="purple">{step.rpm} RPM</Tag>
                    )}
                  </Space>
                ) : null
              }
            >
              {step.description && (
                <Typography.Paragraph style={{ margin: 0 }}>{step.description}</Typography.Paragraph>
              )}
              {step.step_type === 'thermocycling' && <ThermocyclingStepDetail step={step} />}
            </Card>
          ))
        )}
      </Card>

      {/* References */}
      {protocol.references && protocol.references.length > 0 && (
        <Card title="References" style={{ marginBottom: 16 }}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {protocol.references.map((ref, i) => (
              <li key={i}>
                {ref.url ? (
                  <a href={ref.url} target="_blank" rel="noopener noreferrer">
                    <LinkOutlined style={{ marginRight: 6 }} />
                    {ref.title || ref.url}
                  </a>
                ) : (
                  ref.title
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Notes */}
      {protocol.notes && (
        <Card title="Notes">
          <Typography.Paragraph style={{ margin: 0 }}>{protocol.notes}</Typography.Paragraph>
        </Card>
      )}
    </div>
  )
}
