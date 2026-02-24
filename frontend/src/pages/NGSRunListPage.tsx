import { useState } from 'react'
import { Button, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNGSRuns, useDeleteNGSRun } from '../hooks/useNGSRuns'
import { useAuth } from '../context/AuthContext'
import { NGSPlatform, NGSRun } from '../types'

const PLATFORMS: NGSPlatform[] = ['Illumina', 'ONT', 'PacBio', 'Other']
const PLATFORM_COLORS: Record<string, string> = {
  Illumina: 'blue', ONT: 'orange', PacBio: 'purple', Other: 'default',
}

export default function NGSRunListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [platform, setPlatform] = useState<string | undefined>()
  const pageSize = 20
  const { data, isLoading } = useNGSRuns({ skip: (page - 1) * pageSize, limit: pageSize, platform })
  const deleteMutation = useDeleteNGSRun()

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Run ID', dataIndex: 'run_id', key: 'run_id' },
    { title: 'Platform', dataIndex: 'platform', key: 'platform', render: (v: string) => <Tag color={PLATFORM_COLORS[v]}>{v}</Tag> },
    { title: 'Instrument', dataIndex: 'instrument', key: 'instrument' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Operator', dataIndex: ['operator', 'username'], key: 'operator' },
    { title: 'Total Reads', dataIndex: 'total_reads', key: 'total_reads', render: (v: number) => v?.toLocaleString() },
    { title: 'Q30%', dataIndex: 'q30_percent', key: 'q30_percent' },
    { title: 'Libraries', dataIndex: 'libraries', key: 'libraries', render: (v: unknown[]) => v?.length ?? 0 },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, row: NGSRun) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/ngs-runs/${row.id}/edit`)}>Edit</Button>
          {user?.is_admin && (
            <Popconfirm
              title="Delete this NGS run?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() =>
                deleteMutation.mutateAsync(row.id)
                  .then(() => message.success('NGS run deleted'))
                  .catch(() => message.error('Failed to delete'))
              }
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>NGS Runs</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ngs-runs/new')}>
          New NGS Run
        </Button>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by platform"
          allowClear
          style={{ width: 180 }}
          value={platform}
          onChange={(v) => { setPlatform(v); setPage(1) }}
          options={PLATFORMS.map((p) => ({ label: p, value: p }))}
        />
      </Space>
      <Table dataSource={data?.items ?? []} columns={columns} rowKey="id" loading={isLoading}
        pagination={{ current: page, pageSize, total: data?.total, onChange: setPage }} />
    </div>
  )
}
