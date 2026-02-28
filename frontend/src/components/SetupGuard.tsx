import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { getSetupStatus } from '../api/setup'

export default function SetupGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    getSetupStatus()
      .then(({ needs_setup }) => {
        if (needs_setup && location.pathname !== '/setup') {
          navigate('/setup', { replace: true })
        }
      })
      .catch(() => {
        // If the check fails, proceed normally (server may be starting up)
      })
      .finally(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return <>{children}</>
}
