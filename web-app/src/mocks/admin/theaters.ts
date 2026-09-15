import type {
  AdminTheater,
  AdminAuditorium,
  AdminTheaterStatus,
  AuditoriumStatus,
  TheaterFilterState,
  TheaterPaginationResult,
  TheaterFormData,
  AuditoriumFormData,
} from '@/types/admin-theater'
import { MOCK_CINEMAS } from '@/mocks/cinemas'

const STORAGE_THEATERS_KEY = 'cinebook_admin_theaters'
const STORAGE_AUDITORIUMS_KEY = 'cinebook_admin_auditoriums'

export const DEFAULT_THEATER_FEATURES = [
  'IMAX Laser',
  '4DX Dynamic',
  'ScreenX 270°',
  'Dolby Atmos',
  'Ghế Sweetbox Đôi',
  'VIP Lounge Chờ',
  'Bãi Đỗ Xe Ô Tô',
  'Bãi Đỗ Xe Máy',
  'Quầy Bắp Nước Cao Cấp',
  'Lối Đi Người Khuyết Tật',
  'Máy Bán Vé Tự Động',
]

// Initial seed auditoriums for existing cinemas
const INITIAL_AUDITORIUMS: AdminAuditorium[] = [
  // Landmark 81
  {
    id: 'aud-lm-01',
    theaterId: 'cinema-landmark-81',
    name: 'Phòng 01 — IMAX Laser',
    format: 'IMAX Laser',
    totalSeats: 160,
    activeShowtimesCount: 6,
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2026-09-12',
  },
  {
    id: 'aud-lm-02',
    theaterId: 'cinema-landmark-81',
    name: 'Phòng 02 — Dolby Atmos',
    format: 'Dolby Atmos',
    totalSeats: 140,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2026-09-14',
  },
  {
    id: 'aud-lm-03',
    theaterId: 'cinema-landmark-81',
    name: 'Phòng 03 — ScreenX 270°',
    format: 'ScreenX',
    totalSeats: 120,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-01-15',
    updatedAt: '2026-09-10',
  },
  {
    id: 'aud-lm-04',
    theaterId: 'cinema-landmark-81',
    name: 'Phòng 04 — Standard 2D Digital',
    format: '2D',
    totalSeats: 120,
    activeShowtimesCount: 6,
    status: 'active',
    createdAt: '2025-01-15',
    updatedAt: '2026-09-11',
  },
  {
    id: 'aud-lm-05',
    theaterId: 'cinema-landmark-81',
    name: 'Phòng 05 — 4DX Motion',
    format: '4DX',
    totalSeats: 96,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2026-09-08',
  },
  {
    id: 'aud-lm-06',
    theaterId: 'cinema-landmark-81',
    name: 'Phòng 06 — VIP Gold Class',
    format: '2D',
    totalSeats: 48,
    activeShowtimesCount: 3,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2026-09-13',
  },
  {
    id: 'aud-lm-07',
    theaterId: 'cinema-landmark-81',
    name: 'Phòng 07 — Standard 2D Digital',
    format: '2D',
    totalSeats: 110,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-02-10',
    updatedAt: '2026-09-12',
  },
  {
    id: 'aud-lm-08',
    theaterId: 'cinema-landmark-81',
    name: 'Phòng 08 — 3D Laser Digital',
    format: '3D',
    totalSeats: 110,
    activeShowtimesCount: 0,
    status: 'maintenance',
    createdAt: '2025-02-10',
    updatedAt: '2026-09-15',
  },

  // Vincom Đồng Khởi
  {
    id: 'aud-dk-01',
    theaterId: 'cinema-vincom-dong-khoi',
    name: 'Phòng 01 — Dolby Atmos Laser',
    format: 'Dolby Atmos',
    totalSeats: 150,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2026-09-11',
  },
  {
    id: 'aud-dk-02',
    theaterId: 'cinema-vincom-dong-khoi',
    name: 'Phòng 02 — Standard 2D Digital',
    format: '2D',
    totalSeats: 120,
    activeShowtimesCount: 6,
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2026-09-13',
  },
  {
    id: 'aud-dk-03',
    theaterId: 'cinema-vincom-dong-khoi',
    name: 'Phòng 03 — 3D Laser Digital',
    format: '3D',
    totalSeats: 120,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-01-15',
    updatedAt: '2026-09-12',
  },
  {
    id: 'aud-dk-04',
    theaterId: 'cinema-vincom-dong-khoi',
    name: 'Phòng 04 — Standard 2D Digital',
    format: '2D',
    totalSeats: 110,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-01-20',
    updatedAt: '2026-09-10',
  },
  {
    id: 'aud-dk-05',
    theaterId: 'cinema-vincom-dong-khoi',
    name: 'Phòng 05 — VIP Gold Class',
    format: '2D',
    totalSeats: 48,
    activeShowtimesCount: 3,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2026-09-14',
  },
  {
    id: 'aud-dk-06',
    theaterId: 'cinema-vincom-dong-khoi',
    name: 'Phòng 06 — Standard 2D Digital',
    format: '2D',
    totalSeats: 100,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2026-09-12',
  },

  // Vincom Bà Triệu (Hà Nội)
  {
    id: 'aud-bt-01',
    theaterId: 'cinema-vincom-ba-trieu',
    name: 'Phòng 01 — IMAX Laser',
    format: 'IMAX Laser',
    totalSeats: 180,
    activeShowtimesCount: 6,
    status: 'active',
    createdAt: '2025-01-05',
    updatedAt: '2026-09-14',
  },
  {
    id: 'aud-bt-02',
    theaterId: 'cinema-vincom-ba-trieu',
    name: 'Phòng 02 — Dolby Atmos',
    format: 'Dolby Atmos',
    totalSeats: 150,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-01-05',
    updatedAt: '2026-09-13',
  },
  {
    id: 'aud-bt-03',
    theaterId: 'cinema-vincom-ba-trieu',
    name: 'Phòng 03 — 4DX Motion',
    format: '4DX',
    totalSeats: 96,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2026-09-10',
  },
  {
    id: 'aud-bt-04',
    theaterId: 'cinema-vincom-ba-trieu',
    name: 'Phòng 04 — Standard 2D Digital',
    format: '2D',
    totalSeats: 120,
    activeShowtimesCount: 6,
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2026-09-11',
  },
  {
    id: 'aud-bt-05',
    theaterId: 'cinema-vincom-ba-trieu',
    name: 'Phòng 05 — Standard 2D Digital',
    format: '2D',
    totalSeats: 110,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2026-09-12',
  },
  {
    id: 'aud-bt-06',
    theaterId: 'cinema-vincom-ba-trieu',
    name: 'Phòng 06 — 3D Laser Digital',
    format: '3D',
    totalSeats: 110,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2026-09-13',
  },
  {
    id: 'aud-bt-07',
    theaterId: 'cinema-vincom-ba-trieu',
    name: 'Phòng 07 — VIP Sweetbox',
    format: '2D',
    totalSeats: 60,
    activeShowtimesCount: 3,
    status: 'active',
    createdAt: '2025-02-15',
    updatedAt: '2026-09-14',
  },

  // Vincom Trần Duy Hưng (Hà Nội)
  {
    id: 'aud-tdh-01',
    theaterId: 'cinema-vincom-tran-duy-hung',
    name: 'Phòng 01 — ScreenX 270°',
    format: 'ScreenX',
    totalSeats: 130,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2026-09-12',
  },
  {
    id: 'aud-tdh-02',
    theaterId: 'cinema-vincom-tran-duy-hung',
    name: 'Phòng 02 — Dolby Atmos',
    format: 'Dolby Atmos',
    totalSeats: 140,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2026-09-13',
  },
  {
    id: 'aud-tdh-03',
    theaterId: 'cinema-vincom-tran-duy-hung',
    name: 'Phòng 03 — Standard 2D Digital',
    format: '2D',
    totalSeats: 110,
    activeShowtimesCount: 6,
    status: 'active',
    createdAt: '2025-02-10',
    updatedAt: '2026-09-11',
  },
  {
    id: 'aud-tdh-04',
    theaterId: 'cinema-vincom-tran-duy-hung',
    name: 'Phòng 04 — Standard 2D Digital',
    format: '2D',
    totalSeats: 110,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-02-10',
    updatedAt: '2026-09-10',
  },
  {
    id: 'aud-tdh-05',
    theaterId: 'cinema-vincom-tran-duy-hung',
    name: 'Phòng 05 — 3D Digital',
    format: '3D',
    totalSeats: 100,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-03-01',
    updatedAt: '2026-09-12',
  },
  {
    id: 'aud-tdh-06',
    theaterId: 'cinema-vincom-tran-duy-hung',
    name: 'Phòng 06 — Standard 2D Digital',
    format: '2D',
    totalSeats: 90,
    activeShowtimesCount: 0,
    status: 'maintenance',
    createdAt: '2025-03-01',
    updatedAt: '2026-09-15',
  },

  // Vincom Ngô Quyền (Đà Nẵng)
  {
    id: 'aud-nq-01',
    theaterId: 'cinema-vincom-ngo-quyen',
    name: 'Phòng 01 — Dolby Atmos',
    format: 'Dolby Atmos',
    totalSeats: 140,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-03-01',
    updatedAt: '2026-09-14',
  },
  {
    id: 'aud-nq-02',
    theaterId: 'cinema-vincom-ngo-quyen',
    name: 'Phòng 02 — Standard 2D Digital',
    format: '2D',
    totalSeats: 120,
    activeShowtimesCount: 5,
    status: 'active',
    createdAt: '2025-03-01',
    updatedAt: '2026-09-12',
  },
  {
    id: 'aud-nq-03',
    theaterId: 'cinema-vincom-ngo-quyen',
    name: 'Phòng 03 — 3D Laser Digital',
    format: '3D',
    totalSeats: 110,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-03-10',
    updatedAt: '2026-09-11',
  },
  {
    id: 'aud-nq-04',
    theaterId: 'cinema-vincom-ngo-quyen',
    name: 'Phòng 04 — Standard 2D Digital',
    format: '2D',
    totalSeats: 100,
    activeShowtimesCount: 4,
    status: 'active',
    createdAt: '2025-03-10',
    updatedAt: '2026-09-10',
  },
  {
    id: 'aud-nq-05',
    theaterId: 'cinema-vincom-ngo-quyen',
    name: 'Phòng 05 — VIP Gold Class',
    format: '2D',
    totalSeats: 50,
    activeShowtimesCount: 3,
    status: 'active',
    createdAt: '2025-03-15',
    updatedAt: '2026-09-13',
  },
]

// Seed theaters based on MOCK_CINEMAS + additional regional cinemas
const INITIAL_THEATERS: AdminTheater[] = [
  ...MOCK_CINEMAS.map((c) => {
    const auds = INITIAL_AUDITORIUMS.filter((a) => a.theaterId === c.id)
    const totalSeats = auds.reduce((sum, a) => sum + a.totalSeats, 0) || 750
    const todayShowtimesCount = auds.reduce((sum, a) => sum + a.activeShowtimesCount, 0) || 28

    return {
      id: c.id,
      name: c.name,
      address: c.address,
      city: c.city,
      hotline: c.hotline || '1900 6868',
      openingHours: c.openingHours || '08:00 - 01:00 (Hàng ngày)',
      features: c.features || ['IMAX Laser', 'Dolby Atmos', 'Ghế Sweetbox Đôi', 'VIP Lounge'],
      imageUrl:
        c.imageUrl ||
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
      status: 'active' as AdminTheaterStatus,
      totalRooms: c.totalRooms || auds.length || 6,
      totalSeats,
      todayShowtimesCount,
      createdAt: '2025-01-01',
      updatedAt: '2026-09-14',
    }
  }),
  // Extra regional branches
  {
    id: 'cinema-vincom-hai-phong',
    name: 'CineBook Vincom Lê Thánh Tông',
    address: 'Tầng 4, TTTM Vincom Plaza, Số 1 Lê Thánh Tông, P. Máy Tơ, Ngô Quyền, Hải Phòng',
    city: 'Hải Phòng',
    hotline: '1900 6868 - Ext 106',
    openingHours: '08:30 - 23:30 (Hàng ngày)',
    features: ['Dolby Atmos', 'Ghế Sweetbox Đôi', 'Bãi Đỗ Xe Ô Tô', 'Quầy Bắp Nước Cao Cấp'],
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    totalRooms: 5,
    totalSeats: 580,
    todayShowtimesCount: 22,
    createdAt: '2025-04-01',
    updatedAt: '2026-09-11',
  },
  {
    id: 'cinema-vincom-hung-vuong-can-tho',
    name: 'CineBook Vincom Hùng Vương Cần Thơ',
    address: 'Số 2 Hùng Vương, P. Thới Bình, Q. Ninh Kiều, TP. Cần Thơ',
    city: 'Cần Thơ',
    hotline: '1900 6868 - Ext 107',
    openingHours: '08:30 - 23:30 (Hàng ngày)',
    features: ['Dolby Atmos', 'Ghế Sweetbox Đôi', 'VIP Lounge Chờ', 'Bãi Đỗ Xe Máy'],
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    totalRooms: 4,
    totalSeats: 460,
    todayShowtimesCount: 18,
    createdAt: '2025-05-15',
    updatedAt: '2026-09-10',
  },
  {
    id: 'cinema-vincom-tran-phu-nha-trang',
    name: 'CineBook Vincom Plaza Trần Phú Nha Trang',
    address: '78-80 Trần Phú, Lộc Thọ, TP. Nha Trang, Khánh Hòa',
    city: 'Khánh Hòa',
    hotline: '1900 6868 - Ext 108',
    openingHours: '09:00 - 23:00 (Hàng ngày)',
    features: ['ScreenX 270°', 'Ghế Sweetbox Đôi', 'Quầy Bắp Nước Cao Cấp'],
    imageUrl: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&auto=format&fit=crop&q=80',
    status: 'maintenance',
    totalRooms: 4,
    totalSeats: 420,
    todayShowtimesCount: 0,
    createdAt: '2025-06-01',
    updatedAt: '2026-09-15',
  },
]

// Storage helpers
function loadTheaters(): AdminTheater[] {
  try {
    const raw = localStorage.getItem(STORAGE_THEATERS_KEY)
    if (!raw) {
      saveTheaters(INITIAL_THEATERS)
      return INITIAL_THEATERS
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_THEATERS
  }
}

function saveTheaters(items: AdminTheater[]) {
  try {
    localStorage.setItem(STORAGE_THEATERS_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Failed to save admin theaters to localStorage:', err)
  }
}

function loadAuditoriums(): AdminAuditorium[] {
  try {
    const raw = localStorage.getItem(STORAGE_AUDITORIUMS_KEY)
    if (!raw) {
      saveAuditoriums(INITIAL_AUDITORIUMS)
      return INITIAL_AUDITORIUMS
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_AUDITORIUMS
  }
}

function saveAuditoriums(items: AdminAuditorium[]) {
  try {
    localStorage.setItem(STORAGE_AUDITORIUMS_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Failed to save admin auditoriums to localStorage:', err)
  }
}

/**
 * Lấy danh sách rạp kèm bộ lọc, tìm kiếm, sắp xếp và phân trang
 */
export async function getAdminTheaters(
  filters: Partial<TheaterFilterState> = {}
): Promise<TheaterPaginationResult> {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 120))

  let list = loadTheaters()

  // 1. Search (by name or address)
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim()
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q)
    )
  }

  // 2. City Filter
  if (filters.city && filters.city !== 'all') {
    list = list.filter((t) => t.city === filters.city)
  }

  // 3. Status Filter
  if (filters.status && filters.status !== 'all') {
    list = list.filter((t) => t.status === filters.status)
  }

  // 4. Sorting
  list.sort((a, b) => {
    let comparison = 0
    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'vi')
        break
      case 'city':
        comparison = a.city.localeCompare(b.city, 'vi')
        break
      case 'totalRooms':
        comparison = a.totalRooms - b.totalRooms
        break
      case 'totalSeats':
        comparison = a.totalSeats - b.totalSeats
        break
      case 'todayShowtimes':
        comparison = a.todayShowtimesCount - b.todayShowtimesCount
        break
      default:
        comparison = a.name.localeCompare(b.name, 'vi')
    }
    return filters.sortOrder === 'asc' ? comparison : -comparison
  })

  // 5. Pagination
  const total = list.length
  const page = Math.max(1, filters.page || 1)
  const pageSize = Math.max(1, filters.pageSize || 10)
  const totalPages = Math.ceil(total / pageSize) || 1
  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Lấy chi tiết một cụm rạp theo ID
 */
export async function getAdminTheaterById(id: string): Promise<AdminTheater | null> {
  await new Promise((res) => setTimeout(res, 80))
  const list = loadTheaters()
  const found = list.find((t) => t.id === id)
  if (!found) return null

  // Attach auditoriums
  const allAuds = loadAuditoriums()
  const theaterAuds = allAuds.filter((a) => a.theaterId === id)

  return {
    ...found,
    auditoriums: theaterAuds,
    totalRooms: theaterAuds.length > 0 ? theaterAuds.length : found.totalRooms,
    totalSeats:
      theaterAuds.length > 0
        ? theaterAuds.reduce((sum, a) => sum + a.totalSeats, 0)
        : found.totalSeats,
  }
}

/**
 * Tạo mới một cụm rạp
 */
export async function createAdminTheater(data: TheaterFormData): Promise<AdminTheater> {
  await new Promise((res) => setTimeout(res, 200))
  const list = loadTheaters()

  const slugId =
    'cinema-' +
    data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Date.now().toString().slice(-4)

  const newTheater: AdminTheater = {
    id: slugId,
    name: data.name.trim(),
    address: data.address.trim(),
    city: data.city.trim(),
    hotline: data.hotline.trim() || '1900 6868',
    openingHours: data.openingHours.trim() || '08:00 - 24:00 (Hàng ngày)',
    features: data.features.length > 0 ? data.features : ['Dolby Atmos', 'Ghế Sweetbox Đôi'],
    imageUrl:
      data.imageUrl.trim() ||
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
    status: data.status,
    totalRooms: 1,
    totalSeats: 120,
    todayShowtimesCount: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  // Create default auditorium for the new theater
  const auds = loadAuditoriums()
  const defaultAud: AdminAuditorium = {
    id: `aud-${slugId}-01`,
    theaterId: slugId,
    name: 'Phòng 01 — Standard 2D Digital',
    format: '2D',
    totalSeats: 120,
    activeShowtimesCount: 0,
    status: 'active',
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  auds.push(defaultAud)
  saveAuditoriums(auds)

  list.unshift(newTheater)
  saveTheaters(list)

  return newTheater
}

/**
 * Cập nhật thông tin cụm rạp
 */
export async function updateAdminTheater(
  id: string,
  data: Partial<TheaterFormData>
): Promise<AdminTheater | null> {
  await new Promise((res) => setTimeout(res, 200))
  const list = loadTheaters()
  const idx = list.findIndex((t) => t.id === id)
  if (idx === -1) return null

  const updated: AdminTheater = {
    ...list[idx],
    ...data,
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  list[idx] = updated
  saveTheaters(list)
  return updated
}

/**
 * Cập nhật nhanh trạng thái hoạt động của rạp
 */
export async function updateTheaterStatus(
  id: string,
  status: AdminTheaterStatus
): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 100))
  const list = loadTheaters()
  const target = list.find((t) => t.id === id)
  if (!target) return false

  target.status = status
  target.updatedAt = new Date().toISOString().slice(0, 10)
  saveTheaters(list)
  return true
}

/**
 * Lấy danh sách thành phố có rạp
 */
export function getAllCities(): string[] {
  const list = loadTheaters()
  const set = new Set<string>()
  list.forEach((t) => {
    if (t.city) set.add(t.city)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
}

/**
 * Lấy danh sách các phòng chiếu theo Theater ID
 */
export async function getAuditoriumsByTheaterId(
  theaterId: string
): Promise<AdminAuditorium[]> {
  await new Promise((res) => setTimeout(res, 60))
  const allAuds = loadAuditoriums()
  return allAuds.filter((a) => a.theaterId === theaterId)
}

/**
 * Thêm mới một phòng chiếu cho rạp
 * Lưu ý: totalSeats được khởi tạo mặc định theo format chuẩn, sau đó được tính từ Sơ đồ ghế
 */
export async function createAuditorium(
  theaterId: string,
  data: AuditoriumFormData
): Promise<AdminAuditorium> {
  await new Promise((res) => setTimeout(res, 150))
  const auds = loadAuditoriums()

  // Default initial seats based on format
  let initialSeats = 120
  if (data.format === 'IMAX Laser') initialSeats = 160
  if (data.format === 'ScreenX') initialSeats = 130
  if (data.format === '4DX') initialSeats = 96

  const newAud: AdminAuditorium = {
    id: `aud-${theaterId}-${Date.now().toString().slice(-4)}`,
    theaterId,
    name: data.name.trim(),
    format: data.format,
    totalSeats: initialSeats,
    activeShowtimesCount: 0,
    status: data.status,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  auds.push(newAud)
  saveAuditoriums(auds)

  // Recalculate theater total rooms and seats
  const theaters = loadTheaters()
  const targetTheater = theaters.find((t) => t.id === theaterId)
  if (targetTheater) {
    const theaterAuds = auds.filter((a) => a.theaterId === theaterId)
    targetTheater.totalRooms = theaterAuds.length
    targetTheater.totalSeats = theaterAuds.reduce((sum, a) => sum + a.totalSeats, 0)
    targetTheater.updatedAt = new Date().toISOString().slice(0, 10)
    saveTheaters(theaters)
  }

  return newAud
}

/**
 * Cập nhật thông tin phòng chiếu (Tên, Format, Status)
 * Lưu ý: Không cho sửa totalSeats độc lập vì derived từ layout!
 */
export async function updateAuditorium(
  auditoriumId: string,
  data: Partial<AuditoriumFormData>
): Promise<AdminAuditorium | null> {
  await new Promise((res) => setTimeout(res, 150))
  const auds = loadAuditoriums()
  const idx = auds.findIndex((a) => a.id === auditoriumId)
  if (idx === -1) return null

  const target = auds[idx]
  const updated: AdminAuditorium = {
    ...target,
    name: data.name !== undefined ? data.name.trim() : target.name,
    format: data.format !== undefined ? data.format : target.format,
    status: data.status !== undefined ? data.status : target.status,
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  auds[idx] = updated
  saveAuditoriums(auds)
  return updated
}

/**
 * Đổi nhanh trạng thái phòng chiếu
 */
export async function updateAuditoriumStatus(
  auditoriumId: string,
  status: AuditoriumStatus
): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 80))
  const auds = loadAuditoriums()
  const target = auds.find((a) => a.id === auditoriumId)
  if (!target) return false

  target.status = status
  target.updatedAt = new Date().toISOString().slice(0, 10)
  saveAuditoriums(auds)
  return true
}

/**
 * Lấy danh sách suất chiếu hôm nay của rạp
 */
export async function getTodayShowtimesByTheater(theaterId: string): Promise<any[]> {
  await new Promise((res) => setTimeout(res, 100))
  const cinema = MOCK_CINEMAS.find((c) => c.id === theaterId)
  if (!cinema) return []

  const results: any[] = []
  if (cinema.movieSchedules) {
    cinema.movieSchedules.forEach((schedule) => {
      schedule.showtimes.forEach((st) => {
        results.push({
          id: st.id,
          movieId: schedule.movieId,
          movieTitle: schedule.movieTitle,
          posterUrl: schedule.posterUrl,
          ageRating: schedule.ageRating || 'T16',
          format: st.format,
          startTime: st.startTime,
          endTime: st.endTime,
          roomName: `Phòng ${(st.format || '').includes('IMAX') ? '01 — IMAX Laser' : '02 — Standard'}`,
          remainingSeats: st.remainingSeats ?? 45,
          totalSeats: st.totalSeats ?? 120,
          occupancyRate: Math.round(
            (((st.totalSeats ?? 120) - (st.remainingSeats ?? 45)) /
              (st.totalSeats ?? 120)) *
              100
          ),
          soldOut: st.soldOut ?? false,
          status: st.soldOut ? 'SOLD_OUT' : 'PLAYING',
        })
      })
    })
  } else if (cinema.showtimes) {
    cinema.showtimes.forEach((st) => {
      results.push({
        id: st.id,
        movieId: 'dune-part-two',
        movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
        posterUrl:
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        ageRating: 'T16',
        format: st.format,
        startTime: st.startTime,
        endTime: st.endTime,
        roomName: 'Phòng 01 — Standard',
        remainingSeats: st.remainingSeats ?? 30,
        totalSeats: st.totalSeats ?? 120,
        occupancyRate: 75,
        soldOut: st.soldOut ?? false,
        status: 'PLAYING',
      })
    })
  }

  return results
}
