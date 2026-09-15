import type { BookingHistoryItem } from '@/types/booking'

export type BookingFilterCategory = 'all' | 'upcoming' | 'completed' | 'cancelled'

export interface MockBookingRecord extends BookingHistoryItem {
  category: 'upcoming' | 'completed' | 'cancelled'
}

export const MOCK_BOOKINGS: MockBookingRecord[] = [
  {
    id: 'b-1',
    bookingCode: 'CB-849201',
    movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
    poster:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    cinema: 'CineBook Landmark 81',
    room: 'Phòng chiếu 02 - ScreenX',
    showtime: '19:30 • 20/09/2026',
    seats: ['C5', 'C6'],
    total: 190000,
    status: 'CONFIRMED',
    category: 'upcoming',
    createdAt: '14/09/2026',
  },
  {
    id: 'b-2',
    bookingCode: 'CB-612409',
    movieTitle: 'Godzilla x Kong: Đế Chế Mới',
    poster:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    cinema: 'CineBook Saigon Centre',
    room: 'Phòng chiếu 01',
    showtime: '14:00 • 22/09/2026',
    seats: ['D3', 'D4'],
    total: 190000,
    status: 'PENDING',
    category: 'upcoming',
    createdAt: '14/09/2026',
  },
  {
    id: 'b-3',
    bookingCode: 'CB-491203',
    movieTitle: 'Oppenheimer',
    poster:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
    cinema: 'CineBook Landmark 81',
    room: 'Phòng chiếu 03 - IMAX',
    showtime: '20:15 • 10/08/2024',
    seats: ['E7', 'E8'],
    total: 210000,
    status: 'CONFIRMED',
    category: 'completed',
    createdAt: '08/08/2024',
  },
  {
    id: 'b-4',
    bookingCode: 'CB-389104',
    movieTitle: 'Kung Fu Panda 4',
    poster:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    cinema: 'CineBook Vincom Metropolis',
    room: 'Phòng chiếu 04',
    showtime: '10:30 • 15/06/2024',
    seats: ['B5', 'B6'],
    total: 150000,
    status: 'CONFIRMED',
    category: 'completed',
    createdAt: '12/06/2024',
  },
  {
    id: 'b-5',
    bookingCode: 'CB-204918',
    movieTitle: 'Lật Mặt 7: Một Điều Ước',
    poster:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    cinema: 'CineBook Landmark 81',
    room: 'Phòng chiếu 02',
    showtime: '18:00 • 02/05/2024',
    seats: ['A3', 'A4'],
    total: 150000,
    status: 'CANCELLED',
    category: 'cancelled',
    createdAt: '01/05/2024',
  },
  {
    id: 'b-6',
    bookingCode: 'CB-195820',
    movieTitle: 'Deadpool & Wolverine',
    poster:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    cinema: 'CineBook Saigon Centre',
    room: 'Phòng chiếu 01',
    showtime: '21:00 • 28/07/2024',
    seats: ['F1-F2'],
    total: 180000,
    status: 'PAYMENT_FAILED',
    category: 'cancelled',
    createdAt: '28/07/2024',
  },
]
