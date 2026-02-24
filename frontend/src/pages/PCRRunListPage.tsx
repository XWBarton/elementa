import { Button, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { usePCRRuns } from '../hooks/usePCRRuns'
import { PCRRun } from '../types'

export default function PCRRunListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = usePCRRuns({ limit: 100 })

  const columns = [
    { title: 'Date', dataIndex: 'run_date', key: 'run_date', render: (v: string) => v ?? '—' },
    { title: 'Operator', dataIndex: ['operator', 'username'], key: 'operator', render: (v: string) => v ?? '—' },
    { title: 'Target Region', dataIndex: 'target_region', key: 'target_region', render: (v: string) => v ?? '—' },
    { title: 'Polymerase', dataIndex: 'polymerase', key: 'polymerase', render: (v: string) => v ?? '—' },
    { title: '# Samples', dataIndex: 'sample_count', key: 'sample_count', render: (v: number) => <Tag color="blue">{v}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PCRRun) => (
        <Button type="link" onClick={() => navigate(`/pcr-runs/${record.id}`)}>View</Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>PCR Runs</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/pcr-runs/new')}>New Run</Button>
      </Space>
      <Table
        dataSource={data?.items ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({ onClick: () => navigate(`/pcr-runs/${record.id}`) })}
        style={{ cursor: 'pointer' }}
      />
    </div>
  )
}
