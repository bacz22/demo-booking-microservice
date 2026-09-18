import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { LoginFormData, RegisterFormData } from '@/types/auth'
import { toast } from '@/lib/toast'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone?: string
  avatarUrl?: string
  membershipTier?: 'MEMBER' | 'SILVER' | 'GOLD' | 'DIAMOND'
  points?: number
  joinDate?: string
  roles?: Array<'USER' | 'ADMIN'>
}

export interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginFormData) => Promise<boolean>
  register: (data: RegisterFormData) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => void
  hasRole: (role: 'USER' | 'ADMIN') => boolean
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const DEMO_USER_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

function generateUserUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
}

const STORAGE_KEY = 'cinebook_user'

const DEFAULT_DEMO_USER: AuthUser = {
  id: DEMO_USER_UUID,
  fullName: 'Nguyễn Văn An',
  email: 'demo@cinebook.vn',
  phone: '0912 345 678',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  membershipTier: 'DIAMOND',
  points: 1250,
  joinDate: 'Tháng 03/2024',
  roles: ['USER', 'ADMIN'],
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          const email = typeof parsed.email === 'string' && parsed.email ? parsed.email : 'demo@cinebook.vn'
          const fullName = typeof parsed.fullName === 'string' && parsed.fullName.trim()
            ? parsed.fullName
            : (email.split('@')[0] || 'Khách hàng CineBook')

          const isDemoEmail = email.toLowerCase().trim() === 'demo@cinebook.vn'
          const roles = Array.isArray(parsed.roles) && parsed.roles.length > 0
            ? parsed.roles
            : (isDemoEmail ? ['USER', 'ADMIN'] : ['USER'])

          const validId = parsed.id && UUID_REGEX.test(parsed.id)
            ? parsed.id
            : (isDemoEmail ? DEMO_USER_UUID : generateUserUuid())

          return {
            id: validId,
            fullName,
            email,
            phone: parsed.phone || '0912 345 678',
            avatarUrl: parsed.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
            membershipTier: parsed.membershipTier || 'DIAMOND',
            points: typeof parsed.points === 'number' ? parsed.points : 1250,
            joinDate: parsed.joinDate || 'Tháng 03/2024',
            roles,
          }
        }
      }
    } catch {
      // Bỏ qua nếu lỗi parse localStorage
    }
    return null
  })

  const [isLoading, setIsLoading] = useState(false)

  // Đồng bộ thay đổi user vào localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Bỏ qua lỗi lưu trữ trong môi trường private
    }
  }, [user])

  // Xử lý đăng nhập
  const login = async (data: LoginFormData): Promise<boolean> => {
    setIsLoading(true)
    // Giả lập độ trễ mạng 500ms
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      const isDemo = data.email.toLowerCase().trim() === 'demo@cinebook.vn'
      const loggedUser: AuthUser = isDemo
        ? DEFAULT_DEMO_USER
        : {
            id: generateUserUuid(),
            fullName: data.email.split('@')[0] || 'Khách hàng CineBook',
            email: data.email.trim(),
            phone: '0912 345 678',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
            membershipTier: 'GOLD',
            points: 500,
            joinDate: 'Tháng 09/2026',
            roles: data.email.toLowerCase().includes('admin') ? ['USER', 'ADMIN'] : ['USER'],
          }

      setUser(loggedUser)
      setIsLoading(false)
      toast.success(`Chào mừng bạn trở lại, ${loggedUser.fullName}!`)
      return true
    } catch {
      setIsLoading(false)
      toast.error('Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')
      return false
    }
  }

  // Xử lý đăng ký
  const register = async (data: RegisterFormData): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 600))

    try {
      const newUser: AuthUser = {
        id: generateUserUuid(),
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || '',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
        membershipTier: 'MEMBER',
        points: 100, // Tặng 100 điểm khởi đầu
        joinDate: 'Tháng 09/2026',
        roles: ['USER'],
      }

      setUser(newUser)
      setIsLoading(false)
      toast.success(`Đăng ký thành công! Chào mừng ${newUser.fullName} đến với CineBook.`)
      return true
    } catch {
      setIsLoading(false)
      toast.error('Đăng ký không thành công. Vui lòng thử lại.')
      return false
    }
  }

  // Xử lý đăng xuất
  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignored
    }
    toast.info('Bạn đã đăng xuất khỏi tài khoản.')
  }

  // Cập nhật thông tin profile
  const updateProfile = (data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null))
    toast.success('Đã cập nhật thông tin hồ sơ!')
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      hasRole: (role: 'USER' | 'ADMIN'): boolean => Boolean(user?.roles?.includes(role)),
    }),
    [user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
