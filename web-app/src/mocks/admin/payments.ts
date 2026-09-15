import type {
  AdminPayment,
  PaymentFilterState,
  PaymentPaginationResult,
  PaymentSummary,
} from '@/types/admin-payment'

const STORAGE_KEY = 'cinebook_admin_payments'

const INITIAL_ADMIN_PAYMENTS: AdminPayment[] = [
  {
    id: 'pay-vn-992182',
    bookingId: 'bk-849201',
    bookingCode: 'CB-849201',
    customer: {
      id: 'usr-nguyen-van-a',
      fullName: 'Nguyễn Văn An',
      email: 'nguyen.an@gmail.com',
      phone: '0901234567',
    },
    amount: 435000,
    currency: 'VND',
    method: 'VNPAY',
    status: 'SUCCESS',
    providerRef: 'VNPAY-20260915124981',
    bankCode: 'NCB',
    cardType: 'ATM',
    createdAt: '2026-09-15 14:10:05',
    updatedAt: '2026-09-15 14:15:22',
    paidAt: '2026-09-15 14:15:22',
    timeline: [
      {
        id: 'pt-1',
        step: 'REQUESTED',
        title: 'Khởi tạo thanh toán',
        description: 'Đã sinh URL chuyển hướng cổng VNPAY với số tiền 435.000 VND.',
        timestamp: '2026-09-15 14:10:05',
        actor: 'USER',
      },
      {
        id: 'pt-2',
        step: 'PROCESSING',
        title: 'Khách hàng nhập mã OTP ngân hàng NCB',
        description: 'VNPAY xử lý xác thực giao dịch qua cổng bảo mật 3D-Secure.',
        timestamp: '2026-09-15 14:13:40',
        actor: 'SYSTEM',
        responseCode: '00',
      },
      {
        id: 'pt-3',
        step: 'SUCCESS',
        title: 'Giao dịch thành công',
        description: 'Nhận IPN callback từ VNPAY xác nhận trừ tiền thành công. Mã GD: 14829104.',
        timestamp: '2026-09-15 14:15:22',
        actor: 'SYSTEM',
        responseCode: '00',
      },
    ],
    rawResponse: {
      vnp_Amount: '43500000',
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: 'VNP14829104',
      vnp_CardType: 'ATM',
      vnp_OrderInfo: 'Thanh toan don ve CineBook CB-849201',
      vnp_PayDate: '20260915141522',
      vnp_ResponseCode: '00',
      vnp_TmnCode: 'CINEBOOK_LIVE',
      vnp_TransactionNo: '14829104',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: 'VNPAY-20260915124981',
      vnp_SecureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 [REDACTED]',
    },
  },
  {
    id: 'pay-mo-109283',
    bookingId: 'bk-849202',
    bookingCode: 'CB-849202',
    customer: {
      id: 'usr-tran-thi-b',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@outlook.com',
      phone: '0912345678',
    },
    amount: 330000,
    currency: 'VND',
    method: 'MOMO',
    status: 'SUCCESS',
    providerRef: 'MOMO_20260915_9012',
    cardType: 'E-WALLET',
    createdAt: '2026-09-15 13:38:00',
    updatedAt: '2026-09-15 13:42:10',
    paidAt: '2026-09-15 13:42:10',
    timeline: [
      {
        id: 'pt-b1',
        step: 'REQUESTED',
        title: 'Tạo mã QR thanh toán MoMo',
        description: 'Tạo deep-link mở App MoMo trên thiết bị di động.',
        timestamp: '2026-09-15 13:38:00',
        actor: 'USER',
      },
      {
        id: 'pt-b2',
        step: 'SUCCESS',
        title: 'MoMo callback thành công',
        description: 'Xác thực IPN chữ ký số thành công từ ví MoMo.',
        timestamp: '2026-09-15 13:42:10',
        actor: 'SYSTEM',
        responseCode: '0',
      },
    ],
    rawResponse: {
      partnerCode: 'MOMO_CINEBOOK',
      orderId: 'CB-849202',
      requestId: 'REQ_109283',
      amount: 330000,
      orderInfo: 'Thanh toan ve xem phim CineBook',
      orderType: 'momo_wallet',
      transId: 2981048192,
      resultCode: 0,
      message: 'Successful.',
      payType: 'qr',
      responseTime: 1789458130,
      signature: 'd291e04192b4981... [REDACTED]',
    },
  },
  {
    id: 'pay-zl-551201',
    bookingId: 'bk-849203',
    bookingCode: 'CB-849203',
    customer: {
      id: 'usr-le-hoang-c',
      fullName: 'Lê Hoàng Cường',
      email: 'cuong.le@techcorp.vn',
      phone: '0988776655',
    },
    amount: 579000,
    currency: 'VND',
    method: 'ZALOPAY',
    status: 'PENDING',
    providerRef: 'ZP-TEMP-849203',
    cardType: 'E-WALLET',
    createdAt: '2026-09-15 15:15:00',
    updatedAt: '2026-09-15 15:15:00',
    timeline: [
      {
        id: 'pt-c1',
        step: 'REQUESTED',
        title: 'Tạo giao dịch ZaloPay Gateway',
        description: 'Tạo đơn hàng thành công, sinh mã QR động ZaloPay.',
        timestamp: '2026-09-15 15:15:00',
        actor: 'USER',
      },
      {
        id: 'pt-c2',
        step: 'PROCESSING',
        title: 'Chờ khách hàng quét mã thanh toán',
        description: 'Thời gian hết hạn giữ chỗ: 10 phút kể từ khi tạo mã.',
        timestamp: '2026-09-15 15:15:05',
        actor: 'SYSTEM',
      },
    ],
    rawResponse: {
      return_code: 1,
      return_message: 'Giao dich thanh cong',
      sub_return_code: 1,
      sub_return_message: '',
      order_url: 'https://qcgateway.zalopay.vn/pay?order=eyJhcHBfaWQiOj...',
      zp_trans_token: '26091500019281',
      order_token: '26091500019281',
      app_trans_id: '260915_ZP-TEMP-849203',
    },
  },
  {
    id: 'pay-exp-8812',
    bookingId: 'bk-849204',
    bookingCode: 'CB-849204',
    customer: {
      id: 'usr-pham-minh-d',
      fullName: 'Phạm Minh Đức',
      email: 'duc.pham@gmail.com',
      phone: '0977112233',
    },
    amount: 120000,
    currency: 'VND',
    method: 'VNPAY',
    status: 'FAILED',
    providerRef: 'VNPAY-EXP-9921',
    createdAt: '2026-09-15 11:00:00',
    updatedAt: '2026-09-15 11:10:01',
    timeline: [
      {
        id: 'pt-d1',
        step: 'REQUESTED',
        title: 'Khởi tạo thanh toán',
        description: 'Chuyển hướng đến cổng thanh toán VNPAY.',
        timestamp: '2026-09-15 11:00:00',
        actor: 'USER',
      },
      {
        id: 'pt-d2',
        step: 'FAILED',
        title: 'Quá thời gian thanh toán quy định',
        description: 'Mã lỗi 15: Quá hạn thanh toán 10 phút. Giao dịch đã tự động đóng.',
        timestamp: '2026-09-15 11:10:01',
        actor: 'SYSTEM',
        responseCode: '15',
      },
    ],
    rawResponse: {
      vnp_ResponseCode: '15',
      vnp_Message: 'Giao dich khong thanh cong do: Qua han thanh toan',
      vnp_TxnRef: 'VNPAY-EXP-9921',
      vnp_Amount: '12000000',
    },
  },
  {
    id: 'pay-cc-9921',
    bookingId: 'bk-849205',
    bookingCode: 'CB-849205',
    customer: {
      id: 'usr-hoang-thuy-e',
      fullName: 'Hoàng Thúy Nga',
      email: 'thuynga.hoang@gmail.com',
      phone: '0933445566',
    },
    amount: 700000,
    currency: 'VND',
    method: 'CREDIT_CARD',
    status: 'SUCCESS',
    providerRef: 'STRIPE_CH_902181',
    cardType: 'VISA',
    createdAt: '2026-09-14 16:15:00',
    updatedAt: '2026-09-15 08:30:15',
    paidAt: '2026-09-14 16:20:00',
    timeline: [
      {
        id: 'pt-e1',
        step: 'REQUESTED',
        title: 'Khởi tạo Stripe Checkout',
        description: 'Tạo PaymentIntent thẻ quốc tế Visa.',
        timestamp: '2026-09-14 16:15:00',
        actor: 'USER',
      },
      {
        id: 'pt-e2',
        step: 'SUCCESS',
        title: 'Thanh toán thẻ quốc tế thành công',
        description: 'Đã xác nhận trừ thẻ Visa **** **** **** 8831 thành công.',
        timestamp: '2026-09-14 16:20:00',
        actor: 'SYSTEM',
      },
      {
        id: 'pt-e3',
        step: 'REFUND_REQUESTED',
        title: 'Khởi tạo yêu cầu hoàn tiền',
        description: 'Admin phê duyệt yêu cầu hoàn vé do sự cố khách hàng.',
        timestamp: '2026-09-15 08:30:15',
        actor: 'ADMIN',
      },
    ],
    rawResponse: {
      id: 'ch_3Pt9281902181',
      object: 'charge',
      amount: 70000000,
      amount_refunded: 0,
      currency: 'vnd',
      payment_method_details: {
        card: {
          brand: 'visa',
          country: 'VN',
          exp_month: 12,
          exp_year: 2028,
          funding: 'credit',
          last4: '8831',
          cvv: '*** [REDACTED]',
          card_number: '**** **** **** 8831 [REDACTED]',
        },
        type: 'card',
      },
      status: 'succeeded',
      refunds: {
        total_count: 0,
      },
    },
  },
  {
    id: 'pay-vn-881273',
    bookingId: 'bk-849206',
    bookingCode: 'CB-849206',
    customer: {
      id: 'usr-vu-hoang-f',
      fullName: 'Vũ Hoàng Nam',
      email: 'nam.vu@gmail.com',
      phone: '0966554433',
    },
    amount: 530000,
    currency: 'VND',
    method: 'VNPAY',
    status: 'REFUNDED',
    providerRef: 'VNPAY-REFUND-4412',
    bankCode: 'TCB',
    cardType: 'ATM',
    createdAt: '2026-09-13 10:05:00',
    updatedAt: '2026-09-13 16:30:00',
    paidAt: '2026-09-13 10:10:00',
    refundedAt: '2026-09-13 16:30:00',
    refundAmount: 530000,
    refundReason: 'Rạp bảo trì đột xuất thiết bị 4DX phòng 02.',
    timeline: [
      {
        id: 'pt-f1',
        step: 'REQUESTED',
        title: 'Khởi tạo thanh toán',
        description: 'Tạo phiên thanh toán VNPAY.',
        timestamp: '2026-09-13 10:05:00',
        actor: 'USER',
      },
      {
        id: 'pt-f2',
        step: 'SUCCESS',
        title: 'VNPAY thanh toán thành công',
        description: 'Trừ tiền tài khoản Techcombank thành công.',
        timestamp: '2026-09-13 10:10:00',
        actor: 'SYSTEM',
      },
      {
        id: 'pt-f3',
        step: 'REFUND_REQUESTED',
        title: 'Yêu cầu hoàn tiền đối soát',
        description: 'Admin tạo lệnh hoàn do bảo trì phòng chiếu.',
        timestamp: '2026-09-13 15:00:00',
        actor: 'ADMIN',
      },
      {
        id: 'pt-f4',
        step: 'REFUNDED',
        title: 'VNPAY hoàn tiền hoàn tất',
        description: 'Tiền đã được trả về tài khoản Techcombank nguồn của khách hàng.',
        timestamp: '2026-09-13 16:30:00',
        actor: 'SYSTEM',
        responseCode: '00',
      },
    ],
    rawResponse: {
      vnp_ResponseId: '20260913163000',
      vnp_Command: 'refund',
      vnp_ResponseCode: '00',
      vnp_Message: 'Hoan tien thanh cong',
      vnp_TxnRef: 'VNPAY-20260913101000',
      vnp_Amount: '53000000',
      vnp_OrderInfo: 'Hoan tien phong chieu bao tri',
      vnp_BankCode: 'TCB',
    },
  },
  {
    id: 'pay-mo-33412',
    bookingId: 'bk-849207',
    bookingCode: 'CB-849207',
    customer: {
      id: 'usr-do-quynh-g',
      fullName: 'Đỗ Quỳnh Chi',
      email: 'quynhchi.do@gmail.com',
      phone: '0922889900',
    },
    amount: 285000,
    currency: 'VND',
    method: 'MOMO',
    status: 'SUCCESS',
    providerRef: 'MOMO_20260915_0941',
    cardType: 'E-WALLET',
    createdAt: '2026-09-15 10:10:00',
    updatedAt: '2026-09-15 10:15:30',
    paidAt: '2026-09-15 10:15:30',
    timeline: [
      {
        id: 'pt-g1',
        step: 'REQUESTED',
        title: 'Khởi tạo thanh toán MoMo',
        description: 'Tạo mã QR đơn hàng.',
        timestamp: '2026-09-15 10:10:00',
        actor: 'USER',
      },
      {
        id: 'pt-g2',
        step: 'SUCCESS',
        title: 'Thanh toán thành công',
        description: 'MoMo callback ghi nhận số tiền 285.000 VND.',
        timestamp: '2026-09-15 10:15:30',
        actor: 'SYSTEM',
      },
    ],
    rawResponse: {
      resultCode: 0,
      transId: 30192841,
      amount: 285000,
      message: 'Giao dich thanh cong',
      signature: 'f491c981a... [REDACTED]',
    },
  },
  {
    id: 'pay-vn-992190',
    bookingId: 'bk-849208',
    bookingCode: 'CB-849208',
    customer: {
      id: 'usr-tran-quoc-h',
      fullName: 'Trần Quốc Hùng',
      email: 'quoc.hung@gmail.com',
      phone: '0911223344',
    },
    amount: 650000,
    currency: 'VND',
    method: 'VNPAY',
    status: 'SUCCESS',
    providerRef: 'VNPAY-20260915152011',
    bankCode: 'MBBANK',
    cardType: 'ATM',
    createdAt: '2026-09-15 15:18:00',
    updatedAt: '2026-09-15 15:22:00',
    paidAt: '2026-09-15 15:22:00',
    timeline: [
      {
        id: 'pt-h1',
        step: 'REQUESTED',
        title: 'Khởi tạo thanh toán VNPAY',
        description: 'Khách hàng chọn ngân hàng Quân Đội (MBBank).',
        timestamp: '2026-09-15 15:18:00',
        actor: 'USER',
      },
      {
        id: 'pt-h2',
        step: 'SUCCESS',
        title: 'Giao dịch thành công',
        description: 'Xác thực trừ tiền 650.000 VND.',
        timestamp: '2026-09-15 15:22:00',
        actor: 'SYSTEM',
      },
    ],
    rawResponse: {
      vnp_ResponseCode: '00',
      vnp_BankCode: 'MBBANK',
      vnp_Amount: '65000000',
      vnp_TxnRef: 'VNPAY-20260915152011',
    },
  },
  {
    id: 'pay-zl-6612',
    bookingId: 'bk-849209',
    bookingCode: 'CB-849209',
    customer: {
      id: 'usr-ha-mai-k',
      fullName: 'Hà Mai Khanh',
      email: 'maikhanh.ha@gmail.com',
      phone: '0908877665',
    },
    amount: 350000,
    currency: 'VND',
    method: 'ZALOPAY',
    status: 'SUCCESS',
    providerRef: 'ZP_20260915_8831',
    cardType: 'E-WALLET',
    createdAt: '2026-09-15 09:25:00',
    updatedAt: '2026-09-15 09:30:10',
    paidAt: '2026-09-15 09:30:10',
    timeline: [
      {
        id: 'pt-k1',
        step: 'REQUESTED',
        title: 'Khởi tạo ZaloPay',
        description: 'Tạo mã thanh toán ZaloPay.',
        timestamp: '2026-09-15 09:25:00',
        actor: 'USER',
      },
      {
        id: 'pt-k2',
        step: 'SUCCESS',
        title: 'Thanh toán thành công',
        description: 'Nhận callback xác nhận 350.000 VND.',
        timestamp: '2026-09-15 09:30:10',
        actor: 'SYSTEM',
      },
    ],
    rawResponse: {
      return_code: 1,
      zp_trans_id: 'ZP8831920',
      amount: 350000,
    },
  },
  {
    id: 'pay-vn-1192',
    bookingId: 'bk-849210',
    bookingCode: 'CB-849210',
    customer: {
      id: 'usr-bui-gia-l',
      fullName: 'Bùi Gia Linh',
      email: 'gialinh.bui@gmail.com',
      phone: '0909988776',
    },
    amount: 110000,
    currency: 'VND',
    method: 'VNPAY',
    status: 'PENDING',
    providerRef: 'VNPAY_PENDING_849210',
    createdAt: '2026-09-15 15:20:00',
    updatedAt: '2026-09-15 15:20:00',
    timeline: [
      {
        id: 'pt-l1',
        step: 'REQUESTED',
        title: 'Khởi tạo thanh toán VNPAY',
        description: 'Chờ khách hàng nhập thông tin tài khoản ngân hàng.',
        timestamp: '2026-09-15 15:20:00',
        actor: 'USER',
      },
    ],
    rawResponse: {
      status: 'pending',
      provider: 'VNPAY',
      client_redirect: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...',
    },
  },
  {
    id: 'pay-cc-108291',
    bookingId: 'bk-fake-fail-1',
    bookingCode: 'CB-991201',
    customer: {
      id: 'usr-dang-thanh-m',
      fullName: 'Đặng Thanh Mai',
      email: 'thanhmai.dang@gmail.com',
      phone: '0938112233',
    },
    amount: 320000,
    currency: 'VND',
    method: 'CREDIT_CARD',
    status: 'FAILED',
    providerRef: 'STRIPE_ERR_DECLINED',
    cardType: 'MASTERCARD',
    createdAt: '2026-09-15 08:10:00',
    updatedAt: '2026-09-15 08:12:15',
    timeline: [
      {
        id: 'pt-m1',
        step: 'REQUESTED',
        title: 'Khởi tạo thanh toán thẻ Mastercard',
        description: 'Gửi yêu cầu trừ thẻ Mastercard **** **** **** 4012.',
        timestamp: '2026-09-15 08:10:00',
        actor: 'USER',
      },
      {
        id: 'pt-m2',
        step: 'FAILED',
        title: 'Thẻ bị ngân hàng phát hành từ chối',
        description: 'Mã lỗi: card_declined (Insufficient funds). Số dư thẻ không đủ để thực hiện thanh toán.',
        timestamp: '2026-09-15 08:12:15',
        actor: 'SYSTEM',
        responseCode: 'card_declined',
      },
    ],
    rawResponse: {
      error: {
        code: 'card_declined',
        decline_code: 'insufficient_funds',
        doc_url: 'https://stripe.com/docs/error-codes/card-declined',
        message: 'Your card has insufficient funds.',
        type: 'card_error',
        card: {
          last4: '4012',
          brand: 'mastercard',
          cvv: '*** [REDACTED]',
        },
      },
    },
  },
  {
    id: 'pay-mo-883192',
    bookingId: 'bk-fake-fail-2',
    bookingCode: 'CB-991202',
    customer: {
      id: 'usr-nguyen-duc-n',
      fullName: 'Nguyễn Đức Nhân',
      email: 'ducnhan.nguyen@gmail.com',
      phone: '0978998877',
    },
    amount: 180000,
    currency: 'VND',
    method: 'MOMO',
    status: 'FAILED',
    providerRef: 'MOMO_TIMEOUT_8831',
    cardType: 'E-WALLET',
    createdAt: '2026-09-14 20:00:00',
    updatedAt: '2026-09-14 20:10:00',
    timeline: [
      {
        id: 'pt-n1',
        step: 'REQUESTED',
        title: 'Tạo mã QR MoMo',
        description: 'Sinh QR thanh toán đơn hàng.',
        timestamp: '2026-09-14 20:00:00',
        actor: 'USER',
      },
      {
        id: 'pt-n2',
        step: 'FAILED',
        title: 'Hết thời gian quét mã',
        description: 'Người dùng không hoàn tất giao dịch trong vòng 10 phút.',
        timestamp: '2026-09-14 20:10:00',
        actor: 'SYSTEM',
        responseCode: 'timeout',
      },
    ],
    rawResponse: {
      resultCode: 1006,
      message: 'Giao dich bi tu choi boi nguoi dung hoac qua thoi gian quy dinh.',
      transId: 0,
    },
  },
]

function getStoredPayments(): AdminPayment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_PAYMENTS))
      return INITIAL_ADMIN_PAYMENTS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADMIN_PAYMENTS
  } catch (err) {
    console.error('Failed to load payments from localStorage:', err)
    return INITIAL_ADMIN_PAYMENTS
  }
}

function savePayments(payments: AdminPayment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments))
  } catch (err) {
    console.error('Failed to save payments to localStorage:', err)
  }
}

export function getAdminPayments(filters?: Partial<PaymentFilterState>): PaymentPaginationResult {
  const allPayments = getStoredPayments()

  const search = filters?.search?.trim().toLowerCase() || ''
  const method = filters?.method || 'ALL'
  const status = filters?.status || 'ALL'
  const startDate = filters?.startDate || ''
  const endDate = filters?.endDate || ''
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 10
  const sortBy = filters?.sortBy || 'createdAt'
  const sortOrder = filters?.sortOrder || 'desc'

  let filtered = allPayments.filter((p) => {
    // Search
    if (search) {
      const matchId = p.id.toLowerCase().includes(search)
      const matchBookingId = p.bookingId.toLowerCase().includes(search)
      const matchBookingCode = p.bookingCode.toLowerCase().includes(search)
      const matchRef = p.providerRef.toLowerCase().includes(search)
      const matchName = p.customer.fullName.toLowerCase().includes(search)
      const matchEmail = p.customer.email.toLowerCase().includes(search)
      const matchPhone = p.customer.phone.includes(search)
      if (
        !matchId &&
        !matchBookingId &&
        !matchBookingCode &&
        !matchRef &&
        !matchName &&
        !matchEmail &&
        !matchPhone
      ) {
        return false
      }
    }

    // Method filter
    if (method !== 'ALL' && p.method !== method) {
      return false
    }

    // Status filter
    if (status !== 'ALL' && p.status !== status) {
      return false
    }

    // Date range filter
    if (startDate) {
      const pDate = p.createdAt.slice(0, 10)
      if (pDate < startDate) return false
    }
    if (endDate) {
      const pDate = p.createdAt.slice(0, 10)
      if (pDate > endDate) return false
    }

    return true
  })

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0
    if (sortBy === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortBy === 'amount') {
      comparison = a.amount - b.amount
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const validPage = Math.min(page, totalPages)
  const startIndex = (validPage - 1) * pageSize
  const data = filtered.slice(startIndex, startIndex + pageSize)

  return {
    data,
    total,
    page: validPage,
    pageSize,
    totalPages,
  }
}

export function getAdminPaymentById(id: string): AdminPayment | null {
  const allPayments = getStoredPayments()
  return (
    allPayments.find((p) => p.id === id || p.providerRef === id || p.bookingCode === id) || null
  )
}

export function getPaymentSummary(): PaymentSummary {
  const allPayments = getStoredPayments()

  let grossAmount = 0
  let succeededAmount = 0
  let succeededCount = 0
  let failedAmount = 0
  let failedCount = 0
  let pendingAmount = 0
  let pendingCount = 0
  let refundedAmount = 0
  let refundedCount = 0

  allPayments.forEach((p) => {
    grossAmount += p.amount

    if (p.status === 'SUCCESS') {
      succeededAmount += p.amount
      succeededCount++
    } else if (p.status === 'FAILED') {
      failedAmount += p.amount
      failedCount++
    } else if (p.status === 'PENDING') {
      pendingAmount += p.amount
      pendingCount++
    } else if (p.status === 'REFUNDED') {
      refundedAmount += p.refundAmount || p.amount
      refundedCount++
    }
  })

  return {
    grossAmount,
    succeededAmount,
    succeededCount,
    failedAmount,
    failedCount,
    pendingAmount,
    pendingCount,
    refundedAmount,
    refundedCount,
  }
}

/**
 * Sandbox feature for Mock/Local development: Simulate payment gateway callback
 */
export function simulatePaymentOutcome(
  id: string,
  outcome: 'SUCCESS' | 'FAILED'
): { success: boolean; message: string; payment?: AdminPayment } {
  const allPayments = getStoredPayments()
  const paymentIndex = allPayments.findIndex((p) => p.id === id)

  if (paymentIndex === -1) {
    return { success: false, message: 'Không tìm thấy giao dịch thanh toán' }
  }

  const payment = allPayments[paymentIndex]

  if (payment.status !== 'PENDING') {
    return {
      success: false,
      message: `Giao dịch đã ở trạng thái ${payment.status}, không thể mô phỏng kết quả.`,
    }
  }

  const now = new Date()
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19)

  const newTimelineItem = {
    id: `pt-sim-${Date.now()}`,
    step: outcome,
    title:
      outcome === 'SUCCESS'
        ? '[MOCK/SANDBOX] Cổng thanh toán phản hồi: Thành công'
        : '[MOCK/SANDBOX] Cổng thanh toán phản hồi: Thất bại',
    description:
      outcome === 'SUCCESS'
        ? 'Giả lập thành công nhận IPN webhook từ cổng thanh toán trong môi trường demo/sandbox.'
        : 'Giả lập lỗi từ chối thanh toán hoặc timeout trong môi trường demo/sandbox.',
    timestamp: timestampStr,
    actor: 'ADMIN' as const,
    responseCode: outcome === 'SUCCESS' ? '00' : '99',
  }

  const updatedPayment: AdminPayment = {
    ...payment,
    status: outcome,
    paidAt: outcome === 'SUCCESS' ? timestampStr : undefined,
    timeline: [newTimelineItem, ...payment.timeline],
    updatedAt: timestampStr,
  }

  allPayments[paymentIndex] = updatedPayment
  savePayments(allPayments)

  return {
    success: true,
    message: `Đã giả lập kết quả ${outcome} cho giao dịch ${payment.id}.`,
    payment: updatedPayment,
  }
}

/**
 * Safe refund flow with confirmation check
 */
export function refundAdminPayment(
  id: string,
  reason: string
): { success: boolean; message: string; payment?: AdminPayment } {
  const allPayments = getStoredPayments()
  const paymentIndex = allPayments.findIndex((p) => p.id === id)

  if (paymentIndex === -1) {
    return { success: false, message: 'Không tìm thấy giao dịch thanh toán' }
  }

  const payment = allPayments[paymentIndex]

  if (payment.status !== 'SUCCESS') {
    return {
      success: false,
      message: 'Chỉ có thể hoàn tiền cho giao dịch đã thanh toán thành công.',
    }
  }

  const now = new Date()
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19)

  const newTimelineItem = {
    id: `pt-ref-${Date.now()}`,
    step: 'REFUNDED' as const,
    title: 'Hoàn tiền hoàn tất qua cổng thanh toán',
    description: `Lý do: ${reason.trim() || 'Admin duyệt hoàn tiền'}. Số tiền hoàn: ${payment.amount.toLocaleString('vi-VN')} VND.`,
    timestamp: timestampStr,
    actor: 'ADMIN' as const,
    responseCode: 'REFUND_OK',
  }

  const updatedPayment: AdminPayment = {
    ...payment,
    status: 'REFUNDED',
    refundedAt: timestampStr,
    refundAmount: payment.amount,
    refundReason: reason.trim() || 'Hoàn tiền theo yêu cầu quản trị viên',
    timeline: [newTimelineItem, ...payment.timeline],
    updatedAt: timestampStr,
  }

  allPayments[paymentIndex] = updatedPayment
  savePayments(allPayments)

  return {
    success: true,
    message: `Đã hoàn tiền ${payment.amount.toLocaleString('vi-VN')} VND cho giao dịch ${payment.id}.`,
    payment: updatedPayment,
  }
}

/**
 * Real client-side CSV Export helper with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportPaymentsToCSV(payments: AdminPayment[]): void {
  if (!payments || payments.length === 0) {
    return
  }

  const headers = [
    'Mã Giao Dịch',
    'Mã Đơn Booking',
    'Khách Hàng',
    'Email',
    'Số Điện Thoại',
    'Số Tiền (VND)',
    'Phương Thức',
    'Trạng Thái',
    'Mã Đối Soát Cổng',
    'Ngân Hàng',
    'Loại Thẻ',
    'Thời Gian Tạo',
    'Thời Gian Thanh Toán',
    'Thời Gian Hoàn Tiền',
    'Lý Do Hoàn Tiền',
  ]

  const statusLabels: Record<string, string> = {
    SUCCESS: 'Thành công',
    PENDING: 'Chờ xử lý',
    FAILED: 'Thất bại',
    REFUNDED: 'Đã hoàn tiền',
  }

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""'
    const str = String(value).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows = payments.map((p) => {
    return [
      escapeCSV(p.id),
      escapeCSV(p.bookingCode),
      escapeCSV(p.customer.fullName),
      escapeCSV(p.customer.email),
      escapeCSV(p.customer.phone),
      escapeCSV(p.amount),
      escapeCSV(p.method),
      escapeCSV(statusLabels[p.status] || p.status),
      escapeCSV(p.providerRef),
      escapeCSV(p.bankCode || ''),
      escapeCSV(p.cardType || ''),
      escapeCSV(p.createdAt),
      escapeCSV(p.paidAt || ''),
      escapeCSV(p.refundedAt || ''),
      escapeCSV(p.refundReason || ''),
    ].join(',')
  })

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  const timestamp = new Date().toISOString().slice(0, 10)
  link.setAttribute('href', url)
  link.setAttribute('download', `CineBook_Payments_${timestamp}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
