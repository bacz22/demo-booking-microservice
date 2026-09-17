import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  Trash2,
  PlayCircle,
  CheckCircle,
  MoreVertical,
} from 'lucide-react'
import type {
  AdminShowtime,
  ShowtimeFilterState,
} from '@/types/admin-showtime'
import type { AdminMovie } from '@/types/admin-movie'
import type { AdminTheater, AdminAuditorium, AuditoriumFormat } from '@/types/admin-theater'
import {
  showtimeApiService,
  timeToMinutes,
} from '@/services/showtime-api.service'
import { theaterApiService } from '@/services/theater-api.service'
import { movieApiService } from '@/services/movie-api.service'
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
import { DatePicker } from '@/components/ui/date-picker'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

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
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const hasLoadedInitial = useRef(false)

  // Options for filters
  const [theaters, setTheaters] = useState<AdminTheater[]>([])
  const [auditoriums, setAuditoriums] = useState<AdminAuditorium[]>([])
  const [movies, setMovies] = useState<AdminMovie[]>([])
  const [extraMovies, setExtraMovies] = useState<Record<string, AdminMovie>>({})

  // Cancel dialog state
  const [cancellingShowtime, setCancellingShowtime] = useState<AdminShowtime | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Delete dialog state
  const [deletingShowtime, setDeletingShowtime] = useState<AdminShowtime | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Điều phối 2 DatePicker lọc ngày — chỉ 1 picker mở tại một thời điểm
  const [activeDatePicker, setActiveDatePicker] = useState<'from' | 'to' | null>(null)

  // ID suất chiếu đang mở menu thao tác 3 chấm
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)

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

  // Update query params helper (stable reference across renders)
  const updateFilters = useCallback(
    (updates: Partial<Record<keyof ShowtimeFilterState, string | number | undefined | null>>) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev)
          Object.entries(updates).forEach(([key, value]) => {
            if (value === '' || value === 'all' || value === undefined || value === null) {
              newParams.delete(key)
            } else {
              newParams.set(key, String(value))
            }
          })
          // Reset to page 1 on filter changes unless page or pageSize is explicitly updated
          if (!('page' in updates) && !('pageSize' in updates)) {
            newParams.delete('page')
          }
          return newParams
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const updateFilter = useCallback(
    (key: keyof ShowtimeFilterState, value: string | number | undefined | null) => {
      updateFilters({ [key]: value })
    },
    [updateFilters]
  )


  // Local search input for smooth debounced typing without table thrashing
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilter('search', searchInput)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters.search, updateFilter])

  const handleResetFilters = () => {
    setSearchInput('')
    const newParams = new URLSearchParams()
    if (viewMode === 'timeline') newParams.set('view', 'timeline')
    setSearchParams(newParams, { replace: true })
  }

  // Load theaters and movies for filters
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [thRes, mvRes] = await Promise.all([
          theaterApiService.getAdminTheaters({ pageSize: 100 }),
          movieApiService.getMovies({ pageSize: 100 }),
        ])
        setTheaters(thRes.items || [])
        setMovies(mvRes.items || [])
      } catch (err) {
        console.error('Lỗi khi tải danh mục rạp và phim:', err)
        toast.error('Không thể tải danh mục rạp và phim từ hệ thống')
      }
    }
    loadPrerequisites()
  }, [])

  // Load auditoriums when theater changes
  useEffect(() => {
    let isCancelled = false
    const loadAuds = async () => {
      if (filters.theaterId) {
        try {
          const auds = await theaterApiService.getAuditoriumsByTheaterId(filters.theaterId)
          if (!isCancelled) {
            setAuditoriums(auds)
          }
        } catch (err) {
          console.error('Lỗi tải phòng chiếu:', err)
          if (!isCancelled) setAuditoriums([])
        }
      } else {
        if (!isCancelled) setAuditoriums([])
      }
    }
    loadAuds()
    return () => {
      isCancelled = true
    }
  }, [filters.theaterId])

  // Load showtimes
  const loadShowtimes = useCallback(async () => {
    if (!hasLoadedInitial.current) {
      setIsInitialLoading(true)
    } else {
      setIsFiltering(true)
    }

    try {
      const res = await showtimeApiService.getAdminShowtimes({
        ...filters,
        pageSize: viewMode === 'timeline' ? 100 : filters.pageSize,
        date: viewMode === 'timeline' ? timelineDate : undefined,
        dateFrom: viewMode === 'timeline' ? undefined : (filters.dateFrom || undefined),
        dateTo: viewMode === 'timeline' ? undefined : (filters.dateTo || undefined),
      })

      setShowtimes(res.items || [])
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)
      hasLoadedInitial.current = true
    } catch (err: any) {
      console.error('Lỗi tải danh sách suất chiếu:', err)
      toast.error(err?.message || 'Không thể tải danh sách suất chiếu')
    } finally {
      setIsInitialLoading(false)
      setIsFiltering(false)
    }
  }, [
    // filters.search được tách ra để tìm kiếm tức thì ở Client, không gọi API refetch gây giật lag
    filters.theaterId,
    filters.auditoriumId,
    filters.movieId,
    filters.dateFrom,
    filters.dateTo,
    filters.format,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.pageSize,
    viewMode,
    timelineDate,
  ])

  useEffect(() => {
    loadShowtimes()
  }, [loadShowtimes])

  // Tự động nạp chi tiết các phim bị thiếu (nếu có movieId nằm ngoài danh sách 100 phim ban đầu)
  useEffect(() => {
    if (showtimes.length === 0) return
    const missingIds = Array.from(
      new Set(
        showtimes
          .map((st) => st.movieId)
          .filter(
            (id) =>
              Boolean(id) &&
              !movies.some((m) => m.id.toLowerCase() === id.toLowerCase()) &&
              !extraMovies[id.toLowerCase()]
          )
      )
    )

    if (missingIds.length === 0) return

    missingIds.forEach(async (id) => {
      try {
        const mv = await movieApiService.getMovieById(id)
        if (mv) {
          setExtraMovies((prev) => ({ ...prev, [id.toLowerCase()]: mv }))
        }
      } catch (err) {
        console.warn(`Không thể lấy thông tin phim ${id}:`, err)
      }
    })
  }, [showtimes, movies, extraMovies])

  // Enhance showtimes with movie title, poster, duration & age rating from loaded movies
  const enhancedShowtimes = useMemo(() => {
    return showtimes.map((st) => {
      const mv =
        movies.find((m) => m.id.toLowerCase() === st.movieId?.toLowerCase()) ||
        (st.movieId ? extraMovies[st.movieId.toLowerCase()] : undefined)

      return {
        ...st,
        movieTitle: mv?.title || st.movieTitle || (st.movieId ? `Phim #${st.movieId.slice(0, 8)}` : 'Chưa đặt tên'),
        moviePosterUrl: st.moviePosterUrl || mv?.posterUrl || '',
        movieAgeRating: st.movieAgeRating || mv?.ageRating || 'P',
        movieDuration: st.movieDuration || mv?.duration || 120,
      }
    })
  }, [showtimes, movies, extraMovies])

  // Lọc tìm kiếm và ngày tức thì phía Client để giao diện mượt mà 60fps, không bị giật lag hay nhấp nháy
  const filteredShowtimes = useMemo(() => {
    let list = [...enhancedShowtimes]

    // 1. Tìm kiếm tức thì không độ trễ theo từ khóa (tên phim, rạp, phòng, định dạng)
    const query = searchInput.trim().toLowerCase()
    if (query) {
      list = list.filter((st) => {
        const matchTitle = (st.movieTitle || '').toLowerCase().includes(query)
        const matchTheater = (st.theaterName || '').toLowerCase().includes(query)
        const matchAuditorium = (st.auditoriumName || '').toLowerCase().includes(query)
        const matchFormat = (st.format || '').toLowerCase().includes(query)
        return matchTitle || matchTheater || matchAuditorium || matchFormat
      })
    }

    // 2. Lọc cụm rạp
    if (filters.theaterId && filters.theaterId !== 'all') {
      list = list.filter((st) => st.theaterId?.toLowerCase() === filters.theaterId.toLowerCase())
    }

    // 3. Lọc phòng chiếu
    if (filters.auditoriumId && filters.auditoriumId !== 'all') {
      list = list.filter((st) => st.auditoriumId?.toLowerCase() === filters.auditoriumId.toLowerCase())
    }

    // 4. Lọc phim
    if (filters.movieId && filters.movieId !== 'all') {
      list = list.filter((st) => st.movieId?.toLowerCase() === filters.movieId.toLowerCase())
    }

    // 5. Lọc định dạng phòng chiếu (2D, 3D, IMAX Laser, 4DX, ScreenX, Dolby Atmos)
    if (filters.format && filters.format !== 'all') {
      list = list.filter((st) => st.format === filters.format)
    }

    // 6. Lọc trạng thái (scheduled, selling, ended, cancelled)
    if (filters.status && filters.status !== 'all') {
      list = list.filter((st) => st.status === filters.status)
    }

    // 7. Lọc biên ngày chiếu (nếu có chọn từ ngày / đến ngày)
    if (filters.dateFrom) {
      list = list.filter((st) => !st.date || st.date >= filters.dateFrom)
    }
    if (filters.dateTo) {
      list = list.filter((st) => !st.date || st.date <= filters.dateTo)
    }

    // 8. Sắp xếp danh sách
    list.sort((a, b) => {
      const order = filters.sortOrder === 'desc' ? -1 : 1
      if (filters.sortBy === 'date' || filters.sortBy === 'startTime') {
        const dateA = `${a.date || ''}T${a.startTime || ''}`
        const dateB = `${b.date || ''}T${b.startTime || ''}`
        return dateA.localeCompare(dateB) * order
      }
      if (filters.sortBy === 'price') {
        return ((a.basePrice || 0) - (b.basePrice || 0)) * order
      }
      if (filters.sortBy === 'occupancy') {
        const occA = a.totalSeats > 0 ? a.bookedSeats / a.totalSeats : 0
        const occB = b.totalSeats > 0 ? b.bookedSeats / b.totalSeats : 0
        return (occA - occB) * order
      }
      return 0
    })

    return list
  }, [
    enhancedShowtimes,
    searchInput,
    filters.theaterId,
    filters.auditoriumId,
    filters.movieId,
    filters.format,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    filters.sortBy,
    filters.sortOrder,
  ])

  // Change view mode
  const handleToggleView = (mode: 'table' | 'timeline') => {
    setViewMode(mode)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('view', mode)
    setSearchParams(newParams, { replace: true })
  }

  // Handle State Machine Transition (SCHEDULED -> SELLING -> ENDED / CANCELLED)
  const handleUpdateStatus = async (
    id: string,
    newStatus: 'SCHEDULED' | 'SELLING' | 'ENDED' | 'CANCELLED',
    movieTitle: string
  ) => {
    try {
      await showtimeApiService.updateShowtimeStatus(id, newStatus)
      const statusLabels: Record<string, string> = {
        SELLING: 'Đã mở bán vé',
        ENDED: 'Đã kết thúc suất chiếu',
        CANCELLED: 'Đã hủy suất chiếu',
        SCHEDULED: 'Đã chuyển về chờ mở bán',
      }
      toast.success(`${statusLabels[newStatus] || 'Đã cập nhật trạng thái'} cho suất "${movieTitle}"!`)
      loadShowtimes()
    } catch (err: any) {
      console.error('Lỗi chuyển trạng thái suất chiếu:', err)
      toast.error(err?.message || 'Không thể chuyển đổi trạng thái suất chiếu')
    }
  }

  // Handle Delete Showtime
  const handleOpenDelete = (st: AdminShowtime) => {
    if (st.status === 'selling') {
      toast.error('Không thể xóa suất chiếu đang mở bán (SELLING)! Vui lòng chuyển trạng thái sang CANCELLED trước khi xóa.')
      return
    }
    setDeletingShowtime(st)
  }

  const handleConfirmDelete = async () => {
    if (!deletingShowtime) return
    try {
      setIsDeleting(true)
      await showtimeApiService.deleteShowtime(deletingShowtime.id)
      toast.success(`Đã xóa vĩnh viễn suất chiếu "${deletingShowtime.movieTitle}"!`)
      setDeletingShowtime(null)
      loadShowtimes()
    } catch (err: any) {
      console.error('Lỗi khi xóa suất chiếu:', err)
      toast.error(err?.message || 'Không thể xóa suất chiếu. Vui lòng thử lại.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle Cancel Showtime
  const handleConfirmCancel = async () => {
    if (!cancellingShowtime) return

    try {
      setIsCancelling(true)
      await showtimeApiService.updateShowtimeStatus(cancellingShowtime.id, 'CANCELLED')
      toast.success(
        `Đã hủy suất chiếu "${cancellingShowtime.movieTitle}" (${cancellingShowtime.startTime} - ${cancellingShowtime.endTime})`
      )
      setCancellingShowtime(null)
      loadShowtimes()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể hủy suất chiếu. Vui lòng thử lại.')
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
    // 1. Khởi tạo danh sách phòng chiếu
    const baseAuds = filters.theaterId
      ? auditoriums.filter((a) => a.theaterId?.toLowerCase() === filters.theaterId.toLowerCase())
      : auditoriums

    // Map chứa các phòng chiếu theo auditoriumId
    const audMap = new Map<
      string,
      {
        auditorium: AdminAuditorium & { theaterName?: string }
        showtimes: AdminShowtime[]
      }
    >()

    // Nếu đã nạp baseAuds, đưa vào map trước (để các phòng dù chưa có suất chiếu vẫn hiển thị nếu đang lọc theo rạp)
    baseAuds.forEach((aud) => {
      const th = theaters.find((t) => t.id?.toLowerCase() === aud.theaterId?.toLowerCase())
      audMap.set(aud.id, {
        auditorium: {
          ...aud,
          theaterName: th?.name,
        },
        showtimes: [],
      })
    })

    // 2. Quét qua filteredShowtimes để:
    // - Tự động bổ sung phòng chiếu vào Map nếu phòng đó chưa có (ví dụ khi chưa lọc cụm rạp hoặc phòng chiếu chưa load kịp)
    // - Phân bổ suất chiếu vào đúng phòng
    filteredShowtimes.forEach((st) => {
      // Chỉ lấy suất chiếu thuộc ngày đang chọn trên thanh timeline 7 ngày
      if (st.date && timelineDate && st.date !== timelineDate) return

      // Áp dụng các bộ lọc khác nếu người dùng có chọn
      if (filters.theaterId && st.theaterId?.toLowerCase() !== filters.theaterId.toLowerCase()) return
      if (filters.auditoriumId && st.auditoriumId?.toLowerCase() !== filters.auditoriumId.toLowerCase()) return
      if (filters.movieId && st.movieId?.toLowerCase() !== filters.movieId.toLowerCase()) return
      if (filters.format && st.format !== filters.format) return
      if (filters.status && st.status !== filters.status) return

      const audId = st.auditoriumId || 'unknown'
      if (!audMap.has(audId)) {
        audMap.set(audId, {
          auditorium: {
            id: audId,
            theaterId: st.theaterId || '',
            name: st.auditoriumName || 'Phòng chiếu',
            format: (st.format as AuditoriumFormat) || '2D',
            totalSeats: st.totalSeats || 0,
            activeShowtimesCount: 1,
            status: 'active',
            createdAt: st.createdAt || '',
            updatedAt: st.updatedAt || '',
            theaterName: st.theaterName,
          },
          showtimes: [],
        })
      }

      audMap.get(audId)!.showtimes.push(st)
    })

    // 3. Chuyển map thành danh sách hiển thị
    const result = Array.from(audMap.values()).map((item) => ({
      ...item,
      showtimes: item.showtimes.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))

    // Nếu không chọn rạp cụ thể, chỉ hiển thị các phòng có suất chiếu
    if (!filters.theaterId) {
      return result.filter((item) => item.showtimes.length > 0)
    }

    return result
  }, [auditoriums, filteredShowtimes, filters, theaters, timelineDate])

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
              {filteredShowtimes.length !== totalItems
                ? `${filteredShowtimes.length}/${totalItems} suất`
                : `${totalItems} suất`}
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
        {/* Row 1: Primary Search & Dropdowns (4 columns grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm phim, rạp, phòng..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-9.5 pl-9 pr-8 rounded-xl border border-border/70 bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  updateFilter('search', '')
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-full hover:bg-secondary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Theater select */}
          <Select
            value={filters.theaterId || 'all'}
            onValueChange={(val) => {
              updateFilters({ theaterId: val, auditoriumId: '' })
            }}
          >
            <SelectTrigger className="h-9.5 text-xs rounded-xl border-border/70 bg-background">
              <SelectValue placeholder="Tất cả cụm rạp" />
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
            disabled={!filters.theaterId}
          >
            <SelectTrigger className="h-9.5 text-xs rounded-xl border-border/70 bg-background disabled:opacity-60">
              <SelectValue
                placeholder={filters.theaterId ? "Tất cả phòng chiếu" : "Chọn cụm rạp trước"}
              />
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
            <SelectTrigger className="h-9.5 text-xs rounded-xl border-border/70 bg-background">
              <SelectValue placeholder="Tất cả phim" />
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

        {/* Row 2: Secondary Filters & Sort (4 columns grid matching Row 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/50">
          {/* Technology Format select */}
          <Select
            value={filters.format || 'all'}
            onValueChange={(val) => updateFilter('format', val)}
          >
            <SelectTrigger className="h-9.5 text-xs rounded-xl border-border/70 bg-background">
              <SelectValue placeholder="Tất cả định dạng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả định dạng</SelectItem>
              <SelectItem value="2D">2D</SelectItem>
              <SelectItem value="3D">3D</SelectItem>
              <SelectItem value="IMAX Laser">IMAX Laser</SelectItem>
              <SelectItem value="4DX">4DX</SelectItem>
              <SelectItem value="ScreenX">ScreenX</SelectItem>
              <SelectItem value="Dolby Atmos">Dolby Atmos</SelectItem>
            </SelectContent>
          </Select>

          {/* Status select */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(val) => updateFilter('status', val)}
          >
            <SelectTrigger className="h-9.5 text-xs rounded-xl border-border/70 bg-background">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="scheduled">Đã lên lịch (Scheduled)</SelectItem>
              <SelectItem value="selling">Đang mở bán (Selling)</SelectItem>
              <SelectItem value="ended">Đã kết thúc (Ended)</SelectItem>
              <SelectItem value="cancelled">Đã hủy (Cancelled)</SelectItem>
            </SelectContent>
          </Select>

          {/* Date range picker — 2 DatePicker riêng biệt, điều phối chỉ 1 cái mở */}
          <div className="flex items-center gap-1.5">
            <DatePicker
              value={filters.dateFrom || ''}
              onChange={(val) => {
                if (val && filters.dateTo && val > filters.dateTo) {
                  updateFilters({ dateFrom: val, dateTo: '' })
                } else {
                  updateFilter('dateFrom', val)
                }
              }}
              placeholder="Từ ngày"
              clearable
              toYear={new Date().getFullYear() + 3}
              className="flex-1 min-w-0"
              open={activeDatePicker === 'from'}
              onOpenChange={(open) => setActiveDatePicker(open ? 'from' : null)}
            />
            <span className="text-muted-foreground font-semibold shrink-0 text-xs">—</span>
            <DatePicker
              value={filters.dateTo || ''}
              onChange={(val) => updateFilter('dateTo', val)}
              placeholder="Đến ngày"
              clearable
              minDate={filters.dateFrom || undefined}
              toYear={new Date().getFullYear() + 3}
              className="flex-1 min-w-0"
              open={activeDatePicker === 'to'}
              onOpenChange={(open) => setActiveDatePicker(open ? 'to' : null)}
            />
          </div>

          {/* Sort By Select */}
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={(val) => {
              const [by, order] = val.split('-')
              updateFilters({ sortBy: by as any, sortOrder: order as any })
            }}
          >
            <SelectTrigger className="h-9.5 text-xs rounded-xl border-border/70 bg-background">
              <SelectValue placeholder="Sắp xếp theo..." />
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

        {/* Active Filter Chips & Reset */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-[11px] font-medium mr-1">Bộ lọc đang áp dụng:</span>
              {searchInput && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 rounded-lg">
                  Tìm kiếm: "{searchInput}"
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-500"
                    onClick={() => {
                      setSearchInput('')
                      updateFilter('search', '')
                    }}
                  />
                </Badge>
              )}
              {filters.theaterId && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 rounded-lg">
                  Rạp: {theaters.find((t) => t.id?.toLowerCase() === filters.theaterId.toLowerCase())?.name || 'Đã chọn'}
                  <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilters({ theaterId: '', auditoriumId: '' })} />
                </Badge>
              )}
              {filters.auditoriumId && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 rounded-lg">
                  Phòng: {auditoriums.find((a) => a.id?.toLowerCase() === filters.auditoriumId.toLowerCase())?.name || 'Đã chọn'}
                  <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilter('auditoriumId', '')} />
                </Badge>
              )}
              {filters.movieId && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 rounded-lg">
                  Phim: {movies.find((m) => m.id?.toLowerCase() === filters.movieId.toLowerCase())?.title || 'Đã chọn'}
                  <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilter('movieId', '')} />
                </Badge>
              )}
              {filters.format && filters.format !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 rounded-lg">
                  {filters.format}
                  <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilter('format', '')} />
                </Badge>
              )}
              {filters.status && filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 rounded-lg">
                  Trạng thái: {filters.status === 'selling' ? 'Đang mở bán' : filters.status === 'scheduled' ? 'Đã lên lịch' : filters.status === 'ended' ? 'Đã kết thúc' : 'Đã hủy'}
                  <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilter('status', '')} />
                </Badge>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 rounded-lg">
                  Ngày: {filters.dateFrom ? formatDateVN(filters.dateFrom) : '...'} — {filters.dateTo ? formatDateVN(filters.dateTo) : '...'}
                  <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateFilters({ dateFrom: '', dateTo: '' })} />
                </Badge>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc ({activeFilterCount})</span>
            </Button>
          </div>
        )}
      </div>

      {/* 3. Main Content: Table View vs Timeline View */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden relative">
          {/* Subtle Top Loading Bar during Filtering */}
          {isFiltering && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden z-20">
              <div className="h-full bg-primary animate-pulse w-full" />
            </div>
          )}

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
              <tbody
                className={cn(
                  'divide-y divide-border/60 transition-opacity duration-150',
                  isFiltering && 'opacity-60 pointer-events-none'
                )}
              >
                {isInitialLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="h-4 w-28 bg-muted rounded" />
                          <div className="h-3 w-20 bg-muted/60 rounded" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-muted rounded-md shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-3 w-16 bg-muted/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="h-4 w-24 bg-muted rounded" />
                          <div className="h-3 w-16 bg-muted/60 rounded" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 w-14 bg-muted rounded-md" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="h-4 w-16 bg-muted rounded ml-auto" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3 w-24 bg-muted rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-6 w-20 bg-muted rounded-full" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="h-7 w-7 bg-muted rounded-lg ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredShowtimes.length === 0 ? (
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
                  filteredShowtimes.map((st) => {
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

                        {/* 8. Thao tác - Menu 3 chấm */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end">
                            <Popover
                              open={openActionMenuId === st.id}
                              onOpenChange={(open) => setOpenActionMenuId(open ? st.id : null)}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                  aria-label={`Thao tác cho suất chiếu ${st.movieTitle}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>

                              <PopoverContent
                                align="end"
                                sideOffset={4}
                                className="w-52 rounded-xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl space-y-0.5 text-left z-50"
                              >
                                {/* 1. Chỉnh sửa suất chiếu */}
                                <Link
                                  to={`/admin/showtimes/${st.id}/edit`}
                                  onClick={() => setOpenActionMenuId(null)}
                                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors font-medium"
                                >
                                  <Edit className="w-3.5 h-3.5 text-primary" />
                                  <span>Chỉnh sửa suất chiếu</span>
                                </Link>

                                {/* 2. Xem sơ đồ ghế phòng chiếu */}
                                <Link
                                  to={`/admin/auditoriums/${st.auditoriumId}/seats`}
                                  onClick={() => setOpenActionMenuId(null)}
                                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>Xem sơ đồ ghế phòng</span>
                                </Link>

                                {/* 3. State Machine Actions */}
                                {st.status === 'scheduled' && (
                                  <>
                                    <div className="border-t border-border/50 my-1" />
                                    <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                                      Vận hành bán vé:
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null)
                                        handleUpdateStatus(st.id, 'SELLING', st.movieTitle)
                                      }}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left font-medium"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5" />
                                      <span>Mở bán vé (SELLING)</span>
                                    </button>
                                  </>
                                )}

                                {st.status === 'selling' && (
                                  <>
                                    <div className="border-t border-border/50 my-1" />
                                    <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                                      Vận hành bán vé:
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null)
                                        handleUpdateStatus(st.id, 'ENDED', st.movieTitle)
                                      }}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer text-left font-medium"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Kết thúc suất (ENDED)</span>
                                    </button>
                                  </>
                                )}

                                <div className="border-t border-border/50 my-1" />

                                {/* 4. Hủy suất chiếu */}
                                {st.status !== 'cancelled' && st.status !== 'ended' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      setCancellingShowtime(st)
                                    }}
                                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer text-left"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>Hủy suất chiếu</span>
                                  </button>
                                )}

                                {/* 5. Xóa vĩnh viễn */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null)
                                    handleOpenDelete(st)
                                  }}
                                  className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa vĩnh viễn</span>
                                </button>
                              </PopoverContent>
                            </Popover>
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
          {!isInitialLoading && totalPages > 1 && (
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
                        <span className="font-semibold text-xs text-foreground line-clamp-1" title={aud.name}>
                          {aud.name}
                        </span>
                        {aud.theaterName && (
                          <span className="text-[11px] text-muted-foreground line-clamp-1" title={aud.theaterName}>
                            {aud.theaterName}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 text-primary">
                            {aud.format}
                          </Badge>
                          {aud.totalSeats > 0 && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {aud.totalSeats} ghế
                            </span>
                          )}
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
                                    : st.status === 'selling'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
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
                                    {st.totalSeats > 0 || aud.totalSeats > 0
                                      ? `${st.bookedSeats}/${st.totalSeats || aud.totalSeats}`
                                      : 'Đang mở'}
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
                  {activeTimelineItem.totalSeats > 0
                    ? `${activeTimelineItem.bookedSeats} / ${activeTimelineItem.totalSeats} ghế (${Math.round((activeTimelineItem.bookedSeats / activeTimelineItem.totalSeats) * 100)}%)`
                    : `${activeTimelineItem.bookedSeats} vé đã đặt`}
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
              }) sẽ chuyển sang trạng thái ĐÃ HỦY (CANCELLED).\n\n⚠️ Lưu ý: Thao tác này sẽ khóa bán vé của suất chiếu và thông báo tới các bộ phận liên quan.`
            : ''
        }
        confirmText={isCancelling ? 'Đang hủy...' : 'Xác nhận hủy suất chiếu'}
        cancelText="Quay lại"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingShowtime(null)}
      />

      {/* 6. Delete Showtime Confirmation Modal */}
      <AdminConfirmDialog
        isOpen={!!deletingShowtime}
        title="Xác nhận xóa vĩnh viễn suất chiếu?"
        description={
          deletingShowtime
            ? `Bạn có chắc chắn muốn xóa hoàn toàn suất chiếu "${deletingShowtime.movieTitle}" (${deletingShowtime.startTime} - ${deletingShowtime.endTime}) tại phòng ${deletingShowtime.auditoriumName}?\n\nDữ liệu sẽ bị xóa khỏi hệ thống và không thể phục hồi.`
            : ''
        }
        confirmText={isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
        cancelText="Hủy bỏ"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingShowtime(null)}
      />
    </div>
  )
}
