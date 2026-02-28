import { useState } from 'react'
import { Form, Input, Button, Card, Typography, Steps, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { completeSetup } from '../api/setup'

const { Text, Title, Paragraph } = Typography

interface SetupFormValues {
  full_name: string
  username: string
  email: string
  password: string
  confirm_password: string
}

export default function SetupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<SetupFormValues>()

  async function onFinish(values: SetupFormValues) {
    setLoading(true)
    try {
      await completeSetup({
        full_name: values.full_name,
        username: values.username,
        email: values.email,
        password: values.password,
      })
      message.success('Setup complete! Please log in with your new account.')
      navigate('/login')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (detail?.includes('Username')) message.error('That username is already taken.')
      else if (detail?.includes('Email')) message.error('That email is already registered.')
      else message.error('Setup failed. Please try again.')
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
        padding: 24,
      }}
    >
      <Card style={{ width: 480, boxShadow: '0 8px 40px rgba(22,119,255,0.12)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/elementa-logo.png"
            alt="Elementa"
            style={{ height: 64, marginBottom: 10, objectFit: 'contain' }}
          />
          <div
            className="brand-title"
            style={{ fontSize: 32, color: '#1677ff', marginBottom: 4, lineHeight: 1.1 }}
          >
            Elementa
          </div>
          <Text type="secondary" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 11 }}>
            First-Time Setup
          </Text>
        </div>

        <Steps
          size="small"
          current={0}
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Create Admin' },
            { title: 'Log In' },
            { title: 'Start Tracking' },
          ]}
        />

        <Paragraph type="secondary" style={{ marginBottom: 20, fontSize: 13 }}>
          Create your administrator account. This only happens once — future restarts will not repeat this step.
        </Paragraph>

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Full name required' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Jane Smith" autoFocus />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Username required' },
              { min: 3, message: 'At least 3 characters' },
              { pattern: /^[a-zA-Z0-9_.\-]+$/, message: 'Letters, numbers, _ . - only' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="jsmith" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="jane@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Password required' },
              { min: 8, message: 'At least 8 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Minimum 8 characters" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Repeat password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Create Account & Continue
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
