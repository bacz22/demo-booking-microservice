import { useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Film,
  Building2,
  Calendar,
  Ticket,
  CreditCard,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItemDef {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  badgeVariant?: 'default' | 'destructive' | 'warning'
}

export interface NavGroupDef {
  title: string
  items: NavItemDef[]
}

const NAVIGATION_GROUPS: NavGroupDef[] = [
  {
    title: 'Tổng quan',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Nội dung',
    items: [
      {
        label: 'Quản lý phim',
        href: '/admin/movies',
        icon: Film,
      },
    ],
  },
  {
    title: 'Vận hành rạp',
    items: [
      {
        label: 'Cụm rạp & Phòng',
        href: '/admin/theaters',
        icon: Building2,
      },
      {
        label: 'Lịch suất chiếu',
        href: '/admin/showtimes',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'Giao dịch',
    items: [
      {
        label: 'Đơn đặt vé',
        href: '/admin/bookings',
        icon: Ticket,
        badge: 5,
        badgeVariant: 'warning',
      },
      {
        label: 'Thanh toán',
        href: '/admin/payments',
        icon: CreditCard,
        badge: 8,
        badgeVariant: 'destructive',
      },
    ],
  },
  {
    title: 'Người dùng',
    items: [
      {
        label: 'Khách hàng & Role',
        href: '/admin/users',
        icon: Users,
      },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      {
        label: 'Vận hành & Kafka',
        href: '/admin/operations',
        icon: Activity,
        badge: 2,
        badgeVariant: 'destructive',
      },
    ],
  },
]

interface AdminSidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileDrawer?: boolean
  isOpenMobile?: boolean
  onCloseMobile?: () => void
}

export function AdminSidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileDrawer = false,
  isOpenMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  // Handle ESC key for mobile drawer
  useEffect(() => {
    if (!isMobileDrawer || !isOpenMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileDrawer, isOpenMobile, onCloseMobile])

  const content = (
    <div className="flex h-full flex-col justify-between overflow-hidden bg-card/95 backdrop-blur-xl border-r border-border/70">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/60 shrink-0">
        <Link
          to="/admin"
          className={cn(
            'flex items-center gap-2.5 font-heading font-black tracking-tight transition-all',
            isCollapsed && !isMobileDrawer ? 'justify-center w-full' : ''
          )}
          title="CineBook Admin Console"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 shrink-0">
            <Film className="h-5 w-5" />
          </div>

          {(!isCollapsed || isMobileDrawer) && (
            <div className="flex flex-col leading-none">
              <span className="text-base font-black text-foreground tracking-tight">
                CINE<span className="text-primary">BOOK</span>
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                Admin Console
              </span>
            </div>
          )}
        </Link>

        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav
        aria-label="Admin navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-border"
      >
        {NAVIGATION_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {(!isCollapsed || isMobileDrawer) && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/admin'}
                    onClick={() => {
                      if (isMobileDrawer) {
                        onCloseMobile?.()
                      }
                    }}
                    title={isCollapsed && !isMobileDrawer ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 relative',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 font-bold'
                          : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
                        isCollapsed && !isMobileDrawer ? 'justify-center px-2' : ''
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                          )}
                          aria-hidden="true"
                        />

                        {(!isCollapsed || isMobileDrawer) && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}

                        {(!isCollapsed || isMobileDrawer) && item.badge !== undefined && (
                          <span
                            className={cn(
                              'ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black rounded-full leading-none',
                              isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : item.badgeVariant === 'destructive'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Collapsed dot notification */}
                        {isCollapsed && !isMobileDrawer && item.badge !== undefined && (
                          <span
                            className={cn(
                              'absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-card',
                              item.badgeVariant === 'destructive' ? 'bg-rose-500' : 'bg-amber-500'
                            )}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Toggle Desktop Sidebar */}
      {!isMobileDrawer && onToggleCollapse && (
        <div className="p-3 border-t border-border/60 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer',
              isCollapsed ? 'justify-center px-2' : ''
            )}
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Thu gọn menu</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )

  // Mobile Drawer with Scrim
  if (isMobileDrawer) {
    if (!isOpenMobile) return null

    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Scrim Overlay */}
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />

        {/* Sliding Panel */}
        <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
          {content}
        </div>
      </div>
    )
  }

  // Desktop Static Sidebar
  return (
    <aside
      className={cn(
        'hidden lg:block shrink-0 transition-all duration-300 ease-in-out h-screen sticky top-0 z-30',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {content}
    </aside>
  )
}

export default AdminSidebar
