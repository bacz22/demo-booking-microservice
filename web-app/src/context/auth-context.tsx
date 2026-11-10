import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { LoginFormData, RegisterFormData } from '@/types/auth'
import { toast } from '@/lib/toast'
import { ApiClientError } from '@/lib/api-client'
import { tokenStore } from '@/lib/token-store'
import { authApiService, type BackendAuthUser } from '@/services/auth-api.service'

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

const STORAGE_KEY = 'cinebook_user'
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'

/** Gộp thông tin thật từ auth-service với các trường hiển thị chỉ có ở client (avatar, hạng thành viên). */
function toAuthUser(u: BackendAuthUser, previous?: AuthUser | null): AuthUser {
  const keep = previous?.id === u.id ? previous : null
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone ?? undefined,
    roles: u.roles,
    avatarUrl: keep?.avatarUrl || DEFAULT_AVATAR,
    membershipTier: keep?.membershipTier || 'MEMBER',
    points: keep?.points ?? 0,
    joinDate: keep?.joinDate || `Tháng ${new Date(u.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}`,
  }
}

function readStoredUser(): AuthUser | null {
  // Chỉ coi là đã đăng nhập khi còn token; user lưu kèm để hiển thị ngay khi tải trang
  if (!tokenStore.get()) return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : null
    return parsed && typeof parsed.id === 'string' ? (parsed as AuthUser) : null
  } catch {
    return null
  }
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError) {
    if (err.code === 'NETWORK_ERROR' || err.status === 0) return 'Không kết nối được máy chủ. Vui lòng thử lại.'
    if (err.code === 'RATE_LIMITED') return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.'
    return err.message || fallback
  }
  return fallback
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
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

  // Refresh token hết hạn/bị thu hồi → đăng xuất phía client
  useEffect(
    () =>
      tokenStore.onExpired(() => {
        setUser((prev) => {
          if (prev) toast.info('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
          return null
        })
      }),
    []
  )

  // Tải lại thông tin user (roles mới nhất) khi mở trang
  useEffect(() => {
    if (!tokenStore.get()) return
    authApiService
      .me()
      .then((u) => setUser((prev) => toAuthUser(u, prev)))
      .catch(() => {
        // 401 sau khi refresh thất bại đã được xử lý qua onExpired; lỗi mạng thì giữ user cũ
      })
  }, [])

  // Xử lý đăng nhập
  const login = async (data: LoginFormData): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await authApiService.login(data.email.trim(), data.password)
      tokenStore.set({ accessToken: res.accessToken, refreshToken: res.refreshToken })
      const loggedUser = toAuthUser(res.user, user)
      setUser(loggedUser)
      toast.success(`Chào mừng bạn trở lại, ${loggedUser.fullName}!`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý đăng ký
  const register = async (data: RegisterFormData): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await authApiService.register({
        email: data.email.trim(),
        password: data.password,
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || undefined,
      })
      tokenStore.set({ accessToken: res.accessToken, refreshToken: res.refreshToken })
      const newUser = toAuthUser(res.user)
      setUser(newUser)
      toast.success(`Đăng ký thành công! Chào mừng ${newUser.fullName} đến với CineBook.`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Đăng ký không thành công. Vui lòng thử lại.'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý đăng xuất
  const logout = () => {
    const tokens = tokenStore.get()
    if (tokens) {
      // Thu hồi refresh token phía server; lỗi mạng không chặn việc đăng xuất
      authApiService.logout(tokens.refreshToken).catch(() => {})
    }
    tokenStore.clear()
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
