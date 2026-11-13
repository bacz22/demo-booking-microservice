import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CreditCard,
  Search,
  X,
  RotateCcw,
  Download,
  Copy,
  Check,
  Eye,
  DollarSign,
  CheckCircle2,
  XCircle,
  Ticket,
  Clock,
} from 'lucide-react'
import type { AdminPaymentRow } from '@/types/admin-payment'
import type { BackendPaymentResponse, BackendPaymentStatus } from '@/types/payment'
import {
  adminPaymentApi,
  adminUserApi,
  downloadCsv,
  toVnDate,
  type AdminPaymentQuery,
  type AdminPaymentSummary,
} from '@/services/admin-api.service'
import {
  PAYMENT_STATUS_LABEL,
  formatDateTime,
  formatVND,
  paymentBadgeStatus,
  shortId,
} from '@/lib/admin-payment-mapper'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminPagination } from '@/components/admin/common/admin-pagination'
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

const STATUSES: BackendPaymentStatus[] = ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED']

/** Ghép tên/email khách (auth-service) vào danh sách giao dịch; lỗi thì bỏ qua */
async function attachCustomers(items: BackendPaymentResponse[]): Promise<AdminPaymentRow[]> {
  const users = await adminUserApi.byIds(items.map((p) => p.userId)).catch(() => ({}) as Awaited<ReturnType<typeof adminUserApi.byIds>>)
  return items.map((p) => {
    const u = users[p.userId]
    return { ...p, customer: u ? { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone } : null }
  })
}

export default function AdminPaymentList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim())
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL')
  const [bookingId, setBookingId] = useState<string>(searchParams.get('bookingId') || '')
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '')
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get('pageSize')) || 10)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<AdminPaymentRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<AdminPaymentSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (status !== 'ALL') params.set('status', status)
    if (bookingId) params.set('bookingId', bookingId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (page > 1) params.set('page', String(page))
    if (pageSize !== 10) params.set('pageSize', String(pageSize))
    setSearchParams(params, { replace: true })
  }, [search, status, bookingId, startDate, endDate, page, pageSize, setSearchParams])

  const buildQuery = useCallback(
    (): AdminPaymentQuery => ({
      q: debouncedSearch || undefined,
      status: status === 'ALL' ? undefined : (status as BackendPaymentStatus),
      bookingId: bookingId || undefined,
      from: startDate || undefined,
      to: endDate || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [debouncedSearch, status, bookingId, startDate, endDate],
  )

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminPaymentApi.list({ ...buildQuery(), page: page - 1, pageSize })
      setPayments(await attachCustomers(res.items))
      setTotal(res.total)
      setTotalPages(Math.max(1, res.totalPages))
    } catch (err) {
      console.error('Failed to load payments:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách giao dịch thanh toán')
    } finally {
      setLoading(false)
    }
  }, [buildQuery, page, pageSize])

  useEffect(() => {
    void fetchPayments()
  }, [fetchPayments])

  // Tổng hợp theo khoảng ngày đã chọn (mặc định 30 ngày gần nhất)
  const [defaultRange] = useState(() => ({
    from: toVnDate(new Date(Date.now() - 29 * 24 * 3600 * 1000)),
    to: toVnDate(new Date()),
  }))
  const summaryTo = endDate || defaultRange.to
  const summaryFrom = startDate || defaultRange.from
  useEffect(() => {
    let cancelled = false
    setSummaryLoading(true)
    adminPaymentApi
      .summary(summaryFrom, summaryTo)
      .then((s) => {
        if (!cancelled) setSummary(s)
      })
      .catch((err) => {
        console.error('Failed to load payment summary:', err)
        if (!cancelled) setSummary(null)
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [summaryFrom, summaryTo])

  const stat = (s: BackendPaymentStatus) => summary?.byStatus?.[s] ?? { count: 0, amount: 0 }
  const succeeded = stat('SUCCEEDED')
  const failed = stat('FAILED')
  const refunded = stat('REFUNDED')
  const pendingCount = stat('PENDING').count + stat('PROCESSING').count
  const pendingAmount = stat('PENDING').amount + stat('PROCESSING').amount
  const successRate = summary?.successRate ?? null

  const isFiltered =
    Boolean(search) || status !== 'ALL' || Boolean(bookingId) || Boolean(startDate) || Boolean(endDate)

  const handleResetFilters = () => {
    setSearch('')
    setStatus('ALL')
    setBookingId('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(text)
    toast.success(`Đã sao chép ${label}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExportCSV = async () => {
    if (total === 0) {
      toast.warning('Không có dữ liệu giao dịch phù hợp để xuất file')
      return
    }
    setExporting(true)
    try {
      const all: AdminPaymentRow[] = []
      for (let p = 0; ; p++) {
        const res = await adminPaymentApi.list({ ...buildQuery(), page: p, pageSize: 200 })
        all.push(...(await attachCustomers(res.items)))
        if (p + 1 >= res.totalPages || res.items.length === 0 || all.length >= 10000) break
      }
      downloadCsv(
        `thanh-toan-${toVnDate(new Date())}.csv`,
        ['Mã giao dịch', 'Booking ID', 'Khách hàng', 'Email', 'Số tiền', 'Tiền tệ', 'Phương thức', 'Trạng thái', 'Provider Ref', 'Mã lỗi', 'Thông điệp lỗi', 'Tạo lúc', 'Thanh toán lúc', 'Thất bại lúc'],
        all.map((p) => [
          p.paymentCode,
          p.bookingId,
          p.customer?.fullName,
          p.customer?.email,
          p.amount,
          p.currency,
          p.method,
          p.status,
          p.providerRef,
          p.failureCode,
          p.failureMessage,
          formatDateTime(p.createdAt),
          p.paidAt ? formatDateTime(p.paidAt) : '',
          p.failedAt ? formatDateTime(p.failedAt) : '',
        ]),
      )
      toast.success(`Đã xuất ${all.length} giao dịch thanh toán ra file CSV`)
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Xuất CSV thất bại')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Quản Lý Thanh Toán"
        description="Giám sát dòng tiền thanh toán, tỷ lệ thanh toán thành công và các giao dịch được hoàn tiền"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Thanh toán' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleExportCSV()}
              disabled={exporting || loading}
              className="h-9 gap-2 rounded-xl border-border/80 bg-secondary/40 font-bold hover:bg-secondary cursor-pointer shadow-xs"
              title="Tải toàn bộ kết quả lọc ra file CSV UTF-8"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>{exporting ? 'Đang xuất...' : `Xuất CSV (${total})`}</span>
            </Button>
          </div>
        }
      />

            {/* Summary KPI Cards: tổng hợp theo khoảng ngày (mặc định 30 ngày gần nhất) */}
      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground">
          Số liệu tổng hợp từ {summaryFrom} đến {summaryTo}
          {!startDate && !endDate ? ' (30 ngày gần nhất)' : ''}
          {!summaryLoading && !summary ? ' — không tải được số liệu tổng hợp' : ''}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Tổng giao dịch</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          {summaryLoading ? (
            <Skeleton className="mt-2 h-7 w-32 rounded" />
          ) : (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-foreground font-mono tabular-nums">
                {formatVND(summary?.totalAmount ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground font-mono">({summary?.totalCount ?? 0} GD)</span>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Thành công</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          {summaryLoading ? (
            <Skeleton className="mt-2 h-7 w-32 rounded" />
          ) : (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-emerald-400 font-mono tabular-nums">
                {formatVND(succeeded.amount)}
              </span>
              <span className="text-xs text-muted-foreground font-mono">({succeeded.count} GD{successRate !== null ? ` · ${(successRate * 100).toFixed(1)}%` : ''})</span>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Thất bại</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          {summaryLoading ? (
            <Skeleton className="mt-2 h-7 w-32 rounded" />
          ) : (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-rose-400 font-mono tabular-nums">
                {formatVND(failed.amount)}
              </span>
              <span className="text-xs text-muted-foreground font-mono">({failed.count} GD)</span>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Đang chờ / xử lý</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          {summaryLoading ? (
            <Skeleton className="mt-2 h-7 w-32 rounded" />
          ) : (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-amber-400 font-mono tabular-nums">
                {formatVND(pendingAmount)}
              </span>
              <span className="text-xs text-muted-foreground font-mono">({pendingCount} GD)</span>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Đã hoàn tiền</span>
            <RotateCcw className="w-4 h-4 text-indigo-400" />
          </div>
          {summaryLoading ? (
            <Skeleton className="mt-2 h-7 w-32 rounded" />
          ) : (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-indigo-400 font-mono tabular-nums">
                {formatVND(refunded.amount)}
              </span>
              <span className="text-xs text-muted-foreground font-mono">({refunded.count} GD)</span>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-border/70 bg-card/50 backdrop-blur-md p-4 space-y-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo mã giao dịch, providerRef..."
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

          {/* Booking filter (từ trang chi tiết đơn) */}
          <div className="sm:col-span-1 lg:col-span-2">
            {bookingId ? (
              <div className="h-10 rounded-xl bg-primary/10 border border-primary/30 text-xs font-mono flex items-center justify-between px-3 gap-2">
                <span className="truncate" title={bookingId}>
                  Booking: {shortId(bookingId)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBookingId('')
                    setPage(1)
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Bỏ lọc theo đơn đặt vé"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-10 rounded-xl bg-secondary/20 border border-border/60 text-[11px] text-muted-foreground flex items-center px-3">
                Phương thức: MOCK
              </div>
            )}
          </div>

          {/* Status Select */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {STATUSES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {PAYMENT_STATUS_LABEL[st]} ({st})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
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
            <span className="text-muted-foreground text-xs font-bold shrink-0">→</span>
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

          {/* Reset button */}
          <div className="sm:col-span-2 lg:col-span-1 flex justify-end">
            {isFiltered && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer w-full lg:w-auto"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="lg:hidden">Xóa lọc</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-secondary/30 text-muted-foreground uppercase tracking-wider font-semibold text-[11px]">
                <th scope="col" className="py-3.5 pl-4 pr-3">
                  Mã Giao Dịch
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Mã Booking
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Khách Hàng
                </th>
                <th scope="col" className="py-3.5 px-3 text-right">
                  Số Tiền
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Phương Thức
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Trạng Thái
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Mã Đối Soát (Provider Ref)
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
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 pl-4 pr-3">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-4 w-20 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-3 w-36 rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <Skeleton className="h-4 w-20 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-5 w-16 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-4 w-28 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-4 w-28 rounded" />
                    </td>
                    <td className="py-4 pr-4 pl-3 text-center">
                      <Skeleton className="h-8 w-16 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-10">
                    <PageErrorState
                      title="Không thể tải danh sách giao dịch"
                      message={error}
                      onRetry={() => void fetchPayments()}
                    />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <EmptyState
                      icon={CreditCard}
                      title="Không tìm thấy giao dịch nào"
                      description={
                        isFiltered
                          ? 'Thử thay đổi bộ lọc tìm kiếm hoặc xóa từ khóa hiện tại'
                          : 'Hiện tại hệ thống chưa phát sinh giao dịch thanh toán nào'
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
                payments.map((p) => {
                  const isCopied = copiedId === p.paymentCode

                  return (
                    <tr
                      key={p.id}
                      className="group transition-colors hover:bg-secondary/20"
                    >
                      {/* Payment ID */}
                      <td className="py-3.5 pl-4 pr-3 align-middle font-mono">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/admin/payments/${p.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline tabular-nums"
                            title="Xem chi tiết giao dịch"
                          >
                            {p.paymentCode}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.paymentCode, 'Mã giao dịch')}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                            title="Sao chép mã giao dịch"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Booking (chỉ có bookingId, không gọi API từng dòng) */}
                      <td className="py-3.5 px-3 align-middle font-mono">
                        <Link
                          to={`/admin/bookings/${p.bookingId}`}
                          className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                          title={`Mở chi tiết đơn đặt vé ${p.bookingId}`}
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{shortId(p.bookingId)}</span>
                        </Link>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-3 align-middle">
                        {p.customer ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-foreground">{p.customer.fullName}</div>
                            <div className="text-muted-foreground text-[11px] truncate max-w-[170px]">
                              {p.customer.email}
                            </div>
                            {p.customer.phone && (
                              <div className="text-muted-foreground text-[11px] font-mono">{p.customer.phone}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[11px]" title={p.userId}>
                            {shortId(p.userId)}
                          </span>
                        )}
                      </td>

                                            {/* Amount */}
                      <td className="py-3.5 px-3 align-middle text-right font-mono">
                        <span className="font-bold text-foreground tabular-nums text-xs sm:text-sm">
                          {formatVND(p.amount)}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-3 align-middle font-mono">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[11px] font-bold text-foreground border border-border/60">
                          <CreditCard className="w-3 h-3 text-muted-foreground" />
                          {p.method}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 align-middle">
                        <AdminStatusBadge status={paymentBadgeStatus(p.status)} label={PAYMENT_STATUS_LABEL[p.status]} size="sm" />
                      </td>

                      {/* Provider Reference */}
                      <td className="py-3.5 px-3 align-middle font-mono text-[11px]">
                        <span className="text-muted-foreground truncate max-w-[150px] block" title={p.providerRef ?? undefined}>
                          {p.providerRef ?? '—'}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-3 align-middle text-muted-foreground font-mono text-[11px]">
                        {formatDateTime(p.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 pr-4 pl-3 align-middle text-center">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs gap-1 cursor-pointer font-bold border-border/80 hover:bg-secondary"
                        >
                          <Link to={`/admin/payments/${p.id}`}>
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            <span>Chi tiết</span>
                          </Link>
                        </Button>
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
            itemLabel="giao dịch"
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(ps) => {
              setPageSize(ps)
              setPage(1)
            }}
          />
        </div>
      </div>
    </div>
  )
}
