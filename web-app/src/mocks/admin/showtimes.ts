import type {
  AdminShowtime,
  ShowtimeFilterState,
  ShowtimeFormData,
  ShowtimePaginationResult,
  ShowtimeConflictInfo,
} from '@/types/admin-showtime'
import type { AdminMovie } from '@/types/admin-movie'
import type { AdminAuditorium, AdminTheater } from '@/types/admin-theater'

const STORAGE_KEY = 'cinebook_admin_showtimes'

// Helper tạo ngày YYYY-MM-DD dựa trên offset từ hôm nay
function getOffsetDateStr(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minutesToTime(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(norm / 60)
  const m = norm % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMin = timeToMinutes(startTime)
  return minutesToTime(startMin + durationMinutes)
}

// 26 Suất chiếu mẫu phong phú kết nối phim & cụm rạp
const INITIAL_ADMIN_SHOWTIMES: AdminShowtime[] = [
  // Landmark 81 - Phòng 01 IMAX Laser (aud-lm-01) - Hôm nay
  {
    id: 'st-lm-01',
    movieId: 'dune-part-two',
    movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    movieDuration: 166,
    movieAgeRating: 'T16',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(0),
    startTime: '09:30',
    endTime: '12:16',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 160000,
    totalSeats: 160,
    bookedSeats: 112,
    affectedBookingsCount: 48,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 10:00',
  },
  {
    id: 'st-lm-02',
    movieId: 'dune-part-two',
    movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    movieDuration: 166,
    movieAgeRating: 'T16',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(0),
    startTime: '13:00',
    endTime: '15:46',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 180000,
    totalSeats: 160,
    bookedSeats: 154,
    affectedBookingsCount: 65,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 14:00',
  },
  {
    id: 'st-lm-03',
    movieId: 'oppenheimer',
    movieTitle: 'Oppenheimer',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
    movieDuration: 180,
    movieAgeRating: 'T18',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(0),
    startTime: '16:30',
    endTime: '19:30',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 190000,
    totalSeats: 160,
    bookedSeats: 160,
    affectedBookingsCount: 72,
    status: 'sold-out',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 16:00',
  },
  {
    id: 'st-lm-04',
    movieId: 'dune-part-two',
    movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    movieDuration: 166,
    movieAgeRating: 'T16',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(0),
    startTime: '20:15',
    endTime: '23:01',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 220000,
    totalSeats: 160,
    bookedSeats: 138,
    affectedBookingsCount: 59,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 18:00',
  },

  // Landmark 81 - Phòng 02 Dolby Atmos (aud-lm-02)
  {
    id: 'st-lm-05',
    movieId: 'godzilla-x-kong',
    movieTitle: 'Godzilla x Kong: Đế Chế Mới',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
    movieDuration: 115,
    movieAgeRating: 'K',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-02',
    auditoriumName: 'Phòng 02 — Dolby Atmos',
    date: getOffsetDateStr(0),
    startTime: '10:00',
    endTime: '11:55',
    cleaningBufferMinutes: 15,
    format: 'Dolby Atmos',
    language: 'Lồng tiếng',
    basePrice: 130000,
    totalSeats: 140,
    bookedSeats: 82,
    affectedBookingsCount: 34,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 10:00',
  },
  {
    id: 'st-lm-06',
    movieId: 'kung-fu-panda-4',
    movieTitle: 'Kung Fu Panda 4',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&auto=format&fit=crop&q=80',
    movieDuration: 94,
    movieAgeRating: 'P',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-02',
    auditoriumName: 'Phòng 02 — Dolby Atmos',
    date: getOffsetDateStr(0),
    startTime: '13:00',
    endTime: '14:34',
    cleaningBufferMinutes: 15,
    format: 'Dolby Atmos',
    language: 'Lồng tiếng',
    basePrice: 120000,
    totalSeats: 140,
    bookedSeats: 124,
    affectedBookingsCount: 48,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 11:00',
  },
  {
    id: 'st-lm-07',
    movieId: 'mai-2024',
    movieTitle: 'Mai',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    movieDuration: 131,
    movieAgeRating: 'T18',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-02',
    auditoriumName: 'Phòng 02 — Dolby Atmos',
    date: getOffsetDateStr(0),
    startTime: '15:15',
    endTime: '17:26',
    cleaningBufferMinutes: 15,
    format: 'Dolby Atmos',
    language: 'Phụ đề',
    basePrice: 140000,
    totalSeats: 140,
    bookedSeats: 98,
    affectedBookingsCount: 41,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 12:00',
  },

  // Vincom Đồng Khởi (cinema-vincom-dong-khoi)
  {
    id: 'st-dk-01',
    movieId: 'deadpool-wolverine',
    movieTitle: 'Deadpool & Wolverine',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    movieDuration: 128,
    movieAgeRating: 'T18',
    theaterId: 'cinema-vincom-dong-khoi',
    theaterName: 'CineBook Vincom Đồng Khởi',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-dk-01',
    auditoriumName: 'Phòng 01 — ScreenX Laser',
    date: getOffsetDateStr(0),
    startTime: '11:00',
    endTime: '13:08',
    cleaningBufferMinutes: 15,
    format: 'ScreenX',
    language: 'Phụ đề',
    basePrice: 150000,
    totalSeats: 130,
    bookedSeats: 88,
    affectedBookingsCount: 36,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 10:00',
  },
  {
    id: 'st-dk-02',
    movieId: 'deadpool-wolverine',
    movieTitle: 'Deadpool & Wolverine',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    movieDuration: 128,
    movieAgeRating: 'T18',
    theaterId: 'cinema-vincom-dong-khoi',
    theaterName: 'CineBook Vincom Đồng Khởi',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-dk-01',
    auditoriumName: 'Phòng 01 — ScreenX Laser',
    date: getOffsetDateStr(0),
    startTime: '14:00',
    endTime: '16:08',
    cleaningBufferMinutes: 15,
    format: 'ScreenX',
    language: 'Phụ đề',
    basePrice: 170000,
    totalSeats: 130,
    bookedSeats: 110,
    affectedBookingsCount: 45,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 11:00',
  },
  {
    id: 'st-dk-03',
    movieId: 'exhuma',
    movieTitle: 'Exhuma: Quật Mộ Trùng Ma',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    movieDuration: 134,
    movieAgeRating: 'T16',
    theaterId: 'cinema-vincom-dong-khoi',
    theaterName: 'CineBook Vincom Đồng Khởi',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-dk-02',
    auditoriumName: 'Phòng 02 — Standard 2D',
    date: getOffsetDateStr(0),
    startTime: '10:30',
    endTime: '12:44',
    cleaningBufferMinutes: 15,
    format: '2D',
    language: 'Phụ đề',
    basePrice: 110000,
    totalSeats: 110,
    bookedSeats: 45,
    affectedBookingsCount: 18,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 09:00',
  },
  {
    id: 'st-dk-04',
    movieId: 'lat-mat-7',
    movieTitle: 'Lật Mặt 7: Một Điều Ước',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&auto=format&fit=crop&q=80',
    movieDuration: 138,
    movieAgeRating: 'K',
    theaterId: 'cinema-vincom-dong-khoi',
    theaterName: 'CineBook Vincom Đồng Khởi',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-dk-02',
    auditoriumName: 'Phòng 02 — Standard 2D',
    date: getOffsetDateStr(0),
    startTime: '13:30',
    endTime: '15:48',
    cleaningBufferMinutes: 15,
    format: '2D',
    language: 'Phụ đề',
    basePrice: 110000,
    totalSeats: 110,
    bookedSeats: 92,
    affectedBookingsCount: 39,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 11:00',
  },

  // Ngày mai (offset 1) - Landmark 81
  {
    id: 'st-lm-10',
    movieId: 'dune-part-two',
    movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    movieDuration: 166,
    movieAgeRating: 'T16',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(1),
    startTime: '10:00',
    endTime: '12:46',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 170000,
    totalSeats: 160,
    bookedSeats: 48,
    affectedBookingsCount: 20,
    status: 'selling',
    createdAt: '2026-09-11 08:00',
    updatedAt: '2026-09-14 10:00',
  },
  {
    id: 'st-lm-11',
    movieId: 'dune-part-two',
    movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    movieDuration: 166,
    movieAgeRating: 'T16',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(1),
    startTime: '13:30',
    endTime: '16:16',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 180000,
    totalSeats: 160,
    bookedSeats: 70,
    affectedBookingsCount: 31,
    status: 'selling',
    createdAt: '2026-09-11 08:00',
    updatedAt: '2026-09-14 10:00',
  },
  {
    id: 'st-lm-12',
    movieId: 'oppenheimer',
    movieTitle: 'Oppenheimer',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
    movieDuration: 180,
    movieAgeRating: 'T18',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(1),
    startTime: '17:00',
    endTime: '20:00',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 200000,
    totalSeats: 160,
    bookedSeats: 85,
    affectedBookingsCount: 38,
    status: 'selling',
    createdAt: '2026-09-11 08:00',
    updatedAt: '2026-09-14 10:00',
  },

  // CGV Vincom Bà Triệu Hà Nội (cinema-cgp-vincom-ba-trieu)
  {
    id: 'st-bt-01',
    movieId: 'dune-part-two',
    movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    movieDuration: 166,
    movieAgeRating: 'T16',
    theaterId: 'cinema-cgp-vincom-ba-trieu',
    theaterName: 'CineBook Vincom Bà Triệu',
    theaterCity: 'Hà Nội',
    auditoriumId: 'aud-bt-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(0),
    startTime: '09:00',
    endTime: '11:46',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 150000,
    totalSeats: 180,
    bookedSeats: 104,
    affectedBookingsCount: 42,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 10:00',
  },
  {
    id: 'st-bt-02',
    movieId: 'oppenheimer',
    movieTitle: 'Oppenheimer',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
    movieDuration: 180,
    movieAgeRating: 'T18',
    theaterId: 'cinema-cgp-vincom-ba-trieu',
    theaterName: 'CineBook Vincom Bà Triệu',
    theaterCity: 'Hà Nội',
    auditoriumId: 'aud-bt-01',
    auditoriumName: 'Phòng 01 — IMAX Laser',
    date: getOffsetDateStr(0),
    startTime: '13:00',
    endTime: '16:00',
    cleaningBufferMinutes: 15,
    format: 'IMAX Laser',
    language: 'Phụ đề',
    basePrice: 180000,
    totalSeats: 180,
    bookedSeats: 165,
    affectedBookingsCount: 68,
    status: 'selling',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 10:00',
  },

  // Suất chiếu đã kết thúc / đã hủy để test bộ lọc status
  {
    id: 'st-old-01',
    movieId: 'kung-fu-panda-4',
    movieTitle: 'Kung Fu Panda 4',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&auto=format&fit=crop&q=80',
    movieDuration: 94,
    movieAgeRating: 'P',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-02',
    auditoriumName: 'Phòng 02 — Dolby Atmos',
    date: getOffsetDateStr(-1),
    startTime: '08:00',
    endTime: '09:34',
    cleaningBufferMinutes: 15,
    format: 'Dolby Atmos',
    language: 'Lồng tiếng',
    basePrice: 110000,
    totalSeats: 140,
    bookedSeats: 115,
    affectedBookingsCount: 0,
    status: 'ended',
    createdAt: '2026-09-08 08:00',
    updatedAt: '2026-09-14 09:40',
  },
  {
    id: 'st-canc-01',
    movieId: 'exhuma',
    movieTitle: 'Exhuma: Quật Mộ Trùng Ma',
    moviePosterUrl:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    movieDuration: 134,
    movieAgeRating: 'T16',
    theaterId: 'cinema-landmark-81',
    theaterName: 'CineBook Landmark 81',
    theaterCity: 'Hồ Chí Minh',
    auditoriumId: 'aud-lm-03',
    auditoriumName: 'Phòng 03 — ScreenX 270°',
    date: getOffsetDateStr(0),
    startTime: '21:30',
    endTime: '23:44',
    cleaningBufferMinutes: 15,
    format: 'ScreenX',
    language: 'Phụ đề',
    basePrice: 140000,
    totalSeats: 120,
    bookedSeats: 0,
    affectedBookingsCount: 12,
    status: 'cancelled',
    createdAt: '2026-09-10 08:00',
    updatedAt: '2026-09-14 12:00',
  },
]

// Initialize storage
function getStoredShowtimes(): AdminShowtime[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_SHOWTIMES))
      return INITIAL_ADMIN_SHOWTIMES
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_ADMIN_SHOWTIMES
  }
}

function saveStoredShowtimes(showtimes: AdminShowtime[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(showtimes))
  } catch (err) {
    console.error('Lỗi khi lưu danh sách suất chiếu:', err)
  }
}

/**
 * Kiểm tra xung đột suất chiếu trong cùng phòng chiếu
 * Quy tắc:
 * 1. Trùng thời gian chiếu (overlap): StartA < EndB && EndA > StartB
 * 2. Khoảng nghỉ dọn phòng (cleaning buffer): Phải cách nhau tối thiểu cleaningBufferMinutes (15p)
 */
export function checkShowtimeConflict(
  auditoriumId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeShowtimeId?: string
): ShowtimeConflictInfo {
  const allShowtimes = getStoredShowtimes()
  const sameRoomShowtimes = allShowtimes.filter(
    (st) =>
      st.auditoriumId === auditoriumId &&
      st.date === date &&
      st.status !== 'cancelled' &&
      st.id !== excludeShowtimeId
  )

  const newStart = timeToMinutes(startTime)
  const newEnd = timeToMinutes(endTime)

  for (const st of sameRoomShowtimes) {
    const curStart = timeToMinutes(st.startTime)
    const curEnd = timeToMinutes(st.endTime)
    const buffer = st.cleaningBufferMinutes || 15

    // 1. Trùng giờ trực tiếp
    if (newStart < curEnd && newEnd > curStart) {
      return {
        hasConflict: true,
        conflictWithShowtime: st,
        reason: `Trùng giờ chiếu với suất "${st.movieTitle}" (${st.startTime} - ${st.endTime})`,
      }
    }

    // 2. Vi phạm khoảng cách dọn phòng (buffer)
    // Nếu suất mới bắt đầu ngay sau suất cũ nhưng chưa đủ buffer
    if (newStart >= curEnd && newStart - curEnd < buffer) {
      return {
        hasConflict: true,
        conflictWithShowtime: st,
        reason: `Khoảng nghỉ sau suất "${st.movieTitle}" (${st.endTime}) chỉ có ${newStart - curEnd} phút (yêu cầu tối thiểu ${buffer} phút dọn phòng)`,
      }
    }

    // Nếu suất cũ bắt đầu sau suất mới nhưng chưa đủ buffer
    if (curStart >= newEnd && curStart - newEnd < buffer) {
      return {
        hasConflict: true,
        conflictWithShowtime: st,
        reason: `Không đủ ${buffer} phút dọn phòng trước suất kế tiếp "${st.movieTitle}" (${st.startTime})`,
      }
    }
  }

  return { hasConflict: false }
}

/**
 * Lấy danh sách suất chiếu kèm bộ lọc, tìm kiếm và phân trang
 */
export async function getAdminShowtimes(
  filters: Partial<ShowtimeFilterState> = {}
): Promise<ShowtimePaginationResult> {
  const all = getStoredShowtimes()

  // Gắn trạng thái conflict động cho từng suất chiếu
  const withConflictCheck = all.map((st) => {
    if (st.status === 'cancelled') {
      return { ...st, hasConflict: false }
    }
    const conflict = checkShowtimeConflict(
      st.auditoriumId,
      st.date,
      st.startTime,
      st.endTime,
      st.id
    )
    return {
      ...st,
      hasConflict: conflict.hasConflict,
      conflictReason: conflict.reason,
    }
  })

  // Lọc
  let filtered = withConflictCheck.filter((item) => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const matchMovie = item.movieTitle.toLowerCase().includes(q)
      const matchTheater = item.theaterName.toLowerCase().includes(q)
      const matchRoom = item.auditoriumName.toLowerCase().includes(q)
      if (!matchMovie && !matchTheater && !matchRoom) return false
    }

    if (filters.theaterId && item.theaterId !== filters.theaterId) return false
    if (filters.auditoriumId && item.auditoriumId !== filters.auditoriumId) return false
    if (filters.movieId && item.movieId !== filters.movieId) return false
    if (filters.format && item.format !== filters.format) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.dateFrom && item.date < filters.dateFrom) return false
    if (filters.dateTo && item.date > filters.dateTo) return false

    return true
  })

  // Sắp xếp
  const sortBy = filters.sortBy || 'date'
  const sortOrder = filters.sortOrder || 'desc'

  filtered.sort((a, b) => {
    let diff = 0
    if (sortBy === 'date') {
      diff = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
    } else if (sortBy === 'startTime') {
      diff = a.startTime.localeCompare(b.startTime)
    } else if (sortBy === 'occupancy') {
      const rateA = a.totalSeats > 0 ? a.bookedSeats / a.totalSeats : 0
      const rateB = b.totalSeats > 0 ? b.bookedSeats / b.totalSeats : 0
      diff = rateA - rateB
    } else if (sortBy === 'price') {
      diff = a.basePrice - b.basePrice
    }
    return sortOrder === 'desc' ? -diff : diff
  })

  const page = filters.page || 1
  const pageSize = filters.pageSize || 10
  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const items = filtered.slice((page - 1) * pageSize, page * pageSize)

  return {
    items,
    totalItems,
    totalPages,
    currentPage: page,
    pageSize,
  }
}

/**
 * Lấy chi tiết suất chiếu
 */
export async function getAdminShowtimeById(id: string): Promise<AdminShowtime | null> {
  const all = getStoredShowtimes()
  const found = all.find((st) => st.id === id)
  if (!found) return null

  const conflict = checkShowtimeConflict(
    found.auditoriumId,
    found.date,
    found.startTime,
    found.endTime,
    found.id
  )

  return {
    ...found,
    hasConflict: conflict.hasConflict,
    conflictReason: conflict.reason,
  }
}

/**
 * Tạo mới suất chiếu
 */
export async function createAdminShowtime(data: ShowtimeFormData): Promise<AdminShowtime> {
  const all = getStoredShowtimes()

  // Lấy thông tin phim từ storage
  const rawMovies = localStorage.getItem('cinebook_admin_movies')
  const movies: AdminMovie[] = rawMovies ? JSON.parse(rawMovies) : []
  const movie = movies.find((m) => m.id === data.movieId)

  // Lấy thông tin rạp & phòng từ storage
  const rawTheaters = localStorage.getItem('cinebook_admin_theaters')
  const theaters: AdminTheater[] = rawTheaters ? JSON.parse(rawTheaters) : []
  const theater = theaters.find((t) => t.id === data.theaterId)

  const rawAuds = localStorage.getItem('cinebook_admin_auditoriums')
  const auditoriums: AdminAuditorium[] = rawAuds ? JSON.parse(rawAuds) : []
  const auditorium = auditoriums.find((a) => a.id === data.auditoriumId)

  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const newId = `st-${Date.now().toString(36)}`

  const newShowtime: AdminShowtime = {
    id: newId,
    movieId: data.movieId,
    movieTitle: movie ? movie.title : 'Phim chiếu rạp',
    moviePosterUrl: movie ? movie.posterUrl : '',
    movieDuration: movie ? movie.duration : 120,
    movieAgeRating: movie ? movie.ageRating : 'P',
    theaterId: data.theaterId,
    theaterName: theater ? theater.name : 'CineBook',
    theaterCity: theater ? theater.city : '',
    auditoriumId: data.auditoriumId,
    auditoriumName: auditorium ? auditorium.name : 'Phòng chiếu',
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    cleaningBufferMinutes: data.cleaningBufferMinutes || 15,
    format: data.format,
    language: data.language,
    basePrice: Number(data.basePrice) || 100000,
    totalSeats: auditorium ? auditorium.totalSeats : 120,
    bookedSeats: 0,
    affectedBookingsCount: 0,
    status: data.status || 'selling',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const updated = [newShowtime, ...all]
  saveStoredShowtimes(updated)
  return newShowtime
}

/**
 * Cập nhật suất chiếu
 */
export async function updateAdminShowtime(
  id: string,
  data: Partial<ShowtimeFormData>
): Promise<AdminShowtime> {
  const all = getStoredShowtimes()
  const index = all.findIndex((st) => st.id === id)
  if (index === -1) {
    throw new Error('Không tìm thấy suất chiếu')
  }

  const current = all[index]

  // Cập nhật thông tin phim nếu đổi
  let movieTitle = current.movieTitle
  let moviePosterUrl = current.moviePosterUrl
  let movieDuration = current.movieDuration
  let movieAgeRating = current.movieAgeRating

  if (data.movieId && data.movieId !== current.movieId) {
    const rawMovies = localStorage.getItem('cinebook_admin_movies')
    const movies: AdminMovie[] = rawMovies ? JSON.parse(rawMovies) : []
    const m = movies.find((item) => item.id === data.movieId)
    if (m) {
      movieTitle = m.title
      moviePosterUrl = m.posterUrl
      movieDuration = m.duration
      movieAgeRating = m.ageRating
    }
  }

  // Cập nhật thông tin rạp và phòng nếu đổi
  let theaterName = current.theaterName
  let theaterCity = current.theaterCity
  let auditoriumName = current.auditoriumName
  let totalSeats = current.totalSeats

  if (data.theaterId && data.theaterId !== current.theaterId) {
    const rawTheaters = localStorage.getItem('cinebook_admin_theaters')
    const theaters: AdminTheater[] = rawTheaters ? JSON.parse(rawTheaters) : []
    const t = theaters.find((item) => item.id === data.theaterId)
    if (t) {
      theaterName = t.name
      theaterCity = t.city
    }
  }

  if (data.auditoriumId && data.auditoriumId !== current.auditoriumId) {
    const rawAuds = localStorage.getItem('cinebook_admin_auditoriums')
    const auditoriums: AdminAuditorium[] = rawAuds ? JSON.parse(rawAuds) : []
    const a = auditoriums.find((item) => item.id === data.auditoriumId)
    if (a) {
      auditoriumName = a.name
      totalSeats = a.totalSeats
    }
  }

  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16)

  const updatedItem: AdminShowtime = {
    ...current,
    movieId: data.movieId ?? current.movieId,
    movieTitle,
    moviePosterUrl,
    movieDuration,
    movieAgeRating,
    theaterId: data.theaterId ?? current.theaterId,
    theaterName,
    theaterCity,
    auditoriumId: data.auditoriumId ?? current.auditoriumId,
    auditoriumName,
    totalSeats,
    date: data.date ?? current.date,
    startTime: data.startTime ?? current.startTime,
    endTime: data.endTime ?? current.endTime,
    cleaningBufferMinutes: data.cleaningBufferMinutes ?? current.cleaningBufferMinutes,
    format: data.format ?? current.format,
    language: data.language ?? current.language,
    basePrice: data.basePrice !== undefined ? Number(data.basePrice) : current.basePrice,
    status: data.status ?? current.status,
    updatedAt: nowStr,
  }

  all[index] = updatedItem
  saveStoredShowtimes(all)
  return updatedItem
}

/**
 * Hủy suất chiếu (Destructive operation)
 */
export async function cancelAdminShowtime(id: string): Promise<AdminShowtime> {
  const all = getStoredShowtimes()
  const index = all.findIndex((st) => st.id === id)
  if (index === -1) {
    throw new Error('Không tìm thấy suất chiếu')
  }

  const current = all[index]
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16)

  const updatedItem: AdminShowtime = {
    ...current,
    status: 'cancelled',
    updatedAt: nowStr,
  }

  all[index] = updatedItem
  saveStoredShowtimes(all)
  return updatedItem
}
