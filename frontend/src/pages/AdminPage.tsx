import { useState, useEffect } from 'react'
import { Alert, Button, Form, Input, Modal, Space, Switch, Table, Tabs, Typography, message } from 'antd'
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useUsers, useCreateUser, useUpdateUser } from '../hooks/useUsers'
import { useAuth } from '../context/AuthContext'
import { User } from '../types'
import { getSettings, saveSetting, testTessera } from '../api/admin'
import { useQuery } from '@tanstack/react-query'

function UsersTab() {
  const { user: currentUser } = useAuth()
  const { data, isLoading } = useUsers()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
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

function IntegrationsTab() {
  const { data: settings, refetch } = useQuery({ queryKey: ['tessera-settings'], queryFn: getSettings })
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'ok' | 'error' | null>(null)
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    if (settings) {
      setUrl(settings.tessera_url || '')
    }
  }, [settings])

  async function handleSave() {
    setSaving(true)
    try {
      await saveSetting('tessera_url', url)
      if (token) await saveSetting('tessera_api_token', token)
      message.success('Settings saved')
      setToken('')
      refetch()
    } catch {
      message.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestStatus(null)
    try {
      await saveSetting('tessera_url', url)
      if (token) await saveSetting('tessera_api_token', token)
      setToken('')
      refetch()
      await testTessera()
      setTestStatus('ok')
      setTestMsg('Connection successful')
    } catch (e: any) {
      setTestStatus('error')
      setTestMsg(e?.response?.data?.detail || 'Connection failed')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
        Connect to a <strong>Tessera</strong> instance to search specimens when adding samples.
        Generate the API token from Tessera's Settings → Integrations tab.
      </Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item label="Tessera URL" extra="Enter the Tessera frontend URL (e.g. http://192.168.1.10:8520)">
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="http://localhost:8520" />
        </Form.Item>
        <Form.Item
          label="API Token"
          extra={settings?.tessera_token_set ? 'A token is currently set. Paste a new one to replace it.' : undefined}
        >
          <Input.Password
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder={settings?.tessera_token_set ? '••••••••' : 'Paste API token from Tessera'}
          />
        </Form.Item>
        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>Save</Button>
          <Button
            loading={testing}
            onClick={handleTest}
            icon={testStatus === 'ok' ? <CheckCircleOutlined /> : testStatus === 'error' ? <CloseCircleOutlined /> : undefined}
          >
            Test Connection
          </Button>
        </Space>
        {testStatus && (
          <Alert
            style={{ marginTop: 12 }}
            type={testStatus === 'ok' ? 'success' : 'error'}
            message={testMsg}
            showIcon
          />
        )}
      </Form>
    </div>
  )
}

function AboutTab() {
  return (
    <div style={{ maxWidth: 540, paddingTop: 8 }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/elementa-logo.png" alt="Elementa" style={{ height: 56, objectFit: 'contain' }} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1677ff', lineHeight: 1.2 }}>Elementa</div>
          <div style={{ fontSize: 13, color: '#888' }}>Version 1.0</div>
        </div>
      </div>
      <Typography.Paragraph style={{ fontStyle: 'italic', color: '#555', borderLeft: '3px solid #e0e0e0', paddingLeft: 12, marginBottom: 24 }}>
        Elementa — refers to basic principles, components, constituents, or foundations.
      </Typography.Paragraph>
      <Typography.Text type="secondary">Created by Xavier Barton</Typography.Text>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div>
      <Typography.Title level={3}>Settings</Typography.Title>
      <Tabs items={[
        { key: 'users', label: 'Users', children: <UsersTab /> },
        { key: 'integrations', label: 'Integrations', children: <IntegrationsTab /> },
        { key: 'about', label: 'About', children: <AboutTab /> },
      ]} />
    </div>
  )
}
