import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './admin-sidebar'
import { AdminTopbar } from './admin-topbar'

const COLLAPSED_STORAGE_KEY = 'cinebook_admin_sidebar_collapsed'

export function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next))
      } catch {
        // Ignored
      }
      return next
    })
  }

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileDrawerOpen])

  return (
    <div className="min-h-screen bg-background text-foreground flex antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Desktop Persistent Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileDrawer={false}
      />

      {/* Mobile / Tablet Drawer */}
      <AdminSidebar
        isMobileDrawer={true}
        isOpenMobile={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <AdminTopbar
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        {/* Main Content Area */}
        <main
          id="admin-main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto animate-in fade-in duration-200"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
