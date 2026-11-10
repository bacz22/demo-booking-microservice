import { apiClient } from '@/lib/api-client'

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_EXPIRED'
  | 'PAYMENT_REFUNDED'

export interface AppNotification {
  id: string
  userId: string
  bookingId: string | null
  type: NotificationType
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

export interface NotificationPage {
  content: AppNotification[]
  page: number
  pageSize: number
  totalElements: number
}

class NotificationApiService {
  private readonly baseUrl = '/notifications'

  // X-User-Id do API Gateway gắn từ JWT
  private headers() {
    return {}
  }

  async getMine(page = 0, pageSize = 10): Promise<NotificationPage> {
    return apiClient.get<NotificationPage>(`${this.baseUrl}/me?page=${page}&pageSize=${pageSize}`, {
      headers: this.headers(),
    })
  }

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ unread: number }>(`${this.baseUrl}/me/unread-count`, {
      headers: this.headers(),
    })
    return res.unread
  }

  async markRead(id: string): Promise<void> {
    await apiClient.post<void>(`${this.baseUrl}/${id}/read`, undefined, { headers: this.headers() })
  }

  async markAllRead(): Promise<void> {
    await apiClient.post<unknown>(`${this.baseUrl}/me/read-all`, undefined, { headers: this.headers() })
  }
}

export const notificationApiService = new NotificationApiService()
