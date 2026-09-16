import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface AdminPageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  lastUpdated?: string
  actions?: React.ReactNode
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs = [{ label: 'Admin', href: '/admin' }],
  lastUpdated,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-border/50">
      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Đường dẫn trang" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />}
                {isLast || !item.href ? (
                  <span className="font-semibold text-foreground truncate max-w-[200px]" aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.href}
                    className="hover:text-foreground transition-colors truncate max-w-[150px]"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            )
          })}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
          {lastUpdated && (
            <p className="text-[11px] text-muted-foreground/80">
              Cập nhật gần nhất: <span className="font-medium text-foreground/80">{lastUpdated}</span>
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  )
}

export default AdminPageHeader
