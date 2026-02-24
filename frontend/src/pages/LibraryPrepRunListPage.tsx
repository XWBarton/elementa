import { Button, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useLibraryPrepRuns } from '../hooks/useLibraryPrepRuns'
import { LibraryPrepRun } from '../types'

export default function LibraryPrepRunListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useLibraryPrepRuns({ limit: 100 })

  const columns = [
    { title: 'Date', dataIndex: 'run_date', key: 'run_date', render: (v: string) => v ?? '—' },
    { title: 'Operator', dataIndex: ['operator', 'username'], key: 'operator', render: (v: string) => v ?? '—' },
    { title: 'Kit', dataIndex: 'kit', key: 'kit', render: (v: string) => v ?? '—' },
    { title: 'Target Region', dataIndex: 'target_region', key: 'target_region', render: (v: string) => v ?? '—' },
    { title: '# Samples', dataIndex: 'sample_count', key: 'sample_count', render: (v: number) => <Tag color="orange">{v}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: LibraryPrepRun) => (
        <Button type="link" onClick={() => navigate(`/library-prep-runs/${record.id}`)}>View</Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Library Prep Runs</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/library-prep-runs/new')}>New Run</Button>
      </Space>
      <Table
        dataSource={data?.items ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({ onClick: () => navigate(`/library-prep-runs/${record.id}`) })}
        style={{ cursor: 'pointer' }}
      />
    </div>
  )
}
