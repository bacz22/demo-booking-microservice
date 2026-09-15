import { useState, useEffect, useMemo, useCallback } from 'react'
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
  CreditCard,
  ReceiptText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react'
import type {
  AdminBooking,
  AdminBookingStatus,
  AdminPaymentStatus,
  BookingFilterState,
} from '@/types/admin-booking'
import {
  getAdminBookings,
  cancelAdminBooking,
  exportBookingsToCSV,
} from '@/mocks/admin/bookings'
import { getAdminMovies } from '@/mocks/admin/movies'
import { getAdminTheaters } from '@/mocks/admin/theaters'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminPagination } from '@/components/admin/common/admin-pagination'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminBookingList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters from query params
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL')
  const [paymentStatus, setPaymentStatus] = useState<string>(searchParams.get('payment') || 'ALL')
  const [movieId, setMovieId] = useState<string>(searchParams.get('movieId') || 'ALL')
  const [theaterId, setTheaterId] = useState<string>(searchParams.get('theaterId') || 'ALL')
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '')
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get('pageSize')) || 10)

  // Data states
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Options for filter dropdowns
  const [movieOptions, setMovieOptions] = useState<{ id: string; title: string }[]>([])
  const [theaterOptions, setTheaterOptions] = useState<{ id: string; name: string }[]>([])

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<AdminBooking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  // Load movie and theater options asynchronously
  useEffect(() => {
    let isMounted = true
    const loadOptions = async () => {
      try {
        const moviesResult = await getAdminMovies({ pageSize: 50 })
        if (isMounted) {
          setMovieOptions(moviesResult.items.map((m) => ({ id: m.id, title: m.title })))
        }
        const theatersResult = await getAdminTheaters({ pageSize: 50 })
        if (isMounted) {
          setTheaterOptions(theatersResult.items.map((t) => ({ id: t.id, name: t.name })))
        }
      } catch (err) {
        console.error('Failed to load filter options:', err)
      }
    }
    loadOptions()
    return () => {
      isMounted = false
    }
  }, [])

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (status !== 'ALL') params.set('status', status)
    if (paymentStatus !== 'ALL') params.set('payment', paymentStatus)
    if (movieId !== 'ALL') params.set('movieId', movieId)
    if (theaterId !== 'ALL') params.set('theaterId', theaterId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (page > 1) params.set('page', String(page))
    if (pageSize !== 10) params.set('pageSize', String(pageSize))

    setSearchParams(params, { replace: true })
  }, [search, status, paymentStatus, movieId, theaterId, startDate, endDate, page, pageSize, setSearchParams])

  // Fetch bookings
  const fetchBookings = useCallback(() => {
    setLoading(true)
    try {
      const filters: Partial<BookingFilterState> = {
        search,
        status: status as 'ALL' | AdminBookingStatus,
        paymentStatus: paymentStatus as 'ALL' | AdminPaymentStatus,
        movieId,
        theaterId,
        startDate,
        endDate,
        page,
        pageSize,
      }

      const result = getAdminBookings(filters)
      setBookings(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Failed to load bookings:', err)
      toast.error('Không thể tải danh sách đơn đặt vé')
    } finally {
      setLoading(false)
    }
  }, [search, status, paymentStatus, movieId, theaterId, startDate, endDate, page, pageSize])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Stats summary calculation
  const stats = useMemo(() => {
    // Re-evaluate when total changes
    void total
    const all = getAdminBookings({ pageSize: 9999 }).data
    const totalRev = all
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((acc, b) => acc + b.pricing.finalTotal, 0)
    const confirmedCount = all.filter((b) => b.status === 'CONFIRMED').length
    const pendingCount = all.filter((b) => b.status === 'PENDING_PAYMENT').length
    const cancelledOrRefundedCount = all.filter(
      (b) => b.status === 'CANCELLED' || b.status === 'REFUNDED' || b.status === 'REFUND_PENDING'
    ).length

    return {
      totalCount: all.length,
      totalRevenue: totalRev,
      confirmedCount,
      pendingCount,
      cancelledOrRefundedCount,
    }
  }, [total])

  // Reset filters
  const handleResetFilters = () => {
    setSearch('')
    setStatus('ALL')
    setPaymentStatus('ALL')
    setMovieId('ALL')
    setTheaterId('ALL')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const isFiltered =
    Boolean(search) ||
    status !== 'ALL' ||
    paymentStatus !== 'ALL' ||
    movieId !== 'ALL' ||
    theaterId !== 'ALL' ||
    Boolean(startDate) ||
    Boolean(endDate)

  // Copy booking code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Đã sao chép mã ${code}`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Client-side CSV export
  const handleExportCSV = () => {
    const result = getAdminBookings({
      search,
      status: status as 'ALL' | AdminBookingStatus,
      paymentStatus: paymentStatus as 'ALL' | AdminPaymentStatus,
      movieId,
      theaterId,
      startDate,
      endDate,
      pageSize: 9999,
    })

    if (result.data.length === 0) {
      toast.warning('Không có dữ liệu phù hợp để xuất file')
      return
    }

    exportBookingsToCSV(result.data)
    toast.success(`Đã xuất ${result.data.length} đơn đặt vé ra file CSV`)
  }

  // Handle cancel booking
  const handleConfirmCancel = () => {
    if (!cancelTarget) return

    setIsCancelling(true)
    try {
      const res = cancelAdminBooking(cancelTarget.id, cancelReason)
      if (res.success) {
        toast.success(res.message)
        setCancelTarget(null)
        setCancelReason('')
        fetchBookings()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi hủy vé')
    } finally {
      setIsCancelling(false)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'DIAMOND':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
      case 'GOLD':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'SILVER':
        return 'bg-slate-400/15 text-slate-300 border-slate-400/30'
      default:
        return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Quản Lý Đặt Vé"
        description="Theo dõi và kiểm soát các giao dịch đặt vé, xử lý sự cố phòng chiếu và đối soát doanh thu cổng thanh toán"
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
              className="h-9 gap-2 rounded-xl border-border/80 bg-secondary/40 font-bold hover:bg-secondary cursor-pointer shadow-xs"
              title="Tải toàn bộ kết quả lọc ra file CSV UTF-8"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Xuất CSV ({total})</span>
            </Button>
          </div>
        }
      />

      {/* Stats Overview Chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Tổng đơn đặt vé</span>
            <ReceiptText className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-foreground font-mono tabular-nums">
              {stats.totalCount}
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
              {formatVND(stats.totalRevenue)}
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
              {stats.confirmedCount}
            </span>
            <span className="text-xs text-emerald-500 font-bold">
              {stats.totalCount > 0
                ? `${Math.round((stats.confirmedCount / stats.totalCount) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Hủy / Đang chờ hoàn</span>
            <RotateCcw className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-rose-400 font-mono tabular-nums">
              {stats.cancelledOrRefundedCount}
            </span>
            <span className="text-xs text-muted-foreground">đơn</span>
          </div>
        </div>
      </div>

      {/* Multi-Criteria Filter Bar */}
      <div className="rounded-2xl border border-border/70 bg-card/50 backdrop-blur-md p-4 space-y-3.5 shadow-xs">
        {/* Row 1: Search, Status, Payment Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo mã đơn, email, SĐT, tên khách..."
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

          {/* Booking Status Select */}
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
                <SelectItem value="REFUND_PENDING">Chờ hoàn tiền (REFUND_PENDING)</SelectItem>
                <SelectItem value="REFUNDED">Đã hoàn tiền (REFUNDED)</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy (CANCELLED)</SelectItem>
                <SelectItem value="EXPIRED">Hết hạn thanh toán (EXPIRED)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Select */}
          <div className="sm:col-span-1 lg:col-span-3">
            <Select
              value={paymentStatus}
              onValueChange={(val) => {
                setPaymentStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Trạng thái thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả thanh toán</SelectItem>
                <SelectItem value="SUCCESS">Thành công (SUCCESS)</SelectItem>
                <SelectItem value="PENDING">Đang chờ (PENDING)</SelectItem>
                <SelectItem value="FAILED">Thất bại (FAILED)</SelectItem>
                <SelectItem value="REFUNDED">Đã hoàn tiền (REFUNDED)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Movie, Theater, Date Range, Reset Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Movie Filter */}
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

          {/* Theater Filter */}
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

          {/* Date range */}
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
                title="Từ ngày"
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
                title="Đến ngày"
              />
            </div>
          </div>

          {/* Reset filter button */}
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

      {/* Main Bookings Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-secondary/30 text-muted-foreground uppercase tracking-wider font-semibold text-[11px]">
                <th scope="col" className="py-3.5 pl-4 pr-3">
                  Mã Booking
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Khách Hàng
                </th>
                <th scope="col" className="py-3.5 px-3 min-w-[200px]">
                  Phim & Suất Chiếu
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Ghế Đặt
                </th>
                <th scope="col" className="py-3.5 px-3 text-right">
                  Tổng Tiền
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Thanh Toán
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Trạng Thái
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Thời Gian Tạo
                </th>
                <th scope="col" className="py-3.5 pr-4 pl-3 text-center">
                  Thao Tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 pl-4 pr-3">
                      <Skeleton className="h-4 w-20 rounded" />
                    </td>
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
                    <td className="py-4 px-3">
                      <Skeleton className="h-5 w-16 rounded" />
                    </td>
                    <td className="py-4 px-3 text-right">
                      <Skeleton className="h-4 w-20 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-5 w-20 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-6 w-24 rounded-lg" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-3 w-28 rounded" />
                    </td>
                    <td className="py-4 pr-4 pl-3 text-center">
                      <Skeleton className="h-8 w-16 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                // Empty state
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
                      action={
                        isFiltered
                          ? {
                              label: 'Xóa bộ lọc',
                              onClick: handleResetFilters,
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                // Data Rows (strictly read-only inside cells per prompt.txt)
                bookings.map((booking) => {
                  const isCopied = copiedCode === booking.bookingCode

                  return (
                    <tr
                      key={booking.id}
                      className="group transition-colors hover:bg-secondary/20"
                    >
                      {/* Booking Code with Copy */}
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

                      {/* Customer Info */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground">
                              {booking.customer.fullName}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-wider',
                                getTierColor(booking.customer.membershipTier)
                              )}
                            >
                              {booking.customer.membershipTier}
                            </span>
                          </div>
                          <div className="text-muted-foreground text-[11px] truncate max-w-[180px]">
                            {booking.customer.email}
                          </div>
                          <div className="text-muted-foreground text-[11px] font-mono">
                            {booking.customer.phone}
                          </div>
                        </div>
                      </td>

                      {/* Movie & Showtime */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-start gap-2.5">
                          <img
                            src={booking.movie.posterUrl}
                            alt={booking.movie.title}
                            className="w-9 h-12 rounded object-cover border border-border/60 shrink-0 mt-0.5 shadow-2xs"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-foreground line-clamp-1">
                              {booking.movie.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                              <span className="font-semibold text-primary/90">
                                {booking.showtime.startTime}
                              </span>
                              <span>•</span>
                              <span>{formatDate(booking.showtime.date)}</span>
                            </div>
                            <div className="text-muted-foreground text-[11px] line-clamp-1">
                              {booking.theater.name} ({booking.theater.auditoriumName})
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seats */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {booking.seats.map((seat) => (
                              <span
                                key={seat.seatId}
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border',
                                  seat.type === 'vip'
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                    : seat.type === 'couple'
                                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                    : 'bg-secondary border-border/80 text-foreground'
                                )}
                              >
                                {seat.seatNumber}
                              </span>
                            ))}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {booking.seats.length} vé
                          </div>
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="py-3.5 px-3 align-middle text-right font-mono">
                        <div className="font-bold text-foreground tabular-nums text-xs sm:text-sm">
                          {formatVND(booking.pricing.finalTotal)}
                        </div>
                        {booking.pricing.discountAmount > 0 && (
                          <div className="text-[10px] text-emerald-400">
                            - {formatVND(booking.pricing.discountAmount)}
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[11px] font-mono font-bold text-foreground border border-border/60">
                            <CreditCard className="w-3 h-3 text-muted-foreground" />
                            {booking.payment.method}
                          </span>
                          <div>
                            {booking.payment.status === 'SUCCESS' && (
                              <span className="text-[11px] font-semibold text-emerald-400">
                                Đã thanh toán
                              </span>
                            )}
                            {booking.payment.status === 'PENDING' && (
                              <span className="text-[11px] font-semibold text-amber-400">
                                Chờ thanh toán
                              </span>
                            )}
                            {booking.payment.status === 'FAILED' && (
                              <span className="text-[11px] font-semibold text-rose-400">
                                Thất bại
                              </span>
                            )}
                            {booking.payment.status === 'REFUNDED' && (
                              <span className="text-[11px] font-semibold text-indigo-400">
                                Đã hoàn tiền
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Booking Status Badge */}
                      <td className="py-3.5 px-3 align-middle">
                        <AdminStatusBadge status={booking.status} size="sm" />
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-3 align-middle text-muted-foreground font-mono text-[11px]">
                        {booking.createdAt}
                      </td>

                      {/* Actions */}
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
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
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

      {/* Cancel Booking Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Xác nhận hủy đơn đặt vé"
        targetName={cancelTarget?.bookingCode}
        description={`Bạn đang thực hiện hủy đơn vé của khách hàng "${cancelTarget?.customer.fullName}". Thao tác này sẽ cập nhật trạng thái đơn thành CANCELLED.`}
        consequenceWarning="Toàn bộ các ghế ngồi trong đơn đặt vé này sẽ lập tức được giải phóng trở lại sơ đồ phòng chiếu để các khách hàng khác có thể tiếp tục chọn ghế."
        confirmText="Hủy đơn đặt vé"
        cancelText="Đóng"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setCancelTarget(null)
          setCancelReason('')
        }}
      />
    </div>
  )
}
