import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { Skeleton } from '@/components/ui/skeleton'

interface RequireAdminProps {
  children?: React.ReactNode
}

/**
 * Route guard for Admin routes.
 * Distinguishes between loading, unauthenticated, and unauthorized states.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex w-64 border-r border-border/60 flex-col p-4 space-y-4 bg-card/40">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-2 pt-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Content area skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 border-b border-border/60 px-6 flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
          <div className="p-6 space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated -> redirect to login with returnUrl
  if (!isAuthenticated || !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnUrl=${returnUrl}`} state={{ from: location }} replace />
  }

  // Authenticated but does not have ADMIN role -> redirect to 403 Forbidden
  if (!hasRole('ADMIN')) {
    return <Navigate to="/forbidden" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RequireAdmin
