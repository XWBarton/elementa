import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const { Text } = Typography

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  async function onFinish({ username, password }: { username: string; password: string }) {
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      message.error('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e8f0ff 0%, #c7d9ff 100%)',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 8px 40px rgba(22,119,255,0.12)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/elementa-logo.png"
            alt="Elementa"
            style={{ height: 72, marginBottom: 12, objectFit: 'contain' }}
          />
          <div
            className="brand-title"
            style={{ fontSize: 36, color: '#1677ff', marginBottom: 6, lineHeight: 1.1 }}
          >
            Elementa
          </div>
          <Text type="secondary" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 11 }}>
            Sample Tracking
          </Text>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Username required' }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" autoFocus onPressEnter={() => form.submit()} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Password required' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" onPressEnter={() => form.submit()} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
