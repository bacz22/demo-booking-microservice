import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, LogIn, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'

export default function ForbiddenPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSwitchAccount = () => {
    logout()
    navigate('/login?returnUrl=/admin')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background cinematic glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full bg-card border border-border/80 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-destructive/15 text-destructive border border-destructive/25">
            Lỗi 403 — Quyền truy cập bị từ chối
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
            Khu vực dành cho Quản trị viên
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tài khoản hiện tại của bạn không có vai trò <code className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-xs font-semibold">ROLE_ADMIN</code> để truy cập trang quản trị CineBook Console.
          </p>
        </div>

        {user && (
          <div className="rounded-xl border border-border/60 bg-secondary/40 p-3 text-left flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user.fullName?.charAt(0) || 'U'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{user.fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            asChild
            variant="outline"
            className="flex-1 rounded-xl gap-2 cursor-pointer"
          >
            <Link to="/">
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>
          </Button>

          <Button
            onClick={handleSwitchAccount}
            variant="primary"
            className="flex-1 rounded-xl gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Đổi Tài Khoản</span>
          </Button>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang trước</span>
          </button>
        </div>
      </div>
    </div>
  )
}
