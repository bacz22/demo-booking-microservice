import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'

/** Route guard cho trang cần đăng nhập (đặt vé, thanh toán, vé của tôi, hồ sơ). */
export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnUrl=${returnUrl}`} state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RequireAuth
