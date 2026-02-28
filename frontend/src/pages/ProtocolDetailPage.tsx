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
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useProtocol, useDeleteProtocol } from '../hooks/useProtocols'
import { useAuth } from '../context/AuthContext'
import { downloadProtocolPdf } from '../api/protocols'
import type { ProtocolStep } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  extraction: 'green',
  pcr: 'blue',
  sanger: 'purple',
  library_prep: 'orange',
  ngs: 'cyan',
  general: 'default',
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
              style={{ marginBottom: 12, borderLeft: '4px solid #1677ff' }}
              title={
                <span>
                  <span style={{ fontWeight: 700, marginRight: 8, color: '#1677ff' }}>{idx + 1}.</span>
                  {step.title}
                </span>
              }
              extra={
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
              }
            >
              {step.description && (
                <Typography.Paragraph style={{ margin: 0 }}>{step.description}</Typography.Paragraph>
              )}
            </Card>
          ))
        )}
      </Card>

      {/* Notes */}
      {protocol.notes && (
        <Card title="Notes">
          <Typography.Paragraph style={{ margin: 0 }}>{protocol.notes}</Typography.Paragraph>
        </Card>
      )}
    </div>
  )
}
