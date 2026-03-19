import {
  Button, Card, Descriptions, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
  useProjects, useCreateProject, useUpdateProject, useDeleteProject,
  useAddProjectMember, useRemoveProjectMember,
} from '../hooks/useProjects'
import { useUsers } from '../hooks/useUsers'
import type { Project, ProjectMember } from '../types'

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const { data: usersData } = useUsers({ limit: 200 })
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()

  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [membersProject, setMembersProject] = useState<Project | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const handleCreate = async (values: { code: string; name: string; description?: string }) => {
    await createProject.mutateAsync(values)
    message.success('Project created')
    createForm.resetFields()
    setCreateOpen(false)
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (v: string) => <Tag color="blue" style={{ fontFamily: 'monospace' }}>{v}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'Members',
      key: 'members',
      render: (_: unknown, record: Project) => (
        <Space size={4} wrap>
          {record.members.length === 0
            ? <span style={{ color: '#bbb' }}>none</span>
            : record.members.map(m => (
              <Tag key={m.id}>{m.full_name || m.username}</Tag>
            ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Project) => (
        <Space>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => setMembersProject(record)}
          >
            Members
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => { setEditProject(record); editForm.setFieldsValue(record) }}
          />
          <Popconfirm
            title="Delete this project?"
            description="Runs assigned to this project will be unassigned."
            onConfirm={() => deleteProject.mutateAsync(record.id).then(() => message.success('Deleted'))}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Projects</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          New Project
        </Button>
      </Space>

      <Table
        dataSource={projects ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />

      {/* Create modal */}
      <Modal title="New Project" open={createOpen} onCancel={() => { setCreateOpen(false); createForm.resetFields() }} footer={null}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Code is required' }]}
            extra="1–20 uppercase letters/numbers (e.g. AMPH2024)">
            <Input placeholder="AMPH2024" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Amphibian Conservation 2024" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createProject.isPending}>Create</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit modal */}
      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          form={editForm}
        />
      )}

      {/* Members modal */}
      {membersProject && (
        <MembersModal
          project={membersProject}
          allUsers={usersData?.items ?? []}
          onClose={() => setMembersProject(null)}
        />
      )}
    </div>
  )
}

function EditProjectModal({
  project, onClose, form,
}: {
  project: Project
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
}) {
  const updateProject = useUpdateProject(project.id)

  const handleSave = async (values: { name: string; description?: string }) => {
    await updateProject.mutateAsync(values)
    message.success('Project updated')
    onClose()
  }

  return (
    <Modal title={`Edit — ${project.code}`} open onCancel={onClose} footer={null}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={updateProject.isPending}>Save</Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

function MembersModal({
  project, allUsers, onClose,
}: {
  project: Project
  allUsers: { id: number; username: string; full_name?: string }[]
  onClose: () => void
}) {
  const addMember = useAddProjectMember(project.id)
  const removeMember = useRemoveProjectMember(project.id)
  const { data: projects } = useProjects()

  const currentProject = projects?.find(p => p.id === project.id) ?? project
  const memberIds = new Set(currentProject.members.map(m => m.id))
  const nonMembers = allUsers.filter(u => !memberIds.has(u.id))

  const memberColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, m: ProjectMember) => (
        <span>{m.full_name ? `${m.full_name} (${m.username})` : m.username}</span>
      ),
    },
    {
      title: '',
      key: 'remove',
      render: (_: unknown, m: ProjectMember) => (
        <Button
          type="link"
          danger
          size="small"
          loading={removeMember.isPending}
          onClick={() => removeMember.mutateAsync(m.id)}
        >
          Remove
        </Button>
      ),
    },
  ]

  return (
    <Modal
      title={
        <Space>
          <Tag color="blue" style={{ fontFamily: 'monospace' }}>{project.code}</Tag>
          <span>Members</span>
        </Space>
      }
      open
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions size="small" column={1}>
          <Descriptions.Item label="Add member">
            <Select
              style={{ width: '100%' }}
              placeholder="Select user to add…"
              showSearch
              optionFilterProp="label"
              options={nonMembers.map(u => ({
                label: u.full_name ? `${u.full_name} (${u.username})` : u.username,
                value: u.id,
              }))}
              onChange={(userId: number) => addMember.mutateAsync(userId)}
              value={null}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Table
        dataSource={currentProject.members}
        columns={memberColumns}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: 'No members yet' }}
      />
    </Modal>
  )
}
