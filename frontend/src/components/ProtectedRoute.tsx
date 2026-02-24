import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spin } from 'antd'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spin fullscreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
