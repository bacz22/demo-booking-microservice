import type {
  AdminBooking,
  AdminBookingStatus,
  BookingFilterState,
  BookingPaginationResult,
} from '@/types/admin-booking'

const STORAGE_KEY = 'cinebook_admin_bookings'

const INITIAL_ADMIN_BOOKINGS: AdminBooking[] = [
  {
    id: 'bk-849201',
    bookingCode: 'CB-849201',
    customer: {
      id: 'usr-nguyen-van-a',
      fullName: 'Nguyễn Văn An',
      email: 'nguyen.an@gmail.com',
      phone: '0901234567',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      membershipTier: 'DIAMOND',
    },
    movie: {
      id: 'dune-part-two',
      title: 'Dune: Hành Tinh Cát - Phần Hai',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      duration: 166,
      ageRating: 'T16',
      format: 'IMAX Laser 2D',
      language: 'Phụ đề Tiếng Việt',
    },
    theater: {
      id: 'cinema-landmark-81',
      name: 'CineBook Landmark 81',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng B1, TTTM Vincom Landmark 81, 720A Điện Biên Phủ, P. 22, Q. Bình Thạnh',
      auditoriumId: 'aud-lm-01',
      auditoriumName: 'Phòng 01 — IMAX Laser',
    },
    showtime: {
      id: 'st-01',
      date: '2026-09-15',
      startTime: '19:30',
      endTime: '22:16',
    },
    seats: [
      { seatId: 'seat-F7', seatNumber: 'F7', type: 'vip', price: 180000 },
      { seatId: 'seat-F8', seatNumber: 'F8', type: 'vip', price: 180000 },
    ],
    pricing: {
      seatsTotal: 360000,
      comboSnackTotal: 125000,
      discountAmount: 50000,
      finalTotal: 435000,
    },
    payment: {
      paymentId: 'pay-vn-992182',
      method: 'VNPAY',
      status: 'SUCCESS',
      providerRef: 'VNPAY-20260915124981',
      paidAt: '2026-09-15 14:15:22',
    },
    status: 'CONFIRMED',
    timeline: [
      {
        id: 'tl-1',
        toState: 'PENDING_PAYMENT',
        title: 'Khởi tạo đơn đặt vé',
        description: 'Khách hàng khóa tạm thời 2 ghế VIP (F7, F8) trên hệ thống phòng 01.',
        timestamp: '2026-09-15 14:10:05',
        actor: 'USER',
        correlationId: 'corr-849201-init',
      },
      {
        id: 'tl-2',
        fromState: 'PENDING_PAYMENT',
        toState: 'CONFIRMED',
        title: 'Cổng VNPAY xác nhận thanh toán',
        description: 'Giao dịch 435.000 đ thành công qua mã VNPAY-20260915124981.',
        timestamp: '2026-09-15 14:15:22',
        actor: 'SYSTEM',
        correlationId: 'corr-849201-pay',
      },
      {
        id: 'tl-3',
        toState: 'CONFIRMED',
        title: 'Kafka phát sinh sự kiện booking-confirmed',
        description: 'Đã xuất vé điện tử, tạo mã QR và gửi email xác nhận cho khách hàng.',
        timestamp: '2026-09-15 14:15:24',
        actor: 'SYSTEM',
        correlationId: 'corr-849201-kafka',
      },
    ],
    metadata: {
      bookingId: 'bk-849201',
      userId: 'usr-nguyen-van-a',
      showtimeId: 'st-01',
      paymentId: 'pay-vn-992182',
      providerRef: 'VNPAY-20260915124981',
      correlationId: 'corr-849201-kafka-99f2',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 2,
      kafkaOffset: 48912,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
      ipAddress: '113.161.72.19',
    },
    createdAt: '2026-09-15 14:10:05',
    updatedAt: '2026-09-15 14:15:24',
  },
  {
    id: 'bk-849202',
    bookingCode: 'CB-849202',
    customer: {
      id: 'usr-tran-thi-b',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@outlook.com',
      phone: '0912345678',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      membershipTier: 'GOLD',
    },
    movie: {
      id: 'oppenheimer',
      title: 'Oppenheimer',
      posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
      duration: 180,
      ageRating: 'T18',
      format: 'Standard 2D',
      language: 'Phụ đề Tiếng Việt',
    },
    theater: {
      id: 'cinema-hung-vuong-plaza',
      name: 'CineBook Hùng Vương Plaza',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng 7, Hùng Vương Plaza, 126 Hồng Bàng, P. 12, Q. 5',
      auditoriumId: 'aud-hv-01',
      auditoriumName: 'Phòng 01 — Standard',
    },
    showtime: {
      id: 'st-04',
      date: '2026-09-15',
      startTime: '20:15',
      endTime: '23:15',
    },
    seats: [
      { seatId: 'seat-D4', seatNumber: 'D4', type: 'standard', price: 110000 },
      { seatId: 'seat-D5', seatNumber: 'D5', type: 'standard', price: 110000 },
      { seatId: 'seat-D6', seatNumber: 'D6', type: 'standard', price: 110000 },
    ],
    pricing: {
      seatsTotal: 330000,
      comboSnackTotal: 0,
      discountAmount: 0,
      finalTotal: 330000,
    },
    payment: {
      paymentId: 'pay-mo-109283',
      method: 'MOMO',
      status: 'SUCCESS',
      providerRef: 'MOMO_20260915_9012',
      paidAt: '2026-09-15 13:42:10',
    },
    status: 'CONFIRMED',
    timeline: [
      {
        id: 'tl-b-1',
        toState: 'PENDING_PAYMENT',
        title: 'Tạo đơn đặt vé',
        description: 'Giữ chỗ các ghế D4, D5, D6.',
        timestamp: '2026-09-15 13:38:00',
        actor: 'USER',
      },
      {
        id: 'tl-b-2',
        fromState: 'PENDING_PAYMENT',
        toState: 'CONFIRMED',
        title: 'MoMo thanh toán thành công',
        description: 'Nhận callback thành công từ cổng MoMo.',
        timestamp: '2026-09-15 13:42:10',
        actor: 'SYSTEM',
      },
    ],
    metadata: {
      bookingId: 'bk-849202',
      userId: 'usr-tran-thi-b',
      showtimeId: 'st-04',
      paymentId: 'pay-mo-109283',
      providerRef: 'MOMO_20260915_9012',
      correlationId: 'corr-849202-momo-41c',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 1,
      kafkaOffset: 48801,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      ipAddress: '14.232.180.45',
    },
    createdAt: '2026-09-15 13:38:00',
    updatedAt: '2026-09-15 13:42:10',
  },
  {
    id: 'bk-849203',
    bookingCode: 'CB-849203',
    customer: {
      id: 'usr-le-hoang-c',
      fullName: 'Lê Hoàng Cường',
      email: 'cuong.le@techcorp.vn',
      phone: '0988776655',
      membershipTier: 'SILVER',
    },
    movie: {
      id: 'mai',
      title: 'Mai',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
      duration: 131,
      ageRating: 'T18',
      format: 'Standard 2D',
      language: 'Tiếng Việt',
    },
    theater: {
      id: 'cinema-vincom-dong-khoi',
      name: 'CineBook Vincom Đồng Khởi',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng 3, Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, P. Bến Nghé, Q. 1',
      auditoriumId: 'aud-dk-01',
      auditoriumName: 'Phòng 01 — Standard',
    },
    showtime: {
      id: 'st-05',
      date: '2026-09-15',
      startTime: '18:00',
      endTime: '20:11',
    },
    seats: [
      { seatId: 'seat-G11', seatNumber: 'G11', type: 'couple', price: 240000 },
      { seatId: 'seat-G12', seatNumber: 'G12', type: 'couple', price: 240000 },
    ],
    pricing: {
      seatsTotal: 480000,
      comboSnackTotal: 99000,
      discountAmount: 0,
      finalTotal: 579000,
    },
    payment: {
      paymentId: 'pay-zl-551201',
      method: 'ZALOPAY',
      status: 'PENDING',
      providerRef: 'ZP-TEMP-849203',
    },
    status: 'PENDING_PAYMENT',
    timeline: [
      {
        id: 'tl-c-1',
        toState: 'PENDING_PAYMENT',
        title: 'Chờ thanh toán qua ZaloPay',
        description: 'Đã tạo mã QR ZaloPay, đang chờ khách quét thanh toán trong vòng 10 phút.',
        timestamp: '2026-09-15 15:15:00',
        actor: 'USER',
      },
    ],
    metadata: {
      bookingId: 'bk-849203',
      userId: 'usr-le-hoang-c',
      showtimeId: 'st-05',
      paymentId: 'pay-zl-551201',
      providerRef: 'ZP-TEMP-849203',
      correlationId: 'corr-849203-zl-init',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 0,
      kafkaOffset: 48999,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      ipAddress: '118.69.190.12',
    },
    createdAt: '2026-09-15 15:15:00',
    updatedAt: '2026-09-15 15:15:00',
  },
  {
    id: 'bk-849204',
    bookingCode: 'CB-849204',
    customer: {
      id: 'usr-pham-minh-d',
      fullName: 'Phạm Minh Đức',
      email: 'duc.pham@gmail.com',
      phone: '0977112233',
      membershipTier: 'STANDARD',
    },
    movie: {
      id: 'exhuma',
      title: 'Quật Mộ Trùng Ma',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      duration: 134,
      ageRating: 'T18',
      format: 'Standard 2D',
      language: 'Phụ đề Tiếng Việt',
    },
    theater: {
      id: 'cinema-landmark-81',
      name: 'CineBook Landmark 81',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng B1, TTTM Vincom Landmark 81, 720A Điện Biên Phủ, P. 22, Q. Bình Thạnh',
      auditoriumId: 'aud-lm-02',
      auditoriumName: 'Phòng 02 — ScreenX',
    },
    showtime: {
      id: 'st-02',
      date: '2026-09-15',
      startTime: '21:00',
      endTime: '23:14',
    },
    seats: [{ seatId: 'seat-C8', seatNumber: 'C8', type: 'standard', price: 120000 }],
    pricing: {
      seatsTotal: 120000,
      comboSnackTotal: 0,
      discountAmount: 0,
      finalTotal: 120000,
    },
    payment: {
      paymentId: 'pay-exp-8812',
      method: 'VNPAY',
      status: 'FAILED',
      providerRef: 'VNPAY-EXP-9921',
    },
    status: 'EXPIRED',
    timeline: [
      {
        id: 'tl-d-1',
        toState: 'PENDING_PAYMENT',
        title: 'Khởi tạo đơn đặt vé',
        description: 'Khóa tạm thời ghế C8.',
        timestamp: '2026-09-15 11:00:00',
        actor: 'USER',
      },
      {
        id: 'tl-d-2',
        fromState: 'PENDING_PAYMENT',
        toState: 'EXPIRED',
        title: 'Hết hạn giữ chỗ',
        description: 'Khách hàng không thanh toán trong thời hạn 10 phút. Hệ thống tự động nhả ghế C8.',
        timestamp: '2026-09-15 11:10:01',
        actor: 'SYSTEM',
      },
    ],
    metadata: {
      bookingId: 'bk-849204',
      userId: 'usr-pham-minh-d',
      showtimeId: 'st-02',
      paymentId: 'pay-exp-8812',
      providerRef: 'VNPAY-EXP-9921',
      correlationId: 'corr-849204-expire',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 2,
      kafkaOffset: 48512,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6)',
      ipAddress: '27.72.101.88',
    },
    createdAt: '2026-09-15 11:00:00',
    updatedAt: '2026-09-15 11:10:01',
  },
  {
    id: 'bk-849205',
    bookingCode: 'CB-849205',
    customer: {
      id: 'usr-hoang-thuy-e',
      fullName: 'Hoàng Thúy Nga',
      email: 'thuynga.hoang@gmail.com',
      phone: '0933445566',
      membershipTier: 'DIAMOND',
    },
    movie: {
      id: 'kung-fu-panda-4',
      title: 'Kung Fu Panda 4',
      posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
      duration: 94,
      ageRating: 'P',
      format: 'Standard 2D',
      language: 'Lồng tiếng Tiếng Việt',
    },
    theater: {
      id: 'cinema-thao-dien',
      name: 'CineBook Thảo Điền',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng 5, Vincom Mega Mall Thảo Điền, 161 Xa Lộ Hà Nội, P. Thảo Điền, TP. Thủ Đức',
      auditoriumId: 'aud-td-01',
      auditoriumName: 'Phòng 01 — Standard',
    },
    showtime: {
      id: 'st-06',
      date: '2026-09-16',
      startTime: '10:00',
      endTime: '11:34',
    },
    seats: [
      { seatId: 'seat-E4', seatNumber: 'E4', type: 'vip', price: 140000 },
      { seatId: 'seat-E5', seatNumber: 'E5', type: 'vip', price: 140000 },
      { seatId: 'seat-E6', seatNumber: 'E6', type: 'vip', price: 140000 },
      { seatId: 'seat-E7', seatNumber: 'E7', type: 'vip', price: 140000 },
    ],
    pricing: {
      seatsTotal: 560000,
      comboSnackTotal: 210000,
      discountAmount: 70000,
      finalTotal: 700000,
    },
    payment: {
      paymentId: 'pay-cc-9921',
      method: 'CREDIT_CARD',
      status: 'SUCCESS',
      providerRef: 'STRIPE_CH_902181',
      paidAt: '2026-09-14 16:20:00',
    },
    status: 'REFUND_PENDING',
    timeline: [
      {
        id: 'tl-e-1',
        toState: 'PENDING_PAYMENT',
        title: 'Tạo đơn đặt vé gia đình',
        description: 'Đặt 4 vé VIP Kung Fu Panda 4.',
        timestamp: '2026-09-14 16:15:00',
        actor: 'USER',
      },
      {
        id: 'tl-e-2',
        fromState: 'PENDING_PAYMENT',
        toState: 'CONFIRMED',
        title: 'Thanh toán thẻ quốc tế thành công',
        description: 'Xác nhận trừ thẻ Visa đuôi 8831 thành công 700.000 đ.',
        timestamp: '2026-09-14 16:20:00',
        actor: 'SYSTEM',
      },
      {
        id: 'tl-e-3',
        fromState: 'CONFIRMED',
        toState: 'REFUND_PENDING',
        title: 'Khách yêu cầu hoàn vé',
        description: 'Lý do: Con nhỏ bị sốt không đi xem được. Đã chuyển bộ phận CSKH đối soát.',
        timestamp: '2026-09-15 08:30:15',
        actor: 'ADMIN',
        correlationId: 'corr-refund-req-849205',
      },
    ],
    metadata: {
      bookingId: 'bk-849205',
      userId: 'usr-hoang-thuy-e',
      showtimeId: 'st-06',
      paymentId: 'pay-cc-9921',
      providerRef: 'STRIPE_CH_902181',
      correlationId: 'corr-849205-refund-pending',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 3,
      kafkaOffset: 47910,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X)',
      ipAddress: '171.244.11.90',
    },
    createdAt: '2026-09-14 16:15:00',
    updatedAt: '2026-09-15 08:30:15',
  },
  {
    id: 'bk-849206',
    bookingCode: 'CB-849206',
    customer: {
      id: 'usr-vu-hoang-f',
      fullName: 'Vũ Hoàng Nam',
      email: 'nam.vu@gmail.com',
      phone: '0966554433',
      membershipTier: 'GOLD',
    },
    movie: {
      id: 'godzilla-x-kong-the-new-empire',
      title: 'Godzilla x Kong: Đế Chế Mới',
      posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
      duration: 115,
      ageRating: 'K',
      format: '4DX 3D',
      language: 'Phụ đề Tiếng Việt',
    },
    theater: {
      id: 'cinema-hung-vuong-plaza',
      name: 'CineBook Hùng Vương Plaza',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng 7, Hùng Vương Plaza, 126 Hồng Bàng, P. 12, Q. 5',
      auditoriumId: 'aud-hv-02',
      auditoriumName: 'Phòng 02 — 4DX Dynamic',
    },
    showtime: {
      id: 'st-07',
      date: '2026-09-14',
      startTime: '19:00',
      endTime: '20:55',
    },
    seats: [
      { seatId: 'seat-D8', seatNumber: 'D8', type: 'vip', price: 210000 },
      { seatId: 'seat-D9', seatNumber: 'D9', type: 'vip', price: 210000 },
    ],
    pricing: {
      seatsTotal: 420000,
      comboSnackTotal: 110000,
      discountAmount: 0,
      finalTotal: 530000,
    },
    payment: {
      paymentId: 'pay-vn-881273',
      method: 'VNPAY',
      status: 'REFUNDED',
      providerRef: 'VNPAY-REFUND-4412',
      paidAt: '2026-09-13 10:10:00',
    },
    status: 'REFUNDED',
    timeline: [
      {
        id: 'tl-f-1',
        toState: 'PENDING_PAYMENT',
        title: 'Tạo đơn đặt vé',
        description: 'Khóa ghế D8, D9 rạp Hùng Vương Plaza.',
        timestamp: '2026-09-13 10:05:00',
        actor: 'USER',
      },
      {
        id: 'tl-f-2',
        fromState: 'PENDING_PAYMENT',
        toState: 'CONFIRMED',
        title: 'VNPAY thanh toán thành công',
        description: 'Đã nhận 530.000 đ qua VNPAY.',
        timestamp: '2026-09-13 10:10:00',
        actor: 'SYSTEM',
      },
      {
        id: 'tl-f-3',
        fromState: 'CONFIRMED',
        toState: 'REFUND_PENDING',
        title: 'Yêu cầu hoàn vé',
        description: 'Rạp bảo trì đột xuất thiết bị 4DX phòng 02.',
        timestamp: '2026-09-13 15:00:00',
        actor: 'ADMIN',
      },
      {
        id: 'tl-f-4',
        fromState: 'REFUND_PENDING',
        toState: 'REFUNDED',
        title: 'Hoàn tiền thành công qua VNPAY',
        description: 'Đã hoàn 530.000 đ vào tài khoản nguồn của khách. Mã hoàn: VNPAY-REFUND-4412.',
        timestamp: '2026-09-13 16:30:00',
        actor: 'SYSTEM',
      },
    ],
    metadata: {
      bookingId: 'bk-849206',
      userId: 'usr-vu-hoang-f',
      showtimeId: 'st-07',
      paymentId: 'pay-vn-881273',
      providerRef: 'VNPAY-REFUND-4412',
      correlationId: 'corr-849206-refund-done',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 1,
      kafkaOffset: 46210,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0.0.0',
      ipAddress: '115.79.20.101',
    },
    createdAt: '2026-09-13 10:05:00',
    updatedAt: '2026-09-13 16:30:00',
  },
  {
    id: 'bk-849207',
    bookingCode: 'CB-849207',
    customer: {
      id: 'usr-do-quynh-g',
      fullName: 'Đỗ Quỳnh Chi',
      email: 'quynhchi.do@gmail.com',
      phone: '0922889900',
      membershipTier: 'SILVER',
    },
    movie: {
      id: 'conan-movie-27',
      title: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      duration: 111,
      ageRating: 'K',
      format: 'Standard 2D',
      language: 'Lồng tiếng Tiếng Việt',
    },
    theater: {
      id: 'cinema-vincom-dong-khoi',
      name: 'CineBook Vincom Đồng Khởi',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng 3, Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, P. Bến Nghé, Q. 1',
      auditoriumId: 'aud-dk-02',
      auditoriumName: 'Phòng 02 — Dolby Atmos',
    },
    showtime: {
      id: 'st-08',
      date: '2026-09-15',
      startTime: '17:30',
      endTime: '19:21',
    },
    seats: [
      { seatId: 'seat-C4', seatNumber: 'C4', type: 'standard', price: 110000 },
      { seatId: 'seat-C5', seatNumber: 'C5', type: 'standard', price: 110000 },
    ],
    pricing: {
      seatsTotal: 220000,
      comboSnackTotal: 85000,
      discountAmount: 20000,
      finalTotal: 285000,
    },
    payment: {
      paymentId: 'pay-mo-33412',
      method: 'MOMO',
      status: 'SUCCESS',
      providerRef: 'MOMO_20260915_0941',
      paidAt: '2026-09-15 10:15:30',
    },
    status: 'CANCELLED',
    timeline: [
      {
        id: 'tl-g-1',
        toState: 'PENDING_PAYMENT',
        title: 'Tạo đơn đặt vé',
        description: 'Khóa chỗ C4, C5.',
        timestamp: '2026-09-15 10:10:00',
        actor: 'USER',
      },
      {
        id: 'tl-g-2',
        fromState: 'PENDING_PAYMENT',
        toState: 'CONFIRMED',
        title: 'MoMo ghi nhận thanh toán',
        description: 'Thanh toán thành công 285.000 đ.',
        timestamp: '2026-09-15 10:15:30',
        actor: 'SYSTEM',
      },
      {
        id: 'tl-g-3',
        fromState: 'CONFIRMED',
        toState: 'CANCELLED',
        title: 'Quản trị viên hủy vé',
        description: 'Lý do: Khách hàng nhập trùng đơn và yêu cầu hủy giải phóng ghế ngay lập tức.',
        timestamp: '2026-09-15 11:20:00',
        actor: 'ADMIN',
        correlationId: 'corr-cancel-admin-849207',
      },
    ],
    metadata: {
      bookingId: 'bk-849207',
      userId: 'usr-do-quynh-g',
      showtimeId: 'st-08',
      paymentId: 'pay-mo-33412',
      providerRef: 'MOMO_20260915_0941',
      correlationId: 'corr-849207-cancel',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 0,
      kafkaOffset: 48600,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      ipAddress: '14.161.40.23',
    },
    createdAt: '2026-09-15 10:10:00',
    updatedAt: '2026-09-15 11:20:00',
  },
  {
    id: 'bk-849208',
    bookingCode: 'CB-849208',
    customer: {
      id: 'usr-tran-quoc-h',
      fullName: 'Trần Quốc Hùng',
      email: 'quoc.hung@gmail.com',
      phone: '0911223344',
      membershipTier: 'GOLD',
    },
    movie: {
      id: 'dune-part-two',
      title: 'Dune: Hành Tinh Cát - Phần Hai',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      duration: 166,
      ageRating: 'T16',
      format: 'IMAX Laser 2D',
      language: 'Phụ đề Tiếng Việt',
    },
    theater: {
      id: 'cinema-landmark-81',
      name: 'CineBook Landmark 81',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng B1, TTTM Vincom Landmark 81, 720A Điện Biên Phủ, P. 22, Q. Bình Thạnh',
      auditoriumId: 'aud-lm-01',
      auditoriumName: 'Phòng 01 — IMAX Laser',
    },
    showtime: {
      id: 'st-01',
      date: '2026-09-15',
      startTime: '19:30',
      endTime: '22:16',
    },
    seats: [
      { seatId: 'seat-G7', seatNumber: 'G7', type: 'vip', price: 180000 },
      { seatId: 'seat-G8', seatNumber: 'G8', type: 'vip', price: 180000 },
      { seatId: 'seat-G9', seatNumber: 'G9', type: 'vip', price: 180000 },
    ],
    pricing: {
      seatsTotal: 540000,
      comboSnackTotal: 150000,
      discountAmount: 40000,
      finalTotal: 650000,
    },
    payment: {
      paymentId: 'pay-vn-992190',
      method: 'VNPAY',
      status: 'SUCCESS',
      providerRef: 'VNPAY-20260915152011',
      paidAt: '2026-09-15 15:22:00',
    },
    status: 'CONFIRMED',
    timeline: [
      {
        id: 'tl-h-1',
        toState: 'PENDING_PAYMENT',
        title: 'Khởi tạo đơn đặt vé',
        description: 'Khóa 3 ghế VIP dãy G.',
        timestamp: '2026-09-15 15:18:00',
        actor: 'USER',
      },
      {
        id: 'tl-h-2',
        fromState: 'PENDING_PAYMENT',
        toState: 'CONFIRMED',
        title: 'VNPAY giao dịch thành công',
        description: 'Xác nhận số tiền 650.000 đ.',
        timestamp: '2026-09-15 15:22:00',
        actor: 'SYSTEM',
      },
    ],
    metadata: {
      bookingId: 'bk-849208',
      userId: 'usr-tran-quoc-h',
      showtimeId: 'st-01',
      paymentId: 'pay-vn-992190',
      providerRef: 'VNPAY-20260915152011',
      correlationId: 'corr-849208-vnpay',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 2,
      kafkaOffset: 49011,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      ipAddress: '113.185.34.120',
    },
    createdAt: '2026-09-15 15:18:00',
    updatedAt: '2026-09-15 15:22:00',
  },
  {
    id: 'bk-849209',
    bookingCode: 'CB-849209',
    customer: {
      id: 'usr-ha-mai-k',
      fullName: 'Hà Mai Khanh',
      email: 'maikhanh.ha@gmail.com',
      phone: '0908877665',
      membershipTier: 'DIAMOND',
    },
    movie: {
      id: 'oppenheimer',
      title: 'Oppenheimer',
      posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
      duration: 180,
      ageRating: 'T18',
      format: 'Standard 2D',
      language: 'Phụ đề Tiếng Việt',
    },
    theater: {
      id: 'cinema-hung-vuong-plaza',
      name: 'CineBook Hùng Vương Plaza',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng 7, Hùng Vương Plaza, 126 Hồng Bàng, P. 12, Q. 5',
      auditoriumId: 'aud-hv-01',
      auditoriumName: 'Phòng 01 — Standard',
    },
    showtime: {
      id: 'st-04',
      date: '2026-09-16',
      startTime: '14:00',
      endTime: '17:00',
    },
    seats: [
      { seatId: 'seat-F5', seatNumber: 'F5', type: 'vip', price: 140000 },
      { seatId: 'seat-F6', seatNumber: 'F6', type: 'vip', price: 140000 },
    ],
    pricing: {
      seatsTotal: 280000,
      comboSnackTotal: 95000,
      discountAmount: 25000,
      finalTotal: 350000,
    },
    payment: {
      paymentId: 'pay-zl-6612',
      method: 'ZALOPAY',
      status: 'SUCCESS',
      providerRef: 'ZP_20260915_8831',
      paidAt: '2026-09-15 09:30:10',
    },
    status: 'CONFIRMED',
    timeline: [
      {
        id: 'tl-k-1',
        toState: 'PENDING_PAYMENT',
        title: 'Khởi tạo đơn đặt vé',
        description: 'Khóa 2 ghế F5, F6.',
        timestamp: '2026-09-15 09:25:00',
        actor: 'USER',
      },
      {
        id: 'tl-k-2',
        fromState: 'PENDING_PAYMENT',
        toState: 'CONFIRMED',
        title: 'ZaloPay giao dịch thành công',
        description: 'Nhận 350.000 đ thành công.',
        timestamp: '2026-09-15 09:30:10',
        actor: 'SYSTEM',
      },
    ],
    metadata: {
      bookingId: 'bk-849209',
      userId: 'usr-ha-mai-k',
      showtimeId: 'st-04',
      paymentId: 'pay-zl-6612',
      providerRef: 'ZP_20260915_8831',
      correlationId: 'corr-849209-zalopay',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 1,
      kafkaOffset: 48311,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X)',
      ipAddress: '113.160.88.204',
    },
    createdAt: '2026-09-15 09:25:00',
    updatedAt: '2026-09-15 09:30:10',
  },
  {
    id: 'bk-849210',
    bookingCode: 'CB-849210',
    customer: {
      id: 'usr-bui-gia-l',
      fullName: 'Bùi Gia Linh',
      email: 'gialinh.bui@gmail.com',
      phone: '0909988776',
      membershipTier: 'STANDARD',
    },
    movie: {
      id: 'mai',
      title: 'Mai',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
      duration: 131,
      ageRating: 'T18',
      format: 'Standard 2D',
      language: 'Tiếng Việt',
    },
    theater: {
      id: 'cinema-vincom-dong-khoi',
      name: 'CineBook Vincom Đồng Khởi',
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng 3, Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, P. Bến Nghé, Q. 1',
      auditoriumId: 'aud-dk-01',
      auditoriumName: 'Phòng 01 — Standard',
    },
    showtime: {
      id: 'st-05',
      date: '2026-09-15',
      startTime: '18:00',
      endTime: '20:11',
    },
    seats: [{ seatId: 'seat-B4', seatNumber: 'B4', type: 'standard', price: 110000 }],
    pricing: {
      seatsTotal: 110000,
      comboSnackTotal: 0,
      discountAmount: 0,
      finalTotal: 110000,
    },
    payment: {
      paymentId: 'pay-vn-1192',
      method: 'VNPAY',
      status: 'PENDING',
      providerRef: 'VNPAY_PENDING_849210',
    },
    status: 'PENDING_PAYMENT',
    timeline: [
      {
        id: 'tl-l-1',
        toState: 'PENDING_PAYMENT',
        title: 'Khởi tạo đơn đặt vé',
        description: 'Chờ khách hàng nhập mã OTP thanh toán ngân hàng.',
        timestamp: '2026-09-15 15:20:00',
        actor: 'USER',
      },
    ],
    metadata: {
      bookingId: 'bk-849210',
      userId: 'usr-bui-gia-l',
      showtimeId: 'st-05',
      paymentId: 'pay-vn-1192',
      providerRef: 'VNPAY_PENDING_849210',
      correlationId: 'corr-849210-vnpay-pending',
      kafkaTopic: 'cinebook.booking.events',
      kafkaPartition: 0,
      kafkaOffset: 49050,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '123.24.180.19',
    },
    createdAt: '2026-09-15 15:20:00',
    updatedAt: '2026-09-15 15:20:00',
  },
]

function getStoredBookings(): AdminBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_BOOKINGS))
      return INITIAL_ADMIN_BOOKINGS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADMIN_BOOKINGS
  } catch (err) {
    console.error('Failed to load bookings from localStorage:', err)
    return INITIAL_ADMIN_BOOKINGS
  }
}

function saveBookings(bookings: AdminBooking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
  } catch (err) {
    console.error('Failed to save bookings to localStorage:', err)
  }
}

export function getAdminBookings(filters?: Partial<BookingFilterState>): BookingPaginationResult {
  const allBookings = getStoredBookings()

  const search = filters?.search?.trim().toLowerCase() || ''
  const status = filters?.status || 'ALL'
  const paymentStatus = filters?.paymentStatus || 'ALL'
  const movieId = filters?.movieId || 'ALL'
  const theaterId = filters?.theaterId || 'ALL'
  const startDate = filters?.startDate || ''
  const endDate = filters?.endDate || ''
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 10
  const sortBy = filters?.sortBy || 'createdAt'
  const sortOrder = filters?.sortOrder || 'desc'

  let filtered = allBookings.filter((b) => {
    // Search
    if (search) {
      const matchCode = b.bookingCode.toLowerCase().includes(search)
      const matchName = b.customer.fullName.toLowerCase().includes(search)
      const matchEmail = b.customer.email.toLowerCase().includes(search)
      const matchPhone = b.customer.phone.includes(search)
      const matchMovie = b.movie.title.toLowerCase().includes(search)
      const matchId = b.id.toLowerCase().includes(search)
      if (!matchCode && !matchName && !matchEmail && !matchPhone && !matchMovie && !matchId) {
        return false
      }
    }

    // Status filter
    if (status !== 'ALL' && b.status !== status) {
      return false
    }

    // Payment Status filter
    if (paymentStatus !== 'ALL' && b.payment.status !== paymentStatus) {
      return false
    }

    // Movie filter
    if (movieId !== 'ALL' && b.movie.id !== movieId) {
      return false
    }

    // Theater filter
    if (theaterId !== 'ALL' && b.theater.id !== theaterId) {
      return false
    }

    // Date range filter (based on showtime date or createdAt)
    if (startDate) {
      const bDate = b.showtime.date
      if (bDate < startDate) return false
    }
    if (endDate) {
      const bDate = b.showtime.date
      if (bDate > endDate) return false
    }

    return true
  })

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0
    if (sortBy === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortBy === 'finalTotal') {
      comparison = a.pricing.finalTotal - b.pricing.finalTotal
    } else if (sortBy === 'showtimeDate') {
      comparison = `${a.showtime.date} ${a.showtime.startTime}`.localeCompare(
        `${b.showtime.date} ${b.showtime.startTime}`
      )
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

export function getAdminBookingById(id: string): AdminBooking | null {
  const allBookings = getStoredBookings()
  return allBookings.find((b) => b.id === id || b.bookingCode === id) || null
}

export function cancelAdminBooking(
  id: string,
  reason: string
): { success: boolean; message: string; booking?: AdminBooking } {
  const allBookings = getStoredBookings()
  const bookingIndex = allBookings.findIndex((b) => b.id === id || b.bookingCode === id)

  if (bookingIndex === -1) {
    return { success: false, message: 'Không tìm thấy đơn đặt vé trong hệ thống' }
  }

  const booking = allBookings[bookingIndex]

  if (booking.status === 'CANCELLED') {
    return { success: false, message: 'Đơn đặt vé này đã bị hủy trước đó' }
  }

  if (booking.status === 'REFUNDED') {
    return { success: false, message: 'Đơn đặt vé này đã được hoàn tiền, không thể hủy lại' }
  }

  const now = new Date()
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19)

  const newTimelineItem = {
    id: `tl-cancel-${Date.now()}`,
    fromState: booking.status,
    toState: 'CANCELLED' as AdminBookingStatus,
    title: 'Quản trị viên hủy đơn đặt vé',
    description: `Lý do: ${reason.trim() || 'Hủy theo yêu cầu quản trị'}. Ghế ngồi đã được tự động giải phóng vào sơ đồ phòng chiếu.`,
    timestamp: timestampStr,
    actor: 'ADMIN' as const,
    correlationId: `corr-admin-cancel-${Date.now()}`,
  }

  const updatedBooking: AdminBooking = {
    ...booking,
    status: 'CANCELLED',
    timeline: [newTimelineItem, ...booking.timeline],
    updatedAt: timestampStr,
  }

  allBookings[bookingIndex] = updatedBooking
  saveBookings(allBookings)

  return {
    success: true,
    message: `Đã hủy đơn ${booking.bookingCode} thành công. Ghế đã được giải phóng.`,
    booking: updatedBooking,
  }
}

export function requestRefundBooking(
  id: string,
  reason: string
): { success: boolean; message: string; booking?: AdminBooking } {
  const allBookings = getStoredBookings()
  const bookingIndex = allBookings.findIndex((b) => b.id === id || b.bookingCode === id)

  if (bookingIndex === -1) {
    return { success: false, message: 'Không tìm thấy đơn đặt vé trong hệ thống' }
  }

  const booking = allBookings[bookingIndex]

  if (booking.status === 'REFUNDED') {
    return { success: false, message: 'Đơn đặt vé đã hoàn tất hoàn tiền' }
  }

  if (booking.payment.status !== 'SUCCESS') {
    return { success: false, message: 'Đơn hàng chưa thanh toán thành công, không thể thực hiện hoàn tiền' }
  }

  const now = new Date()
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19)

  const newTimelineItem = {
    id: `tl-refund-${Date.now()}`,
    fromState: booking.status,
    toState: 'REFUND_PENDING' as AdminBookingStatus,
    title: 'Yêu cầu hoàn tiền đã ghi nhận',
    description: `Lý do: ${reason.trim() || 'Hoàn tiền theo phê duyệt của Quản trị viên'}. Giao dịch đối soát cổng thanh toán đang xử lý.`,
    timestamp: timestampStr,
    actor: 'ADMIN' as const,
    correlationId: `corr-admin-refund-${Date.now()}`,
  }

  const updatedBooking: AdminBooking = {
    ...booking,
    status: 'REFUND_PENDING',
    timeline: [newTimelineItem, ...booking.timeline],
    updatedAt: timestampStr,
  }

  allBookings[bookingIndex] = updatedBooking
  saveBookings(allBookings)

  return {
    success: true,
    message: `Yêu cầu hoàn tiền đơn ${booking.bookingCode} đã được khởi tạo thành công.`,
    booking: updatedBooking,
  }
}

/**
 * Real client-side CSV Export helper with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportBookingsToCSV(bookings: AdminBooking[]): void {
  if (!bookings || bookings.length === 0) {
    return
  }

  const headers = [
    'Mã Booking',
    'Tên Khách Hàng',
    'Email',
    'Số Điện Thoại',
    'Hạng Hội Viên',
    'Tên Phim',
    'Định Dạng',
    'Cụm Rạp',
    'Phòng Chiếu',
    'Ngày Chiếu',
    'Giờ Chiếu',
    'Ghế Đã Đặt',
    'Số Lượng Ghế',
    'Tiền Ghế (VND)',
    'Tiền Combo (VND)',
    'Giảm Giá (VND)',
    'Tổng Thanh Toán (VND)',
    'Phương Thức',
    'Trạng Thái Thanh Toán',
    'Trạng Thái Booking',
    'Mã Giao Dịch Cổng',
    'Ngày Tạo Đơn',
  ]

  const statusLabels: Record<string, string> = {
    CONFIRMED: 'Đã thanh toán',
    PENDING_PAYMENT: 'Chờ thanh toán',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Hết hạn',
    REFUND_PENDING: 'Chờ hoàn tiền',
    REFUNDED: 'Đã hoàn tiền',
  }

  const paymentStatusLabels: Record<string, string> = {
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

  const rows = bookings.map((b) => {
    const seatNumbers = b.seats.map((s) => s.seatNumber).join(', ')
    return [
      escapeCSV(b.bookingCode),
      escapeCSV(b.customer.fullName),
      escapeCSV(b.customer.email),
      escapeCSV(b.customer.phone),
      escapeCSV(b.customer.membershipTier),
      escapeCSV(b.movie.title),
      escapeCSV(b.movie.format),
      escapeCSV(b.theater.name),
      escapeCSV(b.theater.auditoriumName),
      escapeCSV(b.showtime.date),
      escapeCSV(b.showtime.startTime),
      escapeCSV(seatNumbers),
      escapeCSV(b.seats.length),
      escapeCSV(b.pricing.seatsTotal),
      escapeCSV(b.pricing.comboSnackTotal),
      escapeCSV(b.pricing.discountAmount),
      escapeCSV(b.pricing.finalTotal),
      escapeCSV(b.payment.method),
      escapeCSV(paymentStatusLabels[b.payment.status] || b.payment.status),
      escapeCSV(statusLabels[b.status] || b.status),
      escapeCSV(b.payment.providerRef),
      escapeCSV(b.createdAt),
    ].join(',')
  })

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  const timestamp = new Date().toISOString().slice(0, 10)
  link.setAttribute('href', url)
  link.setAttribute('download', `CineBook_Bookings_${timestamp}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
