import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Plus,
  Search,
  X,
  AlertTriangle,
  RotateCcw,
  List,
  CalendarDays,
  Building2,
  Tv,
  Eye,
  Edit,
  Ban,
} from 'lucide-react'
import type {
  AdminShowtime,
  ShowtimeFilterState,
} from '@/types/admin-showtime'
import type { AdminMovie } from '@/types/admin-movie'
import type { AdminTheater, AdminAuditorium } from '@/types/admin-theater'
import {
  getAdminShowtimes,
  cancelAdminShowtime,
  timeToMinutes,
} from '@/mocks/admin/showtimes'
import { getAdminTheaters, getAuditoriumsByTheaterId } from '@/mocks/admin/theaters'
import { getAdminMovies } from '@/mocks/admin/movies'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { AdminPagination } from '@/components/admin/common/admin-pagination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

// Helpers
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateVN(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function getDayOfWeekVN(isoDate: string): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return days[d.getDay()]
}

export default function AdminShowtimeList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // View mode: 'table' | 'timeline'
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>(
    (searchParams.get('view') as 'table' | 'timeline') || 'table'
  )

  // Data states
  const [showtimes, setShowtimes] = useState<AdminShowtime[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Options for filters
  const [theaters, setTheaters] = useState<AdminTheater[]>([])
  const [auditoriums, setAuditoriums] = useState<AdminAuditorium[]>([])
  const [movies, setMovies] = useState<AdminMovie[]>([])

  // Cancel dialog state
  const [cancellingShowtime, setCancellingShowtime] = useState<AdminShowtime | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Active timeline date
  const [timelineDate, setTimelineDate] = useState<string>(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })

  // Selected showtime in timeline popover
  const [activeTimelineItem, setActiveTimelineItem] = useState<AdminShowtime | null>(null)

  // Filter state
  const filters: ShowtimeFilterState = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      theaterId: searchParams.get('theaterId') || '',
      auditoriumId: searchParams.get('auditoriumId') || '',
      movieId: searchParams.get('movieId') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      format: searchParams.get('format') || '',
      status: searchParams.get('status') || '',
      sortBy: (searchParams.get('sortBy') as any) || 'date',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '10', 10),
    }
  }, [searchParams])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.theaterId) count++
    if (filters.auditoriumId) count++
    if (filters.movieId) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.format) count++
    if (filters.status) count++
    return count
  }, [filters])

  // Update query params helper
  const updateFilter = useCallback(
    (key: keyof ShowtimeFilterState, value: string | number) => {
      const newParams = new URLSearchParams(searchParams)
      if (value === '' || value === 'all' || value === undefined) {
        newParams.delete(key)
      } else {
        newParams.set(key, String(value))
      }
      // Reset to page 1 on filter changes
      if (key !== 'page' && key !== 'pageSize') {
        newParams.delete('page')
      }
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const handleResetFilters = () => {
    const newParams = new URLSearchParams()
    if (viewMode === 'timeline') newParams.set('view', 'timeline')
    setSearchParams(newParams, { replace: true })
  }

  // Load theaters and movies for filters
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const thRes = await getAdminTheaters({ pageSize: 100 })
        setTheaters(thRes.items)

        const mvRes = await getAdminMovies({ pageSize: 100 })
        setMovies(mvRes.items)
      } catch (err) {
        console.error('Lỗi khi tải danh mục rạp và phim:', err)
      }
    }
    loadPrerequisites()
  }, [])

  // Load auditoriums when theater changes
  useEffect(() => {
    let isCancelled = false
    const loadAuds = async () => {
      if (filters.theaterId) {
        const auds = await getAuditoriumsByTheaterId(filters.theaterId)
        if (!isCancelled) {
          setAuditoriums(auds)
          if (filters.auditoriumId && !auds.some((a) => a.id === filters.auditoriumId)) {
            updateFilter('auditoriumId', '')
          }
        }
      } else {
        const rawAuds = localStorage.getItem('cinebook_admin_auditoriums')
        const allAuds: AdminAuditorium[] = rawAuds ? JSON.parse(rawAuds) : []
        if (!isCancelled) setAuditoriums(allAuds)
      }
    }
    loadAuds()
    return () => {
      isCancelled = true
    }
  }, [filters.theaterId, filters.auditoriumId, updateFilter])

  // Load showtimes
  const loadShowtimes = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAdminShowtimes({
        ...filters,
        pageSize: viewMode === 'timeline' ? 100 : filters.pageSize,
        dateFrom: viewMode === 'timeline' ? timelineDate : filters.dateFrom,
        dateTo: viewMode === 'timeline' ? timelineDate : filters.dateTo,
      })
      setShowtimes(res.items)
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error('Lỗi tải danh sách suất chiếu:', err)
      toast.error('Không thể tải danh sách suất chiếu')
    } finally {
      setIsLoading(false)
    }
  }, [filters, viewMode, timelineDate])

  useEffect(() => {
    loadShowtimes()
  }, [loadShowtimes])

  // Change view mode
  const handleToggleView = (mode: 'table' | 'timeline') => {
    setViewMode(mode)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('view', mode)
    setSearchParams(newParams, { replace: true })
  }

  // Handle Cancel Showtime
  const handleConfirmCancel = async () => {
    if (!cancellingShowtime) return

    try {
      setIsCancelling(true)
      await cancelAdminShowtime(cancellingShowtime.id)
      toast.success(
        `Đã hủy suất chiếu "${cancellingShowtime.movieTitle}" (${cancellingShowtime.startTime} - ${cancellingShowtime.endTime})`
      )
      setCancellingShowtime(null)
      loadShowtimes()
    } catch {
      toast.error('Không thể hủy suất chiếu. Vui lòng thử lại.')
    } finally {
      setIsCancelling(false)
    }
  }

  // 7-day strip for timeline view
  const timelineDays = useMemo(() => {
    const list: { date: string; label: string; subLabel: string; isToday: boolean }[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(today.getDate() + i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${day}`

      list.push({
        date: dateStr,
        label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : getDayOfWeekVN(dateStr),
        subLabel: `${day}/${m}`,
        isToday: i === 0,
      })
    }
    return list
  }, [])

  // Group showtimes by auditorium for timeline view
  const timelineAuditoriums = useMemo(() => {
    const relevantAuds = filters.theaterId
      ? auditoriums.filter((a) => a.theaterId === filters.theaterId)
      : auditoriums

    return relevantAuds.map((aud) => {
      const audShowtimes = showtimes.filter((st) => st.auditoriumId === aud.id)
      return {
        auditorium: aud,
        showtimes: audShowtimes.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }
    })
  }, [auditoriums, showtimes, filters.theaterId])

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Quản lý suất chiếu
            </h1>
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              {totalItems} suất
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Lên lịch chiếu, quản lý phòng chiếu và phát hiện xung đột lịch vận hành
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-secondary/60 border border-border/80">
            <button
              type="button"
              onClick={() => handleToggleView('table')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleView('timeline')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'timeline'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Lịch ngày</span>
            </button>
          </div>

          <Button
            type="button"
            onClick={() => navigate('/admin/showtimes/new')}
            className="rounded-xl shadow-sm gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo suất chiếu</span>
          </Button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm phim, rạp, phòng..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-border/70 bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => updateFilter('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Theater select */}
          <Select
            value={filters.theaterId || 'all'}
            onValueChange={(val) => updateFilter('theaterId', val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl border-border/70 bg-background">
              <SelectValue placeholder="Lọc theo cụm rạp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả cụm rạp</SelectItem>
              {theaters.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Auditorium select */}
          <Select
            value={filters.auditoriumId || 'all'}
            onValueChange={(val) => updateFilter('auditoriumId', val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl border-border/70 bg-background">
              <SelectValue placeholder="Lọc theo phòng chiếu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng chiếu</SelectItem>
              {auditoriums.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ({a.format})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Movie select */}
          <Select
            value={filters.movieId || 'all'}
            onValueChange={(val) => updateFilter('movieId', val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl border-border/70 bg-background">
              <SelectValue placeholder="Lọc theo phim" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phim</SelectItem>
              {movies.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Secondary Filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Format select */}
            <div className="w-36">
              <Select
                value={filters.format || 'all'}
                onValueChange={(val) => updateFilter('format', val)}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl border-border/70 bg-background">
                  <SelectValue placeholder="Định dạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Định dạng: Tất cả</SelectItem>
                  <SelectItem value="2D">2D Digital</SelectItem>
                  <SelectItem value="3D">3D Digital</SelectItem>
                  <SelectItem value="IMAX Laser">IMAX Laser</SelectItem>
                  <SelectItem value="4DX">4DX Dynamic</SelectItem>
                  <SelectItem value="ScreenX">ScreenX 270°</SelectItem>
                  <SelectItem value="Dolby Atmos">Dolby Atmos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status select */}
            <div className="w-36">
              <Select
                value={filters.status || 'all'}
                onValueChange={(val) => updateFilter('status', val)}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl border-border/70 bg-background">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
                  <SelectItem value="selling">Đang mở bán</SelectItem>
                  <SelectItem value="sold-out">Hết vé</SelectItem>
                  <SelectItem value="ended">Đã kết thúc</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range inputs in Table View */}
            {viewMode === 'table' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="h-8 px-2.5 rounded-xl border border-border/70 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  title="Từ ngày"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="h-8 px-2.5 rounded-xl border border-border/70 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  title="Đến ngày"
                />
              </div>
            )}

            {/* Clear filters button */}
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại ({activeFilterCount})</span>
              </Button>
            )}
          </div>

          {/* Sắp xếp */}
          {viewMode === 'table' && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sắp xếp:</span>
              <div className="w-48">
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(val) => {
                    const [by, order] = val.split('-')
                    const newParams = new URLSearchParams(searchParams)
                    newParams.set('sortBy', by)
                    newParams.set('sortOrder', order)
                    setSearchParams(newParams, { replace: true })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs rounded-xl border-border/70 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-asc">Ngày chiếu (gần nhất)</SelectItem>
                    <SelectItem value="date-desc">Ngày chiếu (xa nhất)</SelectItem>
                    <SelectItem value="startTime-asc">Giờ bắt đầu (sớm nhất)</SelectItem>
                    <SelectItem value="occupancy-desc">Tỷ lệ lấp đầy (cao nhất)</SelectItem>
                    <SelectItem value="price-desc">Giá vé (cao nhất)</SelectItem>
                    <SelectItem value="price-asc">Giá vé (thấp nhất)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Content: Table View vs Timeline View */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 border-b border-border/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Phim</th>
                  <th className="py-3.5 px-4">Cụm rạp & Phòng</th>
                  <th className="py-3.5 px-4">Định dạng</th>
                  <th className="py-3.5 px-4 text-right">Giá vé cơ bản</th>
                  <th className="py-3.5 px-4">Tỷ lệ lấp đầy</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Đang tải lịch suất chiếu...</span>
                      </div>
                    </td>
                  </tr>
                ) : showtimes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Calendar className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium">Không tìm thấy suất chiếu nào phù hợp</p>
                        <p className="text-xs text-muted-foreground/70">
                          Thử thay đổi bộ lọc hoặc tạo suất chiếu mới
                        </p>
                        {activeFilterCount > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="mt-2 text-xs cursor-pointer"
                          >
                            Xóa bộ lọc
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  showtimes.map((st) => {
                    const occupancyRate =
                      st.totalSeats > 0 ? Math.round((st.bookedSeats / st.totalSeats) * 100) : 0

                    return (
                      <tr
                        key={st.id}
                        className={cn(
                          'hover:bg-secondary/20 transition-colors',
                          st.hasConflict && 'bg-amber-500/5'
                        )}
                      >
                        {/* 1. Thời gian */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 font-mono">
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>
                                {st.startTime} — {st.endTime}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {formatDateVN(st.date)} ({getDayOfWeekVN(st.date)})
                            </div>
                          </div>
                        </td>

                        {/* 2. Phim */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={st.moviePosterUrl}
                              alt={st.movieTitle}
                              className="w-10 h-14 object-cover rounded-md border border-border/80 shrink-0 shadow-xs"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'
                              }}
                            />
                            <div className="space-y-0.5">
                              <Link
                                to={`/admin/showtimes/${st.id}/edit`}
                                className="font-semibold text-foreground hover:text-primary transition-colors block line-clamp-1"
                              >
                                {st.movieTitle}
                              </Link>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 font-bold border-amber-500/40 text-amber-500"
                                >
                                  {st.movieAgeRating}
                                </Badge>
                                <span>{st.movieDuration} phút</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Cụm rạp & Phòng */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="font-medium text-foreground flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="line-clamp-1">{st.theaterName}</span>
                            </div>
                            <div className="text-xs text-primary font-medium flex items-center gap-1">
                              <Tv className="w-3 h-3" />
                              <span>{st.auditoriumName}</span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Định dạng & Ngôn ngữ */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge
                              variant="outline"
                              className="text-[11px] font-bold border-primary/40 text-primary bg-primary/5"
                            >
                              {st.format}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{st.language}</span>
                          </div>
                        </td>

                        {/* 5. Giá vé cơ bản */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                          {formatVND(st.basePrice)}
                        </td>

                        {/* 6. Tỷ lệ lấp đầy */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 w-32">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-muted-foreground">
                                {st.bookedSeats}/{st.totalSeats}
                              </span>
                              <span
                                className={cn(
                                  'font-bold',
                                  occupancyRate >= 80
                                    ? 'text-rose-500'
                                    : occupancyRate >= 50
                                    ? 'text-amber-500'
                                    : 'text-emerald-500'
                                )}
                              >
                                {occupancyRate}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-300',
                                  occupancyRate >= 80
                                    ? 'bg-rose-500'
                                    : occupancyRate >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                )}
                                style={{ width: `${occupancyRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 7. Trạng thái & Xung đột */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <AdminStatusBadge status={st.status} size="sm" />

                            {/* Conflict indicator if any */}
                            {st.hasConflict && (
                              <div
                                className="flex items-center gap-1 text-[11px] font-medium text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md"
                                title={st.conflictReason}
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0 animate-pulse" />
                                <span className="line-clamp-1">Xung đột lịch chiếu</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 8. Thao tác */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View seats map button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/auditoriums/${st.auditoriumId}/seats`)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Xem sơ đồ ghế phòng chiếu"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {/* Edit showtime button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/showtimes/${st.id}/edit`)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                              title="Chỉnh sửa suất chiếu"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>

                            {/* Cancel showtime button */}
                            {st.status !== 'cancelled' && st.status !== 'ended' && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancellingShowtime(st)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                                title="Hủy suất chiếu"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t border-border/70">
              <AdminPagination
                page={filters.page}
                totalPages={totalPages}
                pageSize={filters.pageSize}
                total={totalItems}
                onPageChange={(p) => updateFilter('page', p)}
                onPageSizeChange={(s) => updateFilter('pageSize', s)}
              />
            </div>
          )}
        </div>
      ) : (
        /* TIMELINE / CALENDAR VIEW */
        <div className="space-y-4">
          {/* 7-Day Quick Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {timelineDays.map((day) => {
              const isSelected = timelineDate === day.date
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setTimelineDate(day.date)}
                  className={cn(
                    'flex flex-col items-center justify-center min-w-[100px] px-4 py-2.5 rounded-2xl border transition-all cursor-pointer text-center shrink-0',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary shadow-xs font-bold'
                      : 'border-border/70 bg-card hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="text-xs">{day.label}</span>
                  <span className="font-mono text-sm font-extrabold">{day.subLabel}</span>
                </button>
              )
            })}
          </div>

          {/* Timeline Grid Container */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs overflow-x-auto">
            {/* Timeline Header Ruler (08:00 - 24:00) */}
            <div className="min-w-[900px]">
              <div className="flex items-center border-b border-border/60 pb-2 mb-4">
                <div className="w-48 shrink-0 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Phòng chiếu
                </div>
                <div className="flex-1 grid grid-cols-8 text-center font-mono text-[11px] text-muted-foreground">
                  <span>08:00</span>
                  <span>10:00</span>
                  <span>12:00</span>
                  <span>14:00</span>
                  <span>16:00</span>
                  <span>18:00</span>
                  <span>20:00</span>
                  <span>22:00</span>
                </div>
              </div>

              {/* Auditoriums Rows */}
              {timelineAuditoriums.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Không có phòng chiếu nào phù hợp với bộ lọc hiện tại
                </div>
              ) : (
                <div className="space-y-4">
                  {timelineAuditoriums.map(({ auditorium: aud, showtimes: audSts }) => (
                    <div
                      key={aud.id}
                      className="flex items-stretch border-b border-border/40 pb-4 last:border-b-0"
                    >
                      {/* Left: Auditorium info */}
                      <div className="w-48 shrink-0 pr-4 flex flex-col justify-center space-y-1">
                        <span className="font-semibold text-xs text-foreground line-clamp-1">
                          {aud.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 text-primary">
                            {aud.format}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {aud.totalSeats} ghế
                          </span>
                        </div>
                      </div>

                      {/* Right: Horizontal timeline track (08:00 -> 24:00 = 16 hours = 960 minutes) */}
                      <div className="flex-1 relative h-16 bg-secondary/20 rounded-xl border border-border/50 overflow-hidden">
                        {/* Background hour grid lines */}
                        <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="border-r border-border/30 h-full" />
                          ))}
                        </div>

                        {/* Placed showtimes */}
                        {audSts.map((st) => {
                          const startMin = timeToMinutes(st.startTime)
                          const endMin = timeToMinutes(st.endTime)
                          const trackStart = 480
                          const trackTotal = 960

                          const leftPct = Math.max(0, ((startMin - trackStart) / trackTotal) * 100)
                          const widthPct = Math.min(
                            100 - leftPct,
                            ((endMin - startMin) / trackTotal) * 100
                          )

                          const bufferPct = (15 / trackTotal) * 100

                          return (
                            <div
                              key={st.id}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                              }}
                              className="absolute top-1.5 bottom-1.5 z-10"
                            >
                              <div
                                onClick={() => setActiveTimelineItem(st)}
                                className={cn(
                                  'h-full rounded-lg px-2 py-1 text-xs shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden',
                                  st.status === 'cancelled'
                                    ? 'bg-slate-500/20 text-muted-foreground line-through border border-slate-500/40'
                                    : st.status === 'sold-out'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                                    : 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30',
                                  st.hasConflict && 'ring-2 ring-amber-500 animate-pulse'
                                )}
                                title={`${st.movieTitle} (${st.startTime} - ${st.endTime})`}
                              >
                                <div className="font-bold truncate text-[11px] flex items-center gap-1">
                                  {st.hasConflict && (
                                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                  )}
                                  <span className="truncate">{st.movieTitle}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono opacity-85">
                                  <span>
                                    {st.startTime} - {st.endTime}
                                  </span>
                                  <span>
                                    {st.bookedSeats}/{st.totalSeats}
                                  </span>
                                </div>
                              </div>

                              {/* Visual 15-min cleaning buffer strip */}
                              <div
                                style={{
                                  left: '100%',
                                  width: `${bufferPct}%`,
                                }}
                                className="absolute top-1.5 bottom-1.5 bg-amber-500/10 border-l border-amber-500/30 pattern-diagonal-lines pointer-events-none rounded-r-xs"
                                title="Thời gian dọn phòng: 15 phút"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Timeline Click Card Modal */}
      {activeTimelineItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Badge variant="outline" className="text-[10px] text-primary">
                  {activeTimelineItem.format} • {activeTimelineItem.language}
                </Badge>
                <h3 className="text-lg font-bold text-foreground">
                  {activeTimelineItem.movieTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeTimelineItem.theaterName} — {activeTimelineItem.auditoriumName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTimelineItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/60 text-xs">
              <div>
                <span className="text-muted-foreground block">Ngày & Giờ chiếu:</span>
                <span className="font-mono font-bold text-foreground">
                  {activeTimelineItem.startTime} — {activeTimelineItem.endTime}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {formatDateVN(activeTimelineItem.date)}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Giá vé cơ bản:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatVND(activeTimelineItem.basePrice)}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Lấp đầy ghế:</span>
                <span className="font-mono font-bold text-foreground">
                  {activeTimelineItem.bookedSeats} / {activeTimelineItem.totalSeats} ghế (
                  {Math.round(
                    (activeTimelineItem.bookedSeats / activeTimelineItem.totalSeats) * 100
                  )}
                  %)
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Trạng thái:</span>
                <div className="pt-0.5">
                  <AdminStatusBadge status={activeTimelineItem.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Conflict note if any */}
            {activeTimelineItem.hasConflict && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Cảnh báo xung đột lịch chiếu:</span>
                </div>
                <p>{activeTimelineItem.conflictReason}</p>
                <p className="text-[10px] text-muted-foreground italic">
                  * Cảnh báo sơ bộ cục bộ, không thay thế xác thực authoritative từ backend.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/admin/auditoriums/${activeTimelineItem.auditoriumId}/seats`)
                }
                className="cursor-pointer text-xs"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                <span>Xem sơ đồ ghế</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => navigate(`/admin/showtimes/${activeTimelineItem.id}/edit`)}
                className="cursor-pointer text-xs"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                <span>Chỉnh sửa</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Destructive Cancel Showtime Confirmation Modal */}
      <AdminConfirmDialog
        isOpen={!!cancellingShowtime}
        title="Xác nhận hủy suất chiếu?"
        description={
          cancellingShowtime
            ? `Suất chiếu "${cancellingShowtime.movieTitle}" vào lúc ${cancellingShowtime.startTime} ngày ${formatDateVN(
                cancellingShowtime.date
              )} tại ${cancellingShowtime.auditoriumName} (${
                cancellingShowtime.theaterName
              }) sẽ bị hủy hoàn toàn.\n\n⚠️ CẢNH BÁO: Hiện có ${
                cancellingShowtime.affectedBookingsCount
              } đơn đặt vé đã thanh toán cho suất chiếu này. Hủy suất chiếu sẽ khóa phòng, tự động giải phóng ghế, kích hoạt quy trình hoàn tiền và gửi thông báo khẩn cấp đến khách hàng.`
            : ''
        }
        confirmText={isCancelling ? 'Đang hủy...' : 'Xác nhận hủy suất chiếu'}
        cancelText="Quay lại"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingShowtime(null)}
      />
    </div>
  )
}
