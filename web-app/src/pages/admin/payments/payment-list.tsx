import { useState, useEffect, useMemo, useCallback } from 'react'
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
} from 'lucide-react'
import type {
  AdminPayment,
  PaymentFilterState,
} from '@/types/admin-payment'
import type { PaymentMethod, AdminPaymentStatus } from '@/types/admin-booking'
import {
  getAdminPayments,
  getPaymentSummary,
  exportPaymentsToCSV,
} from '@/mocks/admin/payments'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminPagination } from '@/components/admin/common/admin-pagination'
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

export default function AdminPaymentList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters from searchParams
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [method, setMethod] = useState<string>(searchParams.get('method') || 'ALL')
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL')
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '')
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get('pageSize')) || 10)

  // Data states
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (method !== 'ALL') params.set('method', method)
    if (status !== 'ALL') params.set('status', status)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (page > 1) params.set('page', String(page))
    if (pageSize !== 10) params.set('pageSize', String(pageSize))

    setSearchParams(params, { replace: true })
  }, [search, method, status, startDate, endDate, page, pageSize, setSearchParams])

  // Fetch payments
  const fetchPayments = useCallback(() => {
    setLoading(true)
    try {
      const filters: Partial<PaymentFilterState> = {
        search,
        method: method as 'ALL' | PaymentMethod,
        status: status as 'ALL' | AdminPaymentStatus,
        startDate,
        endDate,
        page,
        pageSize,
      }

      const result = getAdminPayments(filters)
      setPayments(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Failed to load payments:', err)
      toast.error('Không thể tải danh sách giao dịch thanh toán')
    } finally {
      setLoading(false)
    }
  }, [search, method, status, startDate, endDate, page, pageSize])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Summary KPIs
  const summary = useMemo(() => {
    void total
    return getPaymentSummary()
  }, [total])

  const isFiltered =
    Boolean(search) ||
    method !== 'ALL' ||
    status !== 'ALL' ||
    Boolean(startDate) ||
    Boolean(endDate)

  const handleResetFilters = () => {
    setSearch('')
    setMethod('ALL')
    setStatus('ALL')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    toast.success(`Đã sao chép ${label}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExportCSV = () => {
    const result = getAdminPayments({
      search,
      method: method as 'ALL' | PaymentMethod,
      status: status as 'ALL' | AdminPaymentStatus,
      startDate,
      endDate,
      pageSize: 9999,
    })

    if (result.data.length === 0) {
      toast.warning('Không có dữ liệu giao dịch phù hợp để xuất file')
      return
    }

    exportPaymentsToCSV(result.data)
    toast.success(`Đã xuất ${result.data.length} giao dịch thanh toán ra file CSV`)
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Quản Lý Thanh Toán"
        description="Giám sát đối soát dòng tiền cổng thanh toán, tỷ lệ thanh toán thành công và xử lý lệnh hoàn tiền"
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

      {/* Summary KPI Cards per prompt.txt (Gross, Succeeded, Failed, Refunded) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gross Amount */}
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Tổng dòng tiền (Gross)</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-foreground font-mono tabular-nums">
              {formatVND(summary.grossAmount)}
            </span>
          </div>
        </div>

        {/* Succeeded */}
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Thanh toán thành công</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-emerald-400 font-mono tabular-nums">
              {formatVND(summary.succeededAmount)}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ({summary.succeededCount} GD)
            </span>
          </div>
        </div>

        {/* Failed */}
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Giao dịch thất bại / lỗi</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-rose-400 font-mono tabular-nums">
              {formatVND(summary.failedAmount)}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ({summary.failedCount} GD)
            </span>
          </div>
        </div>

        {/* Refunded / Pending */}
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Đã hoàn tiền / Chờ xử lý</span>
            <RotateCcw className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-indigo-400 font-mono tabular-nums">
              {formatVND(summary.refundedAmount)}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ({summary.refundedCount} GD)
            </span>
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
              placeholder="Tìm theo mã payment, mã booking, providerRef, khách..."
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

          {/* Method Select */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Select
              value={method}
              onValueChange={(val) => {
                setMethod(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả cổng</SelectItem>
                <SelectItem value="VNPAY">VNPAY</SelectItem>
                <SelectItem value="MOMO">Ví MoMo</SelectItem>
                <SelectItem value="ZALOPAY">ZaloPay</SelectItem>
                <SelectItem value="CREDIT_CARD">Thẻ Quốc Tế</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="SUCCESS">Thành công (SUCCESS)</SelectItem>
                <SelectItem value="PENDING">Chờ xử lý (PENDING)</SelectItem>
                <SelectItem value="FAILED">Thất bại (FAILED)</SelectItem>
                <SelectItem value="REFUNDED">Đã hoàn tiền (REFUNDED)</SelectItem>
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
                  const isCopied = copiedId === p.id

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
                            {p.id}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.id, 'Mã payment')}
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

                      {/* Booking Code with Link */}
                      <td className="py-3.5 px-3 align-middle font-mono">
                        {p.bookingId ? (
                          <Link
                            to={`/admin/bookings/${p.bookingId}`}
                            className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                            title="Mở chi tiết đơn đặt vé tương ứng"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>{p.bookingCode}</span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{p.bookingCode}</span>
                        )}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="space-y-0.5">
                          <div className="font-bold text-foreground">
                            {p.customer.fullName}
                          </div>
                          <div className="text-muted-foreground text-[11px] truncate max-w-[170px]">
                            {p.customer.email}
                          </div>
                          <div className="text-muted-foreground text-[11px] font-mono">
                            {p.customer.phone}
                          </div>
                        </div>
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
                        {p.bankCode && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {p.bankCode}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 align-middle">
                        <AdminStatusBadge status={p.status} size="sm" />
                      </td>

                      {/* Provider Reference */}
                      <td className="py-3.5 px-3 align-middle font-mono text-[11px]">
                        <span className="text-muted-foreground truncate max-w-[150px] block" title={p.providerRef}>
                          {p.providerRef}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-3 align-middle text-muted-foreground font-mono text-[11px]">
                        {p.createdAt}
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
