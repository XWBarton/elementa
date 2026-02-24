import { Button, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useExtractionRuns } from '../hooks/useExtractionRuns'
import { ExtractionRun } from '../types'

export default function ExtractionRunListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useExtractionRuns({ limit: 100 })

  const columns = [
    {
      title: 'Date',
      dataIndex: 'run_date',
      key: 'run_date',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'Operator',
      dataIndex: ['operator', 'username'],
      key: 'operator',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'Kit',
      dataIndex: 'kit',
      key: 'kit',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'Type',
      dataIndex: 'extraction_type',
      key: 'extraction_type',
      render: (v: string) => v ? <Tag>{v}</Tag> : '—',
    },
    {
      title: '# Samples',
      dataIndex: 'sample_count',
      key: 'sample_count',
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ExtractionRun) => (
        <Button type="link" onClick={() => navigate(`/extraction-runs/${record.id}`)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Extraction Runs</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/extraction-runs/new')}>
          New Run
        </Button>
      </Space>
      <Table
        dataSource={data?.items ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({ onClick: () => navigate(`/extraction-runs/${record.id}`) })}
        style={{ cursor: 'pointer' }}
      />
    </div>
  )
}
