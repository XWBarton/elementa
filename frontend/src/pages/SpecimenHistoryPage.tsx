import { Button, Card, Input, Space, Table, Tag, Timeline, Typography, message } from 'antd'
import { SearchOutlined, ExperimentOutlined, ThunderboltOutlined, AlignLeftOutlined, DatabaseOutlined, CloudServerOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { QcStatusTag } from '../components/QcStatusTag'
import { useTesseraUrl } from '../hooks/useTesseraUrl'

interface HistoryEntry {
  step: string
  run_id: number
  sample_id?: number
  library_id?: number
  date: string
  operator: string | null
  qc_status?: string
  detail: string
  color: string
  icon: React.ReactNode
  navPath: string
}

interface SpecimenHistory {
  specimen_code: string
  extractions: Array<{ run_id: number; sample_id: number; date: string; operator: string | null; yield_ng_ul?: number; qc_status?: string; extraction_type?: string }>
  pcr_samples: Array<{ run_id: number; sample_id: number; date: string; operator: string | null; target_region?: string; gel_result?: string; qc_status?: string }>
  sanger_samples: Array<{ run_id: number; sample_id: number; date: string; operator: string | null; sequence_length_bp?: number; qc_status?: string; primer?: string }>
  library_preps: Array<{ run_id: number; sample_id: number; date: string; operator: string | null; index_i7?: string; index_i5?: string; qc_status?: string }>
  ngs_libraries: Array<{ run_id: number; library_id: number; date: string; operator: string | null; platform?: string; reads_millions?: number; qc_status?: string }>
}

const PLATFORM_COLORS: Record<string, string> = { Illumina: 'blue', ONT: 'orange', PacBio: 'purple', Other: 'default' }
const GEL_COLORS: Record<string, string> = { pass: 'green', fail: 'red', weak: 'orange', multiple_bands: 'purple' }

export default function SpecimenHistoryPage() {
  const navigate = useNavigate()
  const tesseraUrl = useTesseraUrl()
  const [specimenCode, setSpecimenCode] = useState('')
  const [history, setHistory] = useState<SpecimenHistory | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    const code = specimenCode.trim()
    if (!code) return
    setLoading(true)
    try {
      const { data } = await client.get(`/admin/specimen-history/${encodeURIComponent(code)}`)
      setHistory(data)
    } catch {
      message.error('Failed to load specimen history')
    } finally {
      setLoading(false)
    }
  }

  const buildTimeline = (h: SpecimenHistory): HistoryEntry[] => {
    const entries: HistoryEntry[] = []

    for (const e of h.extractions) {
      entries.push({
        step: 'Extraction',
        run_id: e.run_id,
        sample_id: e.sample_id,
        date: e.date,
        operator: e.operator,
        qc_status: e.qc_status,
        detail: [e.extraction_type, e.yield_ng_ul != null ? `${e.yield_ng_ul} ng/µL` : null].filter(Boolean).join(' · ') || '—',
        color: 'blue',
        icon: <ExperimentOutlined />,
        navPath: `/extraction-runs/${e.run_id}`,
      })
    }

    for (const s of h.pcr_samples) {
      entries.push({
        step: 'PCR',
        run_id: s.run_id,
        sample_id: s.sample_id,
        date: s.date,
        operator: s.operator,
        qc_status: s.qc_status,
        detail: [s.target_region, s.gel_result ? `Gel: ${s.gel_result}` : null].filter(Boolean).join(' · ') || '—',
        color: 'orange',
        icon: <ThunderboltOutlined />,
        navPath: `/pcr-runs/${s.run_id}`,
      })
    }

    for (const s of h.sanger_samples) {
      entries.push({
        step: 'Sanger',
        run_id: s.run_id,
        sample_id: s.sample_id,
        date: s.date,
        operator: s.operator,
        qc_status: s.qc_status,
        detail: [s.primer, s.sequence_length_bp ? `${s.sequence_length_bp} bp` : null].filter(Boolean).join(' · ') || '—',
        color: 'purple',
        icon: <AlignLeftOutlined />,
        navPath: `/sanger-runs/${s.run_id}`,
      })
    }

    for (const lp of h.library_preps) {
      entries.push({
        step: 'Library Prep',
        run_id: lp.run_id,
        sample_id: lp.sample_id,
        date: lp.date,
        operator: lp.operator,
        qc_status: lp.qc_status,
        detail: [lp.index_i7 ? `i7: ${lp.index_i7}` : null, lp.index_i5 ? `i5: ${lp.index_i5}` : null].filter(Boolean).join(' · ') || '—',
        color: 'cyan',
        icon: <DatabaseOutlined />,
        navPath: `/library-prep-runs/${lp.run_id}`,
      })
    }

    for (const lib of h.ngs_libraries) {
      entries.push({
        step: 'NGS',
        run_id: lib.run_id,
        library_id: lib.library_id,
        date: lib.date,
        operator: lib.operator,
        qc_status: lib.qc_status,
        detail: [lib.platform, lib.reads_millions != null ? `${lib.reads_millions.toFixed(2)}M reads` : null].filter(Boolean).join(' · ') || '—',
        color: 'green',
        icon: <CloudServerOutlined />,
        navPath: `/ngs-runs/${lib.run_id}`,
      })
    }

    entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    return entries
  }

  const stepColors: Record<string, string> = {
    Extraction: 'blue', PCR: 'orange', Sanger: 'purple', 'Library Prep': 'cyan', NGS: 'green',
  }

  const tableColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v || '—' },
    { title: 'Step', dataIndex: 'step', key: 'step', render: (v: string) => <Tag color={stepColors[v]}>{v}</Tag> },
    {
      title: 'Run', key: 'run',
      render: (_: unknown, r: HistoryEntry) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(r.navPath)}>
          Run #{r.run_id}
        </Button>
      ),
    },
    { title: 'Operator', dataIndex: 'operator', key: 'operator', render: (v: string | null) => v ?? '—' },
    { title: 'Detail', dataIndex: 'detail', key: 'detail' },
    { title: 'QC', dataIndex: 'qc_status', key: 'qc_status', render: (v: string) => <QcStatusTag status={v} /> },
  ]

  const timeline = history ? buildTimeline(history) : []
  const totalSteps = timeline.length
  const passCount = timeline.filter(e => e.qc_status === 'pass').length

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>Specimen Molecular History</Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Enter specimen code (e.g. AMPH2024-001)"
            value={specimenCode}
            onChange={e => setSpecimenCode(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 320 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={handleSearch}>
            Search
          </Button>
          {tesseraUrl && specimenCode.trim() && (
            <Button
              type="link"
              onClick={() => window.open(`${tesseraUrl}/specimens/find?code=${specimenCode.trim()}`, '_blank', 'noopener,noreferrer')}
            >
              View in Tessera
            </Button>
          )}
        </Space>
      </Card>

      {history && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Space size="large">
              <span><Typography.Text strong>Specimen:</Typography.Text> <Tag color="blue">{history.specimen_code}</Tag></span>
              <span><Typography.Text strong>Total Steps:</Typography.Text> <Tag>{totalSteps}</Tag></span>
              <span><Typography.Text strong>Extractions:</Typography.Text> <Tag color="blue">{history.extractions.length}</Tag></span>
              <span><Typography.Text strong>PCR Runs:</Typography.Text> <Tag color="orange">{history.pcr_samples.length}</Tag></span>
              <span><Typography.Text strong>Sanger:</Typography.Text> <Tag color="purple">{history.sanger_samples.length}</Tag></span>
              <span><Typography.Text strong>Lib Preps:</Typography.Text> <Tag color="cyan">{history.library_preps.length}</Tag></span>
              <span><Typography.Text strong>NGS:</Typography.Text> <Tag color="green">{history.ngs_libraries.length}</Tag></span>
              {totalSteps > 0 && <span><Typography.Text strong>QC Pass:</Typography.Text> <Tag color="success">{passCount}/{totalSteps}</Tag></span>}
            </Space>
          </Card>

          {totalSteps === 0 ? (
            <Card>
              <Typography.Text type="secondary">No molecular records found for {history.specimen_code}.</Typography.Text>
            </Card>
          ) : (
            <Card title="Processing Timeline">
              <Timeline
                mode="left"
                items={timeline.map(e => ({
                  color: e.color,
                  dot: e.icon,
                  label: e.date || '—',
                  children: (
                    <Space direction="vertical" size={2}>
                      <Space>
                        <Tag color={stepColors[e.step]}>{e.step}</Tag>
                        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(e.navPath)}>
                          Run #{e.run_id}
                        </Button>
                        {e.operator && <Typography.Text type="secondary" style={{ fontSize: 12 }}>by {e.operator}</Typography.Text>}
                      </Space>
                      <Typography.Text style={{ fontSize: 12 }}>{e.detail}</Typography.Text>
                      {e.qc_status && <QcStatusTag status={e.qc_status} />}
                    </Space>
                  ),
                }))}
              />
            </Card>
          )}

          <Card title="All Records" style={{ marginTop: 16 }}>
            <Table dataSource={timeline} columns={tableColumns} rowKey={(r, i) => `${r.step}-${r.run_id}-${i}`} size="small" pagination={{ pageSize: 20 }} />
          </Card>
        </>
      )}
    </div>
  )
}
