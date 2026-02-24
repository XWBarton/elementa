import { Button, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSangerRuns } from '../hooks/useSangerRuns'
import { SangerRun } from '../types'

export default function SangerRunListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useSangerRuns({ limit: 100 })

  const columns = [
    { title: 'Date', dataIndex: 'run_date', key: 'run_date', render: (v: string) => v ?? '—' },
    { title: 'Operator', dataIndex: ['operator', 'username'], key: 'operator', render: (v: string) => v ?? '—' },
    { title: 'Primer', dataIndex: 'primer', key: 'primer', render: (v: string) => v ?? '—' },
    { title: 'Direction', dataIndex: 'direction', key: 'direction', render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
    { title: 'Provider', dataIndex: 'service_provider', key: 'service_provider', render: (v: string) => v ?? '—' },
    { title: '# Samples', dataIndex: 'sample_count', key: 'sample_count', render: (v: number) => <Tag color="purple">{v}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SangerRun) => (
        <Button type="link" onClick={() => navigate(`/sanger-runs/${record.id}`)}>View</Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Sanger Runs</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sanger-runs/new')}>New Run</Button>
      </Space>
      <Table
        dataSource={data?.items ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({ onClick: () => navigate(`/sanger-runs/${record.id}`) })}
        style={{ cursor: 'pointer' }}
      />
    </div>
  )
}
