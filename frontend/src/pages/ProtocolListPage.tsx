import { Button, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useProtocols } from '../hooks/useProtocols'
import type { Protocol } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  extraction: 'green',
  pcr: 'blue',
  sanger: 'purple',
  library_prep: 'orange',
  ngs: 'cyan',
  general: 'default',
}

export default function ProtocolListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useProtocols(0, 200)

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, record: Protocol) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/protocols/${record.id}`)}>
          {v}
        </Button>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => v ? <Tag color={CATEGORY_COLORS[v] ?? 'default'}>{v}</Tag> : '—',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (v: string) => v ?? '—',
    },
    {
      title: '# Steps',
      key: 'steps',
      render: (_: unknown, record: Protocol) => (
        <Tag color="blue">{record.steps?.length ?? 0}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Protocol) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/protocols/${record.id}`)}>View</Button>
          <Button type="link" onClick={() => navigate(`/protocols/${record.id}/edit`)}>Edit</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Protocols</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/protocols/new')}>
          New Protocol
        </Button>
      </Space>
      <Table
        dataSource={data?.items ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({ onClick: () => navigate(`/protocols/${record.id}`) })}
        style={{ cursor: 'pointer' }}
      />
    </div>
  )
}
