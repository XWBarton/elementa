import { Button, Select, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useLibraryPrepRuns } from '../hooks/useLibraryPrepRuns'
import { useProjects } from '../hooks/useProjects'
import { useUsers } from '../hooks/useUsers'
import { LibraryPrepRun } from '../types'

export default function LibraryPrepRunListPage() {
  const navigate = useNavigate()
  const [projectId, setProjectId] = useState<number | undefined>()
  const [operatorId, setOperatorId] = useState<number | undefined>()

  const { data, isLoading } = useLibraryPrepRuns({ limit: 200, project_id: projectId, operator_id: operatorId })
  const { data: projects } = useProjects()
  const { data: usersData } = useUsers({ limit: 200 })

  const columns = [
    {
      title: 'Project',
      key: 'project',
      render: (_: unknown, record: LibraryPrepRun) =>
        record.project ? <Tag color="blue">{record.project.code}</Tag> : '—',
    },
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
      <Space style={{ marginBottom: 12 }} wrap>
        <Select
          allowClear placeholder="Filter by project" style={{ width: 200 }}
          options={projects?.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id })) ?? []}
          onChange={setProjectId} value={projectId}
        />
        <Select
          allowClear placeholder="Filter by operator" style={{ width: 180 }}
          showSearch optionFilterProp="label"
          options={usersData?.items.map(u => ({ label: u.full_name || u.username, value: u.id })) ?? []}
          onChange={setOperatorId} value={operatorId}
        />
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
