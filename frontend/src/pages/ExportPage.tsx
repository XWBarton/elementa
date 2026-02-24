import { useState } from 'react'
import { Button, Card, Col, Row, Space, Typography, message } from 'antd'
import {
  DownloadOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  AlignLeftOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  exportExtractions,
  exportPCRSamples,
  exportSangerSamples,
  exportLibraryPreps,
  exportNGSLibraries,
  downloadBackup,
} from '../api/export'
import { useAuth } from '../context/AuthContext'

const { Title, Text, Paragraph } = Typography

interface ExportCardProps {
  icon: React.ReactNode
  title: string
  description: string
  filename: string
  onExport: () => Promise<void>
}

function ExportCard({ icon, title, description, filename, onExport }: ExportCardProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onExport()
      message.success(`Downloaded ${filename}`)
    } catch {
      message.error('Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card size="small" style={{ height: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          {icon}
          <Text strong>{title}</Text>
        </Space>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
          {description}
        </Paragraph>
        <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{filename}</Text>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleClick}
          style={{ marginTop: 4 }}
        >
          Download CSV
        </Button>
      </Space>
    </Card>
  )
}

export default function ExportPage() {
  const { user } = useAuth()
  const [backupLoading, setBackupLoading] = useState(false)

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      await downloadBackup()
      message.success('Database backup downloaded')
    } catch {
      message.error('Backup failed')
    } finally {
      setBackupLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>Export Data</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Download your lab data as CSV files. Each export includes the run metadata alongside
        per-sample results so the file is self-contained. Specimen codes are resolved from
        linked records automatically.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <ExportCard
            icon={<ExperimentOutlined style={{ color: '#1677ff' }} />}
            title="Extractions"
            description="All extractions with run metadata (kit, date, operator) and per-sample results (yield, A260/280, RIN score, storage location)."
            filename="extractions_YYYY-MM-DD.csv"
            onExport={exportExtractions}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ExportCard
            icon={<ThunderboltOutlined style={{ color: '#faad14' }} />}
            title="PCR Samples"
            description="All PCR samples with run metadata (target region, primers, annealing temp, polymerase) and gel results."
            filename="pcr_samples_YYYY-MM-DD.csv"
            onExport={exportPCRSamples}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ExportCard
            icon={<AlignLeftOutlined style={{ color: '#722ed1' }} />}
            title="Sanger Samples"
            description="All Sanger sequencing results with run metadata (primer, direction, service provider) and sequence quality data."
            filename="sanger_samples_YYYY-MM-DD.csv"
            onExport={exportSangerSamples}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ExportCard
            icon={<DatabaseOutlined style={{ color: '#52c41a' }} />}
            title="Library Preps"
            description="All library preparations with run metadata (kit, target region, primers) and per-sample indices, concentrations, and fragment sizes."
            filename="library_preps_YYYY-MM-DD.csv"
            onExport={exportLibraryPreps}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ExportCard
            icon={<CloudServerOutlined style={{ color: '#13c2c2' }} />}
            title="NGS Libraries"
            description="All NGS run libraries with sequencing run metadata (platform, instrument, read stats) and per-library sample information."
            filename="ngs_libraries_YYYY-MM-DD.csv"
            onExport={exportNGSLibraries}
          />
        </Col>
      </Row>

      {user?.is_admin && (
        <>
          <Title level={4} style={{ marginTop: 32, marginBottom: 4 }}>Database Backup</Title>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Admin only. Downloads a complete snapshot of the SQLite database file.
          </Paragraph>
          <Card size="small" style={{ maxWidth: 400 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <SaveOutlined style={{ color: '#ff4d4f' }} />
                <Text strong>Full Database Backup</Text>
              </Space>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
                Downloads the entire database as a <code>.db</code> file. Useful for off-site
                backups or migrating to a new server.
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>elementa_backup_YYYY-MM-DD_HHMM.db</Text>
              <Button
                danger
                icon={<DownloadOutlined />}
                loading={backupLoading}
                onClick={handleBackup}
                style={{ marginTop: 4 }}
              >
                Download Backup (.db)
              </Button>
            </Space>
          </Card>
        </>
      )}
    </div>
  )
}
