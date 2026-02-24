import { useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tabs, Typography, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useUsers, useCreateUser, useUpdateUser, useHardDeleteUser } from '../hooks/useUsers'
import { useAuth } from '../context/AuthContext'
import { User } from '../types'

function UsersTab() {
  const { user: currentUser } = useAuth()
  const { data, isLoading } = useUsers()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const hardDelete = useHardDeleteUser()
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()

  async function handleCreate(values: Record<string, unknown>) {
    try {
      await createMutation.mutateAsync(values as any)
      message.success('User created')
      setCreating(false)
      form.resetFields()
    } catch {
      message.error('Failed to create user')
    }
  }

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Admin',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (v: boolean, row: User) => (
        <Switch
          checked={v}
          onChange={() =>
            updateMutation
              .mutateAsync({ id: row.id, payload: { is_admin: !v } })
              .catch(() => message.error('Failed to update user'))
          }
        />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean, row: User) => (
        <Switch
          checked={v}
          onChange={() =>
            updateMutation
              .mutateAsync({ id: row.id, payload: { is_active: !v } })
              .then(() => message.success(v ? 'User deactivated' : 'User activated'))
              .catch(() => message.error('Failed to update user'))
          }
        />
      ),
    },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v?.slice(0, 10) },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, row: User) => (
        <Popconfirm
          title={`Permanently delete ${row.username}?`}
          description="This cannot be undone. The user will be removed from the database."
          okText="Delete"
          okButtonProps={{ danger: true }}
          disabled={row.id === currentUser?.id}
          onConfirm={() =>
            hardDelete
              .mutateAsync(row.id)
              .then(() => message.success('User deleted'))
              .catch(() => message.error('Failed to delete user'))
          }
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={row.id === currentUser?.id}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
          New User
        </Button>
      </div>
      <Table dataSource={data?.items ?? []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title="New User"
        open={creating}
        onCancel={() => { setCreating(false); form.resetFields() }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="full_name" label="Full Name">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="is_admin" label="Admin" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div>
      <Typography.Title level={3}>Settings</Typography.Title>
      <Tabs items={[{ key: 'users', label: 'Users', children: <UsersTab /> }]} />
    </div>
  )
}
