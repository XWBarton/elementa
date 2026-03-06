import { Layout, Menu, Button, Typography, Space, Avatar, Tooltip, message } from 'antd'
import {
  ExperimentOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  AlignLeftOutlined,
  CloudServerOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined,
  DownloadOutlined,
  FileTextOutlined,
  RetweetOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { uploadAvatar, getAvatarBlob } from '../../api/users'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/extraction-runs', icon: <ExperimentOutlined />, label: 'Extractions' },
  { key: '/pcr-runs', icon: <ThunderboltOutlined />, label: 'PCR' },
  { key: '/sanger-runs', icon: <AlignLeftOutlined />, label: 'Sanger' },
  { key: '/library-prep-runs', icon: <DatabaseOutlined />, label: 'Library Prep' },
  { key: '/ngs-runs', icon: <CloudServerOutlined />, label: 'NGS Runs' },
  { key: '/protocols', icon: <FileTextOutlined />, label: 'Protocols' },
  { key: '/primers', icon: <RetweetOutlined />, label: 'Primers' },
  { key: '/export', icon: <DownloadOutlined />, label: 'Export' },
]

const adminItem = { key: '/admin', icon: <SettingOutlined />, label: 'Settings' }

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, refreshUser } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let url: string | null = null
    if (user?.avatar_filename) {
      getAvatarBlob(user.id)
        .then((u) => { url = u; setAvatarUrl(u) })
        .catch(() => setAvatarUrl(null))
    } else {
      setAvatarUrl(null)
    }
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [user?.id, user?.avatar_filename])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadAvatar(file)
      await refreshUser()
      message.success('Profile photo updated')
    } catch {
      message.error('Failed to upload photo')
    }
    e.target.value = ''
  }

  const allItems = user?.is_admin ? [...menuItems, adminItem] : menuItems

  const selectedKey =
    allItems
      .slice()
      .reverse()
      .find((item) => item.key !== '/' ? location.pathname.startsWith(item.key) : location.pathname === '/')
      ?.key ?? '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #e6f0ff' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e6f0ff', textAlign: 'center' }}>
          <img
            src="/elementa-logo.png"
            alt="Elementa"
            style={{ height: 48, marginBottom: 6, objectFit: 'contain' }}
          />
          <div className="brand-title" style={{ fontSize: 22, fontWeight: 700, color: '#1677ff', lineHeight: 1.2 }}>
            Elementa
          </div>
          <Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Sample Tracking
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={allItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            borderBottom: '1px solid #e6f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Space>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <Tooltip title="Click to change profile photo">
              <Avatar
                src={avatarUrl || undefined}
                icon={!avatarUrl ? <UserOutlined /> : undefined}
                style={{ backgroundColor: '#1677ff', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              />
            </Tooltip>
            <Text strong>{user?.full_name || user?.username}</Text>
            {user?.is_admin && (
              <Text type="secondary" style={{ fontSize: 12 }}>(Admin)</Text>
            )}
            <Button icon={<LogoutOutlined />} type="text" onClick={logout}>
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f0f5ff', overflowY: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
