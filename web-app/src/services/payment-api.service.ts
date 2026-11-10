import { apiClient } from '@/lib/api-client'
import { generateIdempotencyKey, getCurrentUserUuid } from '@/services/booking-api.service'
import type {
  BackendPaymentResponse,
  BackendPaymentStatus,
  CompletePaymentRequest,
} from '@/types/payment'

const FINAL_STATUSES: BackendPaymentStatus[] = ['SUCCEEDED', 'FAILED', 'REFUNDED']

export class PaymentPollTimeoutError extends Error {
  constructor(public readonly lastPayment: BackendPaymentResponse) {
    super('Thanh toán đang được xử lý, vui lòng kiểm tra lại sau.')
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class PaymentApiService {
  private readonly baseUrl = '/payments'

  private headers(extra?: Record<string, string>) {
    return { 'X-User-Id': getCurrentUserUuid(), ...extra }
  }

  /** Tạo payment cho booking. Idempotency-Key giữ nguyên khi bấm lại để không tạo trùng. */
  async createPayment(
    data: { bookingId: string; amount: number; currency?: string; method?: string },
    idempotencyKey = generateIdempotencyKey()
  ): Promise<BackendPaymentResponse> {
    return apiClient.post<BackendPaymentResponse>(
      this.baseUrl,
      { currency: 'VND', method: 'MOCK', ...data },
      { headers: this.headers({ 'Idempotency-Key': idempotencyKey }) }
    )
  }

  /** Kết quả từ cổng thanh toán (mock). success=true trả về PROCESSING; kết quả cuối đến qua Saga Kafka. */
  async completePayment(id: string, data: CompletePaymentRequest): Promise<BackendPaymentResponse> {
    return apiClient.post<BackendPaymentResponse>(`${this.baseUrl}/${id}/complete`, data, {
      headers: this.headers(),
    })
  }

  async getPayment(id: string): Promise<BackendPaymentResponse> {
    return apiClient.get<BackendPaymentResponse>(`${this.baseUrl}/${id}`, { headers: this.headers() })
  }

  isFinal(status: BackendPaymentStatus): boolean {
    return FINAL_STATUSES.includes(status)
  }

  /** Poll tới khi payment ở trạng thái cuối (SUCCEEDED/FAILED/REFUNDED). */
  async pollUntilFinal(
    id: string,
    { intervalMs = 1000, timeoutMs = 30000 }: { intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<BackendPaymentResponse> {
    const deadline = Date.now() + timeoutMs
    let payment = await this.getPayment(id)
    while (!this.isFinal(payment.status)) {
      if (Date.now() >= deadline) throw new PaymentPollTimeoutError(payment)
      await sleep(intervalMs)
      payment = await this.getPayment(id)
    }
    return payment
  }
}

export const paymentApiService = new PaymentApiService()
