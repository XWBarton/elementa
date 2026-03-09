import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd'
import { ExperimentOutlined, ThunderboltOutlined, AlignLeftOutlined, DatabaseOutlined, CloudServerOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/stats'
import { useExtractionRuns } from '../hooks/useExtractionRuns'
import { ExtractionRun } from '../types'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: getStats })
  const { data: recentRuns } = useExtractionRuns({ limit: 10 })

  const statCards = [
    { title: 'Extraction Runs', value: stats?.extraction_runs, sub: `${stats?.extractions ?? 0} samples`, icon: <ExperimentOutlined />, color: '#1677ff' },
    { title: 'PCR Runs', value: stats?.pcr_runs, sub: `${stats?.pcr_samples ?? 0} samples`, icon: <ThunderboltOutlined />, color: '#0ea5e9' },
    { title: 'Sanger Runs', value: stats?.sanger_runs, sub: `${stats?.sanger_samples ?? 0} samples`, icon: <AlignLeftOutlined />, color: '#7c3aed' },
    { title: 'Library Prep Runs', value: stats?.library_prep_runs, sub: `${stats?.library_preps ?? 0} preps`, icon: <DatabaseOutlined />, color: '#ea580c' },
    { title: 'NGS Runs', value: stats?.ngs_runs, sub: `${stats?.ngs_libraries ?? 0} libraries`, icon: <CloudServerOutlined />, color: '#db2777' },
  ]

  const columns = [
    { title: 'Run ID', dataIndex: 'id', key: 'id', render: (v: number) => `#${v}` },
    { title: 'Date', dataIndex: 'run_date', key: 'run_date', render: (v: string) => v ?? '—' },
    { title: 'Type', dataIndex: 'extraction_type', key: 'extraction_type', render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
    { title: 'Operator', dataIndex: ['operator', 'username'], key: 'operator', render: (v: string) => v ?? '—' },
    { title: 'Kit', dataIndex: 'kit', key: 'kit', render: (v: string) => v ?? '—' },
    { title: '# Samples', dataIndex: 'sample_count', key: 'sample_count', render: (v: number) => <Tag color="blue">{v}</Tag> },
  ]

  return (
    <div>
      <Typography.Title level={3}>Dashboard</Typography.Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((s) => (
          <Col span={4} key={s.title}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value ?? 0}
                prefix={s.icon}
                valueStyle={{ color: s.color }}
              />
              {s.sub && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{s.sub}</Typography.Text>}
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="Recent Extraction Runs">
        <Table
          dataSource={recentRuns?.items ?? []}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          onRow={(record: ExtractionRun) => ({ onClick: () => navigate(`/extraction-runs/${record.id}`), style: { cursor: 'pointer' } })}
        />
      </Card>
    </div>
  )
}
