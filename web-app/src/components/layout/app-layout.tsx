import { useEffect, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

interface AppLayoutProps {
  children?: ReactNode
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'CineBook — Đặt Vé Xem Phim Trực Tuyến',
  '/movies': 'Danh sách phim | CineBook',
  '/cinemas': 'Hệ thống rạp chiếu | CineBook',
  '/my-bookings': 'Vé của tôi | CineBook',
  '/login': 'Đăng nhập | CineBook',
  '/register': 'Đăng ký tài khoản | CineBook',
  '/forgot-password': 'Quên mật khẩu | CineBook',
  '/profile': 'Thông tin tài khoản | CineBook',
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  useEffect(() => {
    const title = ROUTE_TITLES[location.pathname]
    if (title) {
      document.title = title
    }
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      {/* Responsive Cinematic Navbar */}
      <Navbar />

      {/* Main content slot */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children ?? <Outlet />}
      </main>

      {/* Responsive Cinematic Footer */}
      <Footer />
    </div>
  )
}

export default AppLayout
