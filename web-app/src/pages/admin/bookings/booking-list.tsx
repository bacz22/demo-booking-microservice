import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Ticket,
  Search,
  X,
  RotateCcw,
  Download,
  Copy,
  Check,
  Eye,
  Ban,
  ReceiptText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react'
import type { BackendBookingResponse } from '@/types/booking'
import type { BackendAuthUser } from '@/services/auth-api.service'
import {
  adminBookingApi,
  adminUserApi,
  downloadCsv,
  toVnDate,
  type AdminBookingQuery,
  type AdminBookingStats,
  type BackendBookingStatus,
} from '@/services/admin-api.service'
import { movieApiService } from '@/services/movie-api.service'
import { theaterApiService } from '@/services/theater-api.service'
import { ApiClientError } from '@/lib/api-client'
import {
  EMPTY,
  derivePaymentDisplay,
  formatDate,
  formatDateTime,
  formatTime,
  formatVND,
  seatLabel,
  seatTypeClass,
} from '@/lib/admin-booking-mapper'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminPagination } from '@/components/admin/common/admin-pagination'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState } from '@/components/ui/page-error-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const STATUS_VALUES: BackendBookingStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED']

export default function AdminBookingList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters from query params
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL')
  const [movieId, setMovieId] = useState<string>(searchParams.get('movieId') || 'ALL')
  const [theaterId, setTheaterId] = useState<string>(searchParams.get('theaterId') || 'ALL')
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '')
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get('pageSize')) || 10)

  // Data states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BackendBookingResponse[]>([])
  const [users, setUsers] = useState<Record<string, BackendAuthUser>>({})
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<AdminBookingStats | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Options for filter dropdowns
  const [movieOptions, setMovieOptions] = useState<{ id: string; title: string }[]>([])
  const [theaterOptions, setTheaterOptions] = useState<{ id: string; name: string }[]>([])

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<BackendBookingResponse | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  // Load movie and theater options
  useEffect(() => {
    let isMounted = true
    movieApiService
      .getMovies({ page: 1, pageSize: 100 })
      .then((res) => {
        if (isMounted) setMovieOptions(res.items.map((m) => ({ id: m.id, title: m.title })))
      })
      .catch((err) => console.error('Failed to load movie options:', err))
    theaterApiService
      .getAdminTheaters({ page: 1, pageSize: 100 })
      .then((res) => {
        if (isMounted) setTheaterOptions(res.items.map((t) => ({ id: t.id, name: t.name })))
      })
      .catch((err) => console.error('Failed to load theater options:', err))
    return () => {
      isMounted = false
    }
  }, [])

  // Stats: theo khoảng ngày đang lọc, mặc định 30 ngày gần nhất
  useEffect(() => {
    let isMounted = true
    const to = endDate || toVnDate(new Date())
    const from = startDate || toVnDate(new Date(Date.now() - 29 * 24 * 3600 * 1000))
    adminBookingApi
      .stats(from, to)
      .then((s) => {
        if (isMounted) setStats(s)
      })
      .catch((err) => {
        console.error('Failed to load booking stats:', err)
        if (isMounted) setStats(null)
      })
    return () => {
      isMounted = false
    }
  }, [startDate, endDate])

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (status !== 'ALL') params.set('status', status)
    if (movieId !== 'ALL') params.set('movieId', movieId)
    if (theaterId !== 'ALL') params.set('theaterId', theaterId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (page > 1) params.set('page', String(page))
    if (pageSize !== 10) params.set('pageSize', String(pageSize))

    setSearchParams(params, { replace: true })
  }, [search, status, movieId, theaterId, startDate, endDate, page, pageSize, setSearchParams])

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query: AdminBookingQuery = {
        q: debouncedSearch || undefined,
        status: STATUS_VALUES.includes(status as BackendBookingStatus)
          ? (status as BackendBookingStatus)
          : undefined,
        movieId: movieId !== 'ALL' ? movieId : undefined,
        theaterId: theaterId !== 'ALL' ? theaterId : undefined,
        from: startDate || undefined,
        to: endDate || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: page - 1,
        pageSize,
      }
      const result = await adminBookingApi.list(query)
      setBookings(result.items)
      setTotal(result.total)
      setTotalPages(Math.max(1, result.totalPages))
      try {
        setUsers(await adminUserApi.byIds(result.items.map((b) => b.userId)))
      } catch (err) {
        console.error('Failed to load customers:', err)
        setUsers({})
      }
    } catch (err) {
      console.error('Failed to load bookings:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt vé')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, movieId, theaterId, startDate, endDate, page, pageSize])

  useEffect(() => {
    void fetchBookings()
  }, [fetchBookings])

  // Reset filters
  const handleResetFilters = () => {
    setSearch('')
    setStatus('ALL')
    setMovieId('ALL')
    setTheaterId('ALL')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const isFiltered =
    Boolean(search) ||
    status !== 'ALL' ||
    movieId !== 'ALL' ||
    theaterId !== 'ALL' ||
    Boolean(startDate) ||
    Boolean(endDate)

  // Copy booking code
  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Đã sao chép mã ${code}`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // CSV export: các dòng của trang hiện tại
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      toast.warning('Không có dữ liệu phù hợp để xuất file')
      return
    }
    downloadCsv(
      `bookings-${toVnDate(new Date())}-trang-${page}.csv`,
      [
        'Mã booking',
        'Khách hàng',
        'Email',
        'SĐT',
        'Phim',
        'Rạp',
        'Phòng',
        'Suất chiếu',
        'Ghế',
        'Tổng tiền',
        'Trạng thái',
        'Thời gian tạo',
      ],
      bookings.map((b) => {
        const u = users[b.userId]
        return [
          b.bookingCode,
          u?.fullName ?? b.userId,
          u?.email ?? '',
          u?.phone ?? '',
          b.movieTitle ?? '',
          b.theaterName ?? '',
          b.auditoriumName ?? '',
          b.showtimeStart ? formatDateTime(b.showtimeStart) : '',
          b.seats.map(seatLabel).join(' '),
          b.totalAmount,
          b.status,
          formatDateTime(b.createdAt),
        ]
      })
    )
    toast.success(`Đã xuất ${bookings.length} đơn đặt vé ra file CSV`)
  }

  // Handle cancel booking
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setIsCancelling(true)
    try {
      await adminBookingApi.cancel(cancelTarget.id, 'Quản trị viên huỷ đơn')
      toast.success(`Đã huỷ đơn ${cancelTarget.bookingCode}`)
      setCancelTarget(null)
      void fetchBookings()
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 409 || err.code === 'INVALID_BOOKING_STATE')) {
        toast.error('Đơn đã thanh toán hoặc đã kết thúc, không thể huỷ tại đây')
      } else {
        toast.error('Có lỗi xảy ra khi huỷ đơn')
      }
    } finally {
      setIsCancelling(false)
    }
  }

  const statCount = (s: BackendBookingStatus) => stats?.byStatus?.[s] ?? 0
  const statTotal = stats ? STATUS_VALUES.reduce((acc, s) => acc + statCount(s), 0) : 0
  const cancelTargetUser = cancelTarget ? users[cancelTarget.userId] : undefined

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Quản Lý Đặt Vé"
        description="Theo dõi và kiểm soát các giao dịch đặt vé, xử lý sự cố và đối soát doanh thu"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Quản lý đặt vé' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={loading || bookings.length === 0}
              className="h-9 gap-2 rounded-xl border-border/80 bg-secondary/40 font-bold hover:bg-secondary cursor-pointer shadow-xs"
              title="Tải các đơn của trang hiện tại ra file CSV UTF-8"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Xuất CSV ({bookings.length})</span>
            </Button>
          </div>
        }
      />

      {/* Stats Overview Chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Đơn tạo trong kỳ</span>
            <ReceiptText className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-foreground font-mono tabular-nums">
              {stats ? stats.createdBookings : EMPTY}
            </span>
            <span className="text-xs text-muted-foreground">đơn</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Doanh thu vé đã xuất</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-emerald-500 font-mono tabular-nums">
              {stats ? formatVND(stats.revenue) : EMPTY}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Đã thanh toán</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-foreground font-mono tabular-nums">
              {stats ? statCount('CONFIRMED') : EMPTY}
            </span>
            <span className="text-xs text-emerald-500 font-bold">
              {statTotal > 0 ? `${Math.round((statCount('CONFIRMED') / statTotal) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Đã huỷ / Hết hạn</span>
            <RotateCcw className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-rose-400 font-mono tabular-nums">
              {stats ? statCount('CANCELLED') + statCount('EXPIRED') : EMPTY}
            </span>
            <span className="text-xs text-muted-foreground">đơn</span>
          </div>
        </div>
      </div>
      <p className="-mt-3 text-[11px] text-muted-foreground">
        Thống kê theo khoảng ngày đang lọc (mặc định 30 ngày gần nhất).
      </p>

      {/* Multi-Criteria Filter Bar */}
      <div className="rounded-2xl border border-border/70 bg-card/50 backdrop-blur-md p-4 space-y-3.5 shadow-xs">
        {/* Row 1: Search, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative sm:col-span-1 lg:col-span-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo mã đơn, tên phim, rạp..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 pr-8 h-10 rounded-xl bg-secondary/40 border-border/80 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-1 lg:col-span-4">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Trạng thái đặt vé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái booking</SelectItem>
                <SelectItem value="CONFIRMED">Đã thanh toán (CONFIRMED)</SelectItem>
                <SelectItem value="PENDING_PAYMENT">Chờ thanh toán (PENDING)</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy (CANCELLED)</SelectItem>
                <SelectItem value="EXPIRED">Hết hạn thanh toán (EXPIRED)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Movie, Theater, Date Range, Reset Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-1 lg:col-span-3">
            <Select
              value={movieId}
              onValueChange={(val) => {
                setMovieId(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Chọn phim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả phim</SelectItem>
                {movieOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <Select
              value={theaterId}
              onValueChange={(val) => {
                setTheaterId(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Chọn cụm rạp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả cụm rạp</SelectItem>
                {theaterOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                }}
                className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs px-2.5"
                title="Từ ngày (ngày tạo đơn)"
              />
            </div>
            <span className="text-muted-foreground text-xs font-bold shrink-0">→</span>
            <div className="relative flex-1">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                }}
                className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs px-2.5"
                title="Đến ngày (ngày tạo đơn)"
              />
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex justify-end">
            {isFiltered && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer w-full lg:w-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <PageErrorState
          title="Không thể tải danh sách đơn đặt vé"
          message={error}
          onRetry={() => void fetchBookings()}
        />
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-secondary/30 text-muted-foreground uppercase tracking-wider font-semibold text-[11px]">
                  <th scope="col" className="py-3.5 pl-4 pr-3">Mã Booking</th>
                  <th scope="col" className="py-3.5 px-3">Khách Hàng</th>
                  <th scope="col" className="py-3.5 px-3 min-w-[200px]">Phim & Suất Chiếu</th>
                  <th scope="col" className="py-3.5 px-3">Ghế Đặt</th>
                  <th scope="col" className="py-3.5 px-3 text-right">Tổng Tiền</th>
                  <th scope="col" className="py-3.5 px-3">Thanh Toán</th>
                  <th scope="col" className="py-3.5 px-3">Trạng Thái</th>
                  <th scope="col" className="py-3.5 px-3">Thời Gian Tạo</th>
                  <th scope="col" className="py-3.5 pr-4 pl-3 text-center">Thao Tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-4 pr-3"><Skeleton className="h-4 w-20 rounded" /></td>
                      <td className="py-4 px-3">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-28 rounded" />
                          <Skeleton className="h-3 w-36 rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-40 rounded" />
                          <Skeleton className="h-3 w-32 rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-3"><Skeleton className="h-5 w-16 rounded" /></td>
                      <td className="py-4 px-3 text-right"><Skeleton className="h-4 w-20 rounded ml-auto" /></td>
                      <td className="py-4 px-3"><Skeleton className="h-5 w-20 rounded" /></td>
                      <td className="py-4 px-3"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                      <td className="py-4 px-3"><Skeleton className="h-3 w-28 rounded" /></td>
                      <td className="py-4 pr-4 pl-3 text-center"><Skeleton className="h-8 w-16 rounded-lg mx-auto" /></td>
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <EmptyState
                        icon={Ticket}
                        title="Không tìm thấy đơn đặt vé nào"
                        description={
                          isFiltered
                            ? 'Thử thay đổi bộ lọc tìm kiếm hoặc xóa từ khóa hiện tại'
                            : 'Hiện tại hệ thống chưa phát sinh giao dịch đặt vé nào'
                        }
                        action={isFiltered ? { label: 'Xóa bộ lọc', onClick: handleResetFilters } : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const isCopied = copiedCode === booking.bookingCode
                    const user = users[booking.userId]
                    const payment = derivePaymentDisplay(booking)

                    return (
                      <tr key={booking.id} className="group transition-colors hover:bg-secondary/20">
                        <td className="py-3.5 pl-4 pr-3 align-middle font-mono">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/admin/bookings/${booking.id}`}
                              className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline tabular-nums"
                              title="Xem chi tiết đơn đặt vé"
                            >
                              {booking.bookingCode}
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(booking.bookingCode)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                              title="Sao chép mã đơn"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <div className="space-y-0.5">
                            <div className="font-bold text-foreground">
                              {user?.fullName ?? 'Khách hàng'}
                            </div>
                            <div className="text-muted-foreground text-[11px] truncate max-w-[180px]">
                              {user?.email ?? booking.userId}
                            </div>
                            {user?.phone && (
                              <div className="text-muted-foreground text-[11px] font-mono">{user.phone}</div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <div className="flex items-start gap-2.5">
                            {booking.posterUrl ? (
                              <img
                                src={booking.posterUrl}
                                alt={booking.movieTitle ?? ''}
                                className="w-9 h-12 rounded object-cover border border-border/60 shrink-0 mt-0.5 shadow-2xs"
                              />
                            ) : (
                              <div className="w-9 h-12 rounded border border-border/60 bg-secondary shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold text-foreground line-clamp-1">
                                {booking.movieTitle ?? EMPTY}
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <span className="font-semibold text-primary/90">
                                  {formatTime(booking.showtimeStart)}
                                </span>
                                <span>•</span>
                                <span>{formatDate(booking.showtimeStart)}</span>
                              </div>
                              <div className="text-muted-foreground text-[11px] line-clamp-1">
                                {booking.theaterName ?? EMPTY}
                                {booking.auditoriumName ? ` (${booking.auditoriumName})` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1 max-w-[140px]">
                              {booking.seats.map((seat) => (
                                <span
                                  key={seat.seatId}
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border',
                                    seatTypeClass(seat.seatType)
                                  )}
                                >
                                  {seatLabel(seat)}
                                </span>
                              ))}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{booking.seats.length} vé</div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-middle text-right font-mono">
                          <div className="font-bold text-foreground tabular-nums text-xs sm:text-sm">
                            {formatVND(booking.totalAmount)}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <span className={cn('text-[11px] font-semibold', payment.className)}>
                            {payment.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <AdminStatusBadge status={booking.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-3 align-middle text-muted-foreground font-mono text-[11px]">
                          {formatDateTime(booking.createdAt)}
                        </td>

                        <td className="py-3.5 pr-4 pl-3 align-middle text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 rounded-lg text-xs gap-1 cursor-pointer font-bold border-border/80 hover:bg-secondary"
                            >
                              <Link to={`/admin/bookings/${booking.id}`}>
                                <Eye className="w-3.5 h-3.5 text-primary" />
                                <span>Chi tiết</span>
                              </Link>
                            </Button>
                            {booking.status === 'PENDING_PAYMENT' && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancelTarget(booking)}
                                className="h-8 px-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                                title="Huỷ đơn đang chờ thanh toán"
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

          <div className="p-4 border-t border-border/80 bg-secondary/15">
            <AdminPagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              itemLabel="đơn đặt vé"
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(ps) => {
                setPageSize(ps)
                setPage(1)
              }}
            />
          </div>
        </div>
      )}

      <AdminConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Xác nhận hủy đơn đặt vé"
        targetName={cancelTarget?.bookingCode}
        description={`Bạn đang huỷ đơn chờ thanh toán của khách hàng "${cancelTargetUser?.fullName ?? cancelTarget?.userId ?? ''}". Trạng thái đơn sẽ chuyển thành CANCELLED.`}
        consequenceWarning="Các ghế đang giữ trong đơn này sẽ được giải phóng để khách hàng khác có thể chọn."
        confirmText="Hủy đơn đặt vé"
        cancelText="Đóng"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={() => void handleConfirmCancel()}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
