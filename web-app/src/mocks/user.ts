export type MembershipTier = 'MEMBER' | 'SILVER' | 'GOLD' | 'DIAMOND'

export interface UserProfile {
  id: string
  fullName: string
  email: string
  isEmailVerified: boolean
  phone: string
  birthday: string
  gender: 'male' | 'female' | 'other'
  avatarUrl?: string
  favoriteCinema: string
  favoriteGenres: string[]
  joinDate: string
}

export interface MembershipInfo {
  tier: MembershipTier
  tierName: string
  cardNumber: string
  points: number
  totalSpentThisYear: number
  spendingGoal: number
  validUntil: string
  benefits: string[]
}

export interface PointHistoryItem {
  id: string
  title: string
  points: number
  date: string
  type: 'EARN' | 'REDEEM'
}

export interface RewardItem {
  id: string
  title: string
  pointsCost: number
  category: 'TICKET' | 'COMBO' | 'VOUCHER'
  description: string
  iconName: string
}

export interface UserVoucher {
  id: string
  code: string
  title: string
  discountText: string
  minSpendText: string
  expiresAt: string
  category: 'DISCOUNT' | 'GIFT' | 'VIP'
  isUsed?: boolean
}

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'usr-8899',
  fullName: 'Nguyễn Văn An',
  email: 'nguyenvanan.cine@gmail.com',
  isEmailVerified: true,
  phone: '0912 345 678',
  birthday: '1998-05-20',
  gender: 'male',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  favoriteCinema: 'CineBook Landmark 81',
  favoriteGenres: ['Khoa học viễn tưởng', 'Hành động', 'Phiêu lưu'],
  joinDate: 'Tháng 03/2024',
}

export const MOCK_MEMBERSHIP_INFO: MembershipInfo = {
  tier: 'DIAMOND',
  tierName: 'CineBook VIP Diamond',
  cardNumber: 'CB-8899-2024-VIP',
  points: 1250,
  totalSpentThisYear: 3450000,
  spendingGoal: 5000000,
  validUntil: '31/12/2026',
  benefits: [
    'Tích lũy 10% điểm CinePoints cho mọi giao dịch vé & combo bắp nước',
    'Tặng 02 vé xem phim 2D/3D miễn phí vào tuần lễ sinh nhật',
    'Lối đi ưu tiên tại quầy vé & bắp nước (VIP Express Line)',
    'Giảm 20% các combo bắp nước vào Thứ Tư Vui Vẻ hàng tuần',
    'Miễn phí nâng cấp kích thước bắp nước (Upsize Regular lên Jumbo)',
    'Lời mời độc quyền tham dự các buổi chiếu ra mắt phim sớm (Premiere)',
  ],
}

export const MOCK_POINT_HISTORY: PointHistoryItem[] = [
  {
    id: 'ph-1',
    title: 'Đặt vé Dune 2 tại CineBook Landmark 81',
    points: 190,
    date: '14/09/2026 15:30',
    type: 'EARN',
  },
  {
    id: 'ph-2',
    title: 'Đổi combo bắp nước Solo Caramel',
    points: -300,
    date: '02/09/2026 18:20',
    type: 'REDEEM',
  },
  {
    id: 'ph-3',
    title: 'Đặt vé Godzilla x Kong tại CineBook Saigon Centre',
    points: 190,
    date: '28/08/2026 20:10',
    type: 'EARN',
  },
  {
    id: 'ph-4',
    title: 'Thưởng sinh nhật thành viên VIP Diamond',
    points: 500,
    date: '20/05/2026 09:00',
    type: 'EARN',
  },
  {
    id: 'ph-5',
    title: 'Đổi vé 2D tiêu chuẩn rạp Landmark 81',
    points: -500,
    date: '01/05/2026 14:15',
    type: 'REDEEM',
  },
]

export const MOCK_REWARDS: RewardItem[] = [
  {
    id: 'rw-ticket-2d',
    title: 'Vé Xem Phim 2D Tiêu Chuẩn',
    pointsCost: 500,
    category: 'TICKET',
    description: 'Áp dụng cho mọi phòng chiếu tiêu chuẩn 2D tất cả các ngày trong tuần.',
    iconName: 'Ticket',
  },
  {
    id: 'rw-combo-solo',
    title: 'Combo Bắp Nước Solo Thơm Ngon',
    pointsCost: 300,
    category: 'COMBO',
    description: 'Gồm 01 bắp rang bơ ngọt 69oz và 01 nước ngọt có gas 22oz.',
    iconName: 'Coffee',
  },
  {
    id: 'rw-voucher-50k',
    title: 'Phiếu Giảm Giá 50.000đ',
    pointsCost: 200,
    category: 'VOUCHER',
    description: 'Giảm trực tiếp 50.000đ khi đặt vé online đơn từ 150.000đ.',
    iconName: 'Percent',
  },
  {
    id: 'rw-combo-couple',
    title: 'Combo Couple Sweetbox',
    pointsCost: 450,
    category: 'COMBO',
    description: 'Gồm 01 bắp rang phô mai 85oz và 02 nước ngọt có gas lớn.',
    iconName: 'Sparkles',
  },
]

export const MOCK_VOUCHERS: UserVoucher[] = [
  {
    id: 'vc-1',
    code: 'VOUCHER50K',
    title: 'Ưu Đãi Đặt Vé Online Tháng 9',
    discountText: 'Giảm 50.000đ',
    minSpendText: 'Đơn từ 150.000đ',
    expiresAt: '30/09/2026',
    category: 'DISCOUNT',
  },
  {
    id: 'vc-2',
    code: 'BAPNUOCFREE',
    title: 'Tặng Bắp Ngọt 69oz Miễn Phí',
    discountText: 'Miễn phí 01 Bắp 69oz',
    minSpendText: 'Khi mua từ 02 vé xem phim',
    expiresAt: '15/10/2026',
    category: 'GIFT',
  },
  {
    id: 'vc-3',
    code: 'SINHNHATVIP',
    title: 'Đặc Quyền Hội Viên VIP Diamond',
    discountText: '01 Vé 2D Miễn Phí',
    minSpendText: 'Áp dụng toàn bộ hệ thống rạp',
    expiresAt: '31/10/2026',
    category: 'VIP',
  },
]
