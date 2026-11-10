import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Film,
  Search,
  Menu,
  X,
  LogIn,
  User,
  Crown,
  LogOut,
  Ticket,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationBell } from '@/components/layout/notification-bell'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Phim', href: '/movies' },
  { label: 'Rạp chiếu', href: '/cinemas' },
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { user, isAuthenticated, logout } = useAuth()
  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'Khách hàng')
  const userInitials = (user?.fullName || user?.email || 'CB').trim().slice(0, 2).toUpperCase()

  // Đóng menu khi người dùng click vào link chuyển trang
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  // Đóng menu khi đổi route trong lúc render (chuẩn React 19)
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  // Đóng menu khi click ra ngoài user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Đóng menu khi nhấn phím Escape (Accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
        setIsUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all"
      aria-label="Điều hướng chính"
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link
          to="/"
          className="flex items-center gap-2 group"
          aria-label="CineBook - Về trang chủ"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-rose-500 shadow-md shadow-primary/25 transition-transform duration-300 group-hover:scale-105">
            <Film className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Cine<span className="text-primary">Book</span>
          </span>
        </Link>

        {/* NAVIGATION LINKS (DESKTOP) */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-secondary text-primary font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* ACTIONS (DESKTOP) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Nút Tìm Kiếm Nhanh */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-full"
          >
            <Link to="/movies" aria-label="Tìm kiếm phim">
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>

          {/* Nút Vé của tôi (khi đã đăng nhập) */}
          {isAuthenticated && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-full gap-1.5"
            >
              <Link to="/my-bookings">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs">Vé của tôi</span>
              </Link>
            </Button>
          )}

          <NotificationBell />

          {/* Nút chuyển đổi giao diện Dark / Light */}
          <ThemeToggle />

          {/* TRẠNG THÁI NGƯỜI DÙNG: ĐÃ ĐĂNG NHẬP HOẶC CHƯA */}
          {isAuthenticated && user ? (
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full border border-border/60 bg-secondary/40 py-1 pl-1 pr-3 transition-all hover:bg-secondary/75 hover:border-primary/40 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label={`Menu tài khoản của ${displayName}`}
              >
                <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground max-w-[110px] truncate">
                  {displayName}
                </span>
                <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', isUserMenuOpen && 'rotate-180')} />
              </button>

              {/* Menu Thả Xuống (Dropdown Menu) */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="px-3 py-2 border-b border-border/40">
                    <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email || ''}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-black text-amber-400">
                      <Crown className="h-2.5 w-2.5" />
                      <span>{user.membershipTier || 'VIP Diamond'}</span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>Hồ sơ &amp; Hội viên</span>
                    </Link>

                    <Link
                      to="/my-bookings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
                    >
                      <Ticket className="h-3.5 w-3.5 text-primary" />
                      <span>Vé của tôi</span>
                    </Link>

                    {user.roles?.includes('ADMIN') && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                        <span>Trang quản trị</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-border/40 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button asChild variant="primary" size="sm" className="gap-1.5 ml-1">
              <Link to="/login">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Đăng nhập</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Khối điều khiển trên Mobile: Search, Theme Toggle & Menu Trigger */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link to="/movies" aria-label="Tìm kiếm phim">
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>

          <NotificationBell />

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
            className="text-foreground"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Menu thả xuống trên Mobile */}
      {isMobileMenuOpen && (
        <div
          ref={menuRef}
          className="border-b border-border/40 bg-background/95 backdrop-blur-xl px-4 pt-2 pb-6 md:hidden animate-in fade-in slide-in-from-top-2 duration-200 space-y-4"
        >
          {/* Header người dùng nếu đã đăng nhập trên Mobile */}
          {isAuthenticated && user && (
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/20 border border-primary/30 shrink-0 flex items-center justify-center text-xs font-bold text-primary">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email || ''}</p>
              </div>
              <span className="shrink-0 rounded-md bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-black text-amber-400">
                {user.membershipTier || 'VIP'}
              </span>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            <NavLink
              to="/my-bookings"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )
              }
            >
              Vé của tôi
            </NavLink>

            <NavLink
              to="/profile"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )
              }
            >
              Hồ sơ &amp; Hội viên
            </NavLink>

            {isAuthenticated && user?.roles?.includes('ADMIN') && (
              <NavLink
                to="/admin"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-base font-semibold transition-colors text-primary',
                    isActive
                      ? 'bg-primary/15'
                      : 'hover:bg-primary/10'
                  )
                }
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Trang quản trị</span>
              </NavLink>
            )}
          </div>

          <div className="pt-3 border-t border-border/40 space-y-3">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-sm font-medium text-muted-foreground">Chế độ giao diện</span>
              <ThemeToggle showLabel={false} />
            </div>

            {isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                onClick={() => {
                  closeMobileMenu()
                  logout()
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Đăng xuất</span>
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="w-full justify-center" onClick={closeMobileMenu}>
                  <Link to="/register">Đăng ký</Link>
                </Button>
                <Button asChild variant="primary" className="w-full justify-center gap-2" onClick={closeMobileMenu}>
                  <Link to="/login">
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    <span>Đăng nhập</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
