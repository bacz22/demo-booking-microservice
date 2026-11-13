import { apiClient } from '@/lib/api-client'

/** UserView từ auth-service */
export interface BackendAuthUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  roles: Array<'USER' | 'ADMIN'>
  status?: 'ACTIVE' | 'LOCKED'
  createdAt: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: BackendAuthUser
}

class AuthApiService {
  private readonly baseUrl = '/auth'

  login(email: string, password: string): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>(`${this.baseUrl}/login`, { email, password })
  }

  register(data: { email: string; password: string; fullName: string; phone?: string }): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>(`${this.baseUrl}/register`, data)
  }

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post<void>(`${this.baseUrl}/logout`, { refreshToken })
  }

  me(): Promise<BackendAuthUser> {
    return apiClient.get<BackendAuthUser>(`${this.baseUrl}/me`)
  }

  updateProfile(data: { fullName: string; phone?: string }): Promise<BackendAuthUser> {
    return apiClient.put<BackendAuthUser>(`${this.baseUrl}/me`, data)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post<void>(`${this.baseUrl}/me/password`, { currentPassword, newPassword })
  }
}

export const authApiService = new AuthApiService()
