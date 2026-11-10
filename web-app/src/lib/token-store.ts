/**
 * Lưu cặp token đăng nhập (access + refresh) trong localStorage và báo cho AuthProvider
 * khi phiên hết hạn (refresh thất bại) để chuyển về trạng thái chưa đăng nhập.
 */

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const STORAGE_KEY = 'cinebook_auth_tokens'
const EXPIRED_EVENT = 'cinebook:session-expired'

export const tokenStore = {
  get(): AuthTokens | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.accessToken && parsed?.refreshToken ? parsed : null
    } catch {
      return null
    }
  },

  set(tokens: AuthTokens) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
    } catch {
      // private mode: chỉ giữ trong phiên hiện tại không được, bỏ qua
    }
  },

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignored
    }
  },

  /** Gọi khi refresh token không còn dùng được. */
  notifyExpired() {
    this.clear()
    window.dispatchEvent(new Event(EXPIRED_EVENT))
  },

  onExpired(listener: () => void): () => void {
    window.addEventListener(EXPIRED_EVENT, listener)
    return () => window.removeEventListener(EXPIRED_EVENT, listener)
  },
}
