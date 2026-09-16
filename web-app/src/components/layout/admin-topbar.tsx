import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  Shield,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

interface AdminTopbarProps {
  onOpenMobileMenu?: () => void
}

export function AdminTopbar({ onOpenMobileMenu }: AdminTopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName = user?.fullName || 'Quản trị viên'
  const userInitials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/70 bg-card/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left Area: Mobile Menu Trigger & System Indicator */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          onClick={onOpenMobileMenu}
          aria-label="Mở thanh điều hướng"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Badge
          variant="outline"
          className="hidden sm:inline-flex items-center gap-1.5 py-0.5 px-2 bg-primary/10 text-primary border-primary/25 text-[11px] font-bold"
        >
          <Shield className="w-3 h-3" />
          <span>Khu Vực Quản Trị</span>
        </Badge>
      </div>

      {/* Right Area: Actions, Theme, "Về Website", Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Link back to customer website */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
        >
          <Link to="/" title="Quay lại giao diện đặt vé khách hàng">
            <span>Về Website</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 py-1 pl-1 pr-2.5 transition-all hover:bg-secondary hover:border-primary/40 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            aria-label={`Menu quản trị của ${displayName}`}
          >
            <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                userInitials
              )}
            </div>

            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-foreground max-w-[120px] truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                ROLE_ADMIN
              </span>
            </div>

            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-150', isUserMenuOpen && 'rotate-180')} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-3 py-2.5 border-b border-border/50">
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'demo@cinebook.vn'}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-black text-primary">
                  <Shield className="h-2.5 w-2.5" />
                  <span>Quản trị viên Hệ thống</span>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Hồ sơ cá nhân</span>
                </Link>

                <Link
                  to="/"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="sm:hidden flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  <span>Về Website Khách Hàng</span>
                </Link>
              </div>

              <div className="border-t border-border/50 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Đăng xuất Quản trị</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AdminTopbar
