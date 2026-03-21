import { useState } from 'react'
import { Button, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNGSRuns, useDeleteNGSRun } from '../hooks/useNGSRuns'
import { useProjects } from '../hooks/useProjects'
import { useUsers } from '../hooks/useUsers'
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
  const [projectId, setProjectId] = useState<number | undefined>()
  const [operatorId, setOperatorId] = useState<number | undefined>()
  const pageSize = 20
  const { data, isLoading } = useNGSRuns({ skip: (page - 1) * pageSize, limit: pageSize, platform, project_id: projectId, operator_id: operatorId })
  const deleteMutation = useDeleteNGSRun()
  const { data: projects } = useProjects()
  const { data: usersData } = useUsers({ limit: 200 })

  const columns = [
    {
      title: 'Project',
      key: 'project',
      render: (_: unknown, record: NGSRun) =>
        record.project ? <Tag color="blue">{record.project.code}</Tag> : '—',
    },
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
          <Button size="small" type="primary" onClick={() => navigate(`/ngs-runs/${row.id}`)}>View</Button>
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
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Filter by platform"
          allowClear
          style={{ width: 180 }}
          value={platform}
          onChange={(v) => { setPlatform(v); setPage(1) }}
          options={PLATFORMS.map((p) => ({ label: p, value: p }))}
        />
        <Select
          allowClear placeholder="Filter by project" style={{ width: 200 }}
          options={projects?.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id })) ?? []}
          onChange={(v) => { setProjectId(v); setPage(1) }} value={projectId}
        />
        <Select
          allowClear placeholder="Filter by operator" style={{ width: 180 }}
          showSearch optionFilterProp="label"
          options={usersData?.items.map(u => ({ label: u.full_name || u.username, value: u.id })) ?? []}
          onChange={(v) => { setOperatorId(v); setPage(1) }} value={operatorId}
        />
      </Space>
      <Table dataSource={data?.items ?? []} columns={columns} rowKey="id" loading={isLoading}
        pagination={{ current: page, pageSize, total: data?.total, onChange: setPage }} />
    </div>
  )
}
