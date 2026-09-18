import { apiClient } from '@/lib/api-client'
import type {
  BackendBookingResponse,
  BackendSeatAvailabilityResponse,
  CreateBookingRequest,
  BookingHistoryItem,
} from '@/types/booking'
import type { BackendPageResponse } from '@/services/theater-api.service'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const DEFAULT_USER_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

/**
 * Lấy User UUID hợp lệ cho các request gọi tới Booking Service.
 * Ưu tiên user đăng nhập trong localStorage, fallback sang UUID demo.
 */
export function getCurrentUserUuid(): string {
  try {
    const raw = localStorage.getItem('cinebook_user')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.id && UUID_REGEX.test(parsed.id)) {
        return parsed.id
      }
    }
  } catch {
    // Bỏ qua lỗi đọc localStorage
  }
  return DEFAULT_USER_UUID
}

/**
 * Sinh chuỗi Idempotency Key định dạng UUID phiên bản 4
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

class BookingApiService {
  private readonly baseUrl = '/bookings'

  /**
   * Lấy sơ đồ ghế thời gian thực (real-time availability) của suất chiếu.
   * Gửi X-User-Id để backend nhận diện ghế do chính user đang giữ (HELD_BY_ME).
   */
  async getShowtimeSeats(showtimeId: string): Promise<BackendSeatAvailabilityResponse> {
    const userId = getCurrentUserUuid()
    return apiClient.get<BackendSeatAvailabilityResponse>(
      `${this.baseUrl}/showtimes/${showtimeId}/seats`,
      {
        headers: {
          'X-User-Id': userId,
        },
      }
    )
  }

  /**
   * Giữ ghế tạm thời (Hold Seats) trong 300 giây (5 phút).
   * Yêu cầu Idempotency-Key để chống double-booking hoặc retry an toàn.
   */
  async holdSeats(
    data: CreateBookingRequest,
    idempotencyKey = generateIdempotencyKey()
  ): Promise<BackendBookingResponse> {
    const userId = getCurrentUserUuid()
    return apiClient.post<BackendBookingResponse>(
      `${this.baseUrl}/hold`,
      data,
      {
        headers: {
          'X-User-Id': userId,
          'Idempotency-Key': idempotencyKey,
        },
      }
    )
  }

  /**
   * Xác nhận thanh toán (Mock payment confirm) cho đơn vé.
   * Backend sẽ chuyển trạng thái sang CONFIRMED và ghế sang SOLD.
   */
  async confirmBooking(bookingId: string): Promise<BackendBookingResponse> {
    const userId = getCurrentUserUuid()
    return apiClient.post<BackendBookingResponse>(
      `${this.baseUrl}/${bookingId}/confirm`,
      undefined,
      {
        headers: {
          'X-User-Id': userId,
        },
      }
    )
  }

  /**
   * Hủy đơn giữ chỗ vé chủ động.
   * Giải phóng ngay lập tức Redis key và chuyển trạng thái sang CANCELLED.
   */
  async cancelBooking(bookingId: string): Promise<BackendBookingResponse> {
    const userId = getCurrentUserUuid()
    return apiClient.post<BackendBookingResponse>(
      `${this.baseUrl}/${bookingId}/cancel`,
      undefined,
      {
        headers: {
          'X-User-Id': userId,
        },
      }
    )
  }

  /**
   * Lấy chi tiết đơn đặt vé theo ID.
   */
  async getBookingById(bookingId: string): Promise<BackendBookingResponse> {
    const userId = getCurrentUserUuid()
    return apiClient.get<BackendBookingResponse>(
      `${this.baseUrl}/${bookingId}`,
      {
        headers: {
          'X-User-Id': userId,
        },
      }
    )
  }

  /**
   * Lấy danh sách lịch sử đơn vé của người dùng hiện tại (phân trang).
   */
  async getMyBookings(
    page = 0,
    pageSize = 20
  ): Promise<BackendPageResponse<BackendBookingResponse>> {
    const userId = getCurrentUserUuid()
    return apiClient.get<BackendPageResponse<BackendBookingResponse>>(
      `${this.baseUrl}/me?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          'X-User-Id': userId,
        },
      }
    )
  }

  /**
   * Helper chuyển đổi BackendBookingResponse thành BookingHistoryItem hiển thị trên giao diện
   */
  mapBackendBookingToHistoryItem(
    b: BackendBookingResponse,
    meta?: { movieTitle?: string; poster?: string; cinema?: string; room?: string; showtime?: string }
  ): BookingHistoryItem {
    const seatsList = (b.seats || []).map((s) => `${s.rowLabel}${s.seatNumber}`)
    return {
      id: b.id,
      bookingCode: b.bookingCode,
      movieTitle: meta?.movieTitle || 'Vé xem phim CineBook',
      poster: meta?.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
      cinema: meta?.cinema || 'Rạp CineBook Cinema',
      room: meta?.room || 'Phòng chiếu tiêu chuẩn',
      showtime: meta?.showtime || new Date(b.createdAt).toLocaleString('vi-VN'),
      seats: seatsList,
      total: Number(b.totalAmount),
      status: b.status === 'PENDING_PAYMENT' ? 'PENDING' : b.status,
      createdAt: new Date(b.createdAt).toLocaleDateString('vi-VN'),
      expiresAt: b.expiresAt,
      confirmedAt: b.confirmedAt || undefined,
      cancelledAt: b.cancelledAt || undefined,
      cancelReason: b.cancelReason || undefined,
      showtimeId: b.showtimeId,
      movieId: b.movieId,
      theaterId: b.theaterId,
      auditoriumId: b.auditoriumId,
    }
  }
}

export const bookingApiService = new BookingApiService()
