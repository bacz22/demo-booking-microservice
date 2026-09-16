import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Building2,
  Plus,
  Search,
  X,
  RotateCcw,
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  Pencil,
  Wrench,
  CheckCircle2,
  XCircle,
  ImageOff,
  Tv,
  Users,
  Film,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
} from 'lucide-react'
import type {
  AdminTheater,
  AdminTheaterStatus,
  TheaterFilterState,
  TheaterPaginationResult,
} from '@/types/admin-theater'
import {
  getAdminTheaters,
  getAllCities,
  updateTheaterStatus,
} from '@/mocks/admin/theaters'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminPagination } from '@/components/admin/common/admin-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminTheaterList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // View mode toggle: 'table' or 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Derive filter state from URL query
  const filters: TheaterFilterState = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      city: searchParams.get('city') || 'all',
      status: searchParams.get('status') || 'all',
      sortBy:
        (searchParams.get('sortBy') as
          | 'name'
          | 'city'
          | 'totalRooms'
          | 'totalSeats'
          | 'todayShowtimes') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || 10,
    }
  }, [searchParams])

  const [data, setData] = useState<TheaterPaginationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cities, setCities] = useState<string[]>([])
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)

  // Update query params helper
  const updateUrlParams = useCallback(
    (newParams: Partial<Record<string, string | number>>) => {
      const current = new URLSearchParams(searchParams)
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === undefined || val === '' || val === 'all') {
          current.delete(key)
        } else {
          current.set(key, String(val))
        }
      })
      setSearchParams(current, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  // Load cities once
  useEffect(() => {
    setCities(getAllCities())
  }, [refreshIndex])

  // Load theaters
  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    getAdminTheaters(filters)
      .then((res) => {
        if (!isCancelled) {
          setData(res)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          toast.error('Không thể tải danh sách cụm rạp. Vui lòng thử lại.')
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [filters, refreshIndex])

  const triggerRefresh = () => {
    setRefreshIndex((prev) => prev + 1)
  }

  // Filter handlers
  const handleSearchChange = (val: string) => updateUrlParams({ search: val, page: 1 })
  const handleCityChange = (val: string) => updateUrlParams({ city: val, page: 1 })
  const handleStatusChange = (val: string) => updateUrlParams({ status: val, page: 1 })
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') =>
    updateUrlParams({ sortBy, sortOrder })

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  // Quick Status update
  const handleQuickStatus = async (theater: AdminTheater, status: AdminTheaterStatus) => {
    setOpenActionMenuId(null)
    const success = await updateTheaterStatus(theater.id, status)
    if (success) {
      toast.success(
        status === 'active'
          ? `Đã kích hoạt hoạt động cho rạp "${theater.name}"!`
          : status === 'maintenance'
            ? `Đã chuyển rạp "${theater.name}" sang chế độ bảo trì!`
            : `Đã tạm ngưng vận hành rạp "${theater.name}"!`
      )
      triggerRefresh()
    }
  }

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    if (!data) return { totalTheaters: 0, totalRooms: 0, totalSeats: 0, todayShowtimes: 0 }
    const totalTheaters = data.total
    const totalRooms = data.items.reduce((sum, t) => sum + t.totalRooms, 0)
    const totalSeats = data.items.reduce((sum, t) => sum + t.totalSeats, 0)
    const todayShowtimes = data.items.reduce((sum, t) => sum + t.todayShowtimesCount, 0)
    return { totalTheaters, totalRooms, totalSeats, todayShowtimes }
  }, [data])

  // Count active filters
  let activeFilterCount = 0
  if (filters.search) activeFilterCount++
  if (filters.city !== 'all') activeFilterCount++
  if (filters.status !== 'all') activeFilterCount++

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Quản Lý Cụm Rạp & Phòng Chiếu"
        description="Hệ thống quản lý cụm rạp toàn quốc, cơ sở vật chất và cấu hình các phòng chiếu"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Cụm rạp & Phòng' },
        ]}
        actions={
          <Button
            asChild
            variant="primary"
            size="sm"
            className="rounded-xl text-xs gap-1.5 shadow-sm shadow-primary/30 cursor-pointer font-bold"
          >
            <Link to="/admin/theaters/new">
              <Plus className="w-4 h-4" />
              <span>Thêm rạp mới</span>
            </Link>
          </Button>
        }
      />

      {/* 2. System KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng số cụm rạp
            </p>
            <p className="text-xl font-mono font-black text-foreground">
              {summaryMetrics.totalTheaters}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Phòng chiếu hoạt động
            </p>
            <p className="text-xl font-mono font-black text-foreground">
              {summaryMetrics.totalRooms}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng ghế phục vụ
            </p>
            <p className="text-xl font-mono font-black text-foreground">
              {summaryMetrics.totalSeats.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Suất chiếu hôm nay
            </p>
            <p className="text-xl font-mono font-black text-primary">
              {summaryMetrics.todayShowtimes}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <Input
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên cụm rạp hoặc địa chỉ..."
              leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
              rightIcon={
                filters.search ? (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSearchChange('')}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
              className="h-10 text-xs rounded-xl bg-secondary/40 border-border/70 focus-visible:bg-background"
            />
          </div>

          {/* City Select */}
          <div className="lg:col-span-4">
            <Select value={filters.city} onValueChange={handleCityChange}>
              <SelectTrigger
                className="h-10 text-xs rounded-xl bg-secondary/40 border-border/70"
                aria-label="Lọc theo thành phố"
              >
                <SelectValue placeholder="Tất cả thành phố" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thành phố</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Select */}
          <div className="lg:col-span-3">
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger
                className="h-10 text-xs rounded-xl bg-secondary/40 border-border/70"
                aria-label="Lọc theo trạng thái rạp"
              >
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động (Active)</SelectItem>
                <SelectItem value="maintenance">Đang bảo trì (Maintenance)</SelectItem>
                <SelectItem value="inactive">Tạm ngưng (Inactive)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sorting, View Mode & Reset Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
          {/* Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sắp xếp:</span>
            </span>

            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(val) => {
                const [sb, so] = val.split('-') as [
                  'name' | 'city' | 'totalRooms' | 'totalSeats' | 'todayShowtimes',
                  'asc' | 'desc',
                ]
                handleSortChange(sb, so)
              }}
            >
              <SelectTrigger className="h-8 text-xs rounded-lg border-border/60 bg-secondary/50 min-w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Tên rạp: A đến Z</SelectItem>
                <SelectItem value="name-desc">Tên rạp: Z đến A</SelectItem>
                <SelectItem value="city-asc">Thành phố: A đến Z</SelectItem>
                <SelectItem value="totalRooms-desc">Số phòng chiếu: Nhiều nhất</SelectItem>
                <SelectItem value="totalSeats-desc">Tổng số ghế: Nhiều nhất</SelectItem>
                <SelectItem value="todayShowtimes-desc">Suất hôm nay: Nhiều nhất</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 text-[11px] font-bold"
              >
                {activeFilterCount} bộ lọc đang áp dụng
              </Badge>
            )}
          </div>

          {/* Right Side: View Switch & Reset */}
          <div className="flex items-center gap-2">
            {/* View Mode Switch */}
            <div className="flex items-center rounded-xl border border-border/70 bg-secondary/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Xem dạng bảng"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Xem dạng thẻ"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Thẻ</span>
              </button>
            </div>

            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Theater Data Display */}
      <div className="rounded-2xl border border-border/70 bg-card p-1 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Không tìm thấy cụm rạp phù hợp"
            description="Không có cụm rạp nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại. Bạn hãy thử điều chỉnh lại bộ lọc."
            action={{
              label: 'Xóa tất cả bộ lọc',
              onClick: handleResetFilters,
            }}
            className="py-12"
          />
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="overflow-x-auto scrollbar-thin">
            <table
              className="w-full text-left text-xs border-collapse min-w-[960px]"
              aria-label="Bảng danh sách cụm rạp CineBook"
            >
              <caption className="sr-only">Danh sách quản lý cụm rạp và phòng chiếu CineBook</caption>
              <thead>
                <tr className="border-b border-border/60 bg-secondary/35 text-muted-foreground font-semibold">
                  <th scope="col" className="py-3 px-3 w-16 text-center">
                    Hình ảnh
                  </th>
                  <th scope="col" className="py-3 px-4 font-bold min-w-[200px]">
                    Tên cụm rạp &amp; Thành phố
                  </th>
                  <th scope="col" className="py-3 px-4 font-bold max-w-[280px]">
                    Địa chỉ chi tiết
                  </th>
                  <th scope="col" className="py-3 px-3 font-bold text-center">
                    Phòng chiếu
                  </th>
                  <th scope="col" className="py-3 px-3 font-bold text-center">
                    Tổng ghế
                  </th>
                  <th scope="col" className="py-3 px-3 font-bold text-center">
                    Suất hôm nay
                  </th>
                  <th scope="col" className="py-3 px-3.5 font-bold text-center">
                    Trạng thái
                  </th>
                  <th scope="col" className="py-3 px-4 font-bold text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.items.map((theater) => {
                  const isMenuOpen = openActionMenuId === theater.id

                  return (
                    <tr
                      key={theater.id}
                      className="hover:bg-secondary/35 transition-colors duration-150"
                    >
                      {/* Image Thumbnail */}
                      <td className="py-2.5 px-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden border border-border/60 bg-secondary/80 flex items-center justify-center shrink-0 shadow-xs relative">
                          <img
                            src={theater.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <ImageOff className="w-4 h-4 text-muted-foreground/40 absolute pointer-events-none" />
                        </div>
                      </td>

                      {/* Name & City */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <Link
                            to={`/admin/theaters/${theater.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors text-sm line-clamp-1 block"
                            title={theater.name}
                          >
                            {theater.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded-md bg-secondary border border-border/50 font-medium">
                              {theater.city}
                            </span>
                            <span className="text-muted-foreground/60">•</span>
                            <span className="font-mono text-[10px]">{theater.hotline}</span>
                          </div>
                        </div>
                      </td>

                      {/* Detailed Address (wrapped naturally) */}
                      <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                        <div className="flex items-start gap-1 max-w-[280px]">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[11px]">{theater.address}</span>
                        </div>
                      </td>

                      {/* Rooms Count */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2 py-0.5 rounded-md border border-border/60">
                          {theater.totalRooms} phòng
                        </span>
                      </td>

                      {/* Total Seats */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          {theater.totalSeats.toLocaleString('vi-VN')}
                        </span>
                      </td>

                      {/* Today Showtimes */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {theater.todayShowtimesCount > 0 ? (
                          <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {theater.todayShowtimesCount}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground/60">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <AdminStatusBadge status={theater.status} size="sm" />
                      </td>

                      {/* Row Action Menu */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Popover
                          open={isMenuOpen}
                          onOpenChange={(open) => setOpenActionMenuId(open ? theater.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary"
                              aria-label={`Thao tác cho rạp ${theater.name}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            sideOffset={4}
                            className="w-48 rounded-xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl space-y-0.5 text-left"
                          >
                            {/* 1. View detail */}
                            <Link
                              to={`/admin/theaters/${theater.id}`}
                              onClick={() => setOpenActionMenuId(null)}
                              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors font-medium"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-primary" />
                              <span>Xem chi tiết &amp; phòng</span>
                            </Link>

                            {/* 2. Edit theater */}
                            <Link
                              to={`/admin/theaters/${theater.id}/edit`}
                              onClick={() => setOpenActionMenuId(null)}
                              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Chỉnh sửa thông tin</span>
                            </Link>

                            <div className="border-t border-border/50 my-1" />

                            {/* 3. Quick Status Toggles */}
                            <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                              Đổi trạng thái:
                            </div>

                            {theater.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(theater, 'active')}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Kích hoạt hoạt động</span>
                              </button>
                            )}

                            {theater.status !== 'maintenance' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(theater, 'maintenance')}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer text-left"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>Chuyển sang bảo trì</span>
                              </button>
                            )}

                            {theater.status !== 'inactive' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(theater, 'inactive')}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Tạm ngưng vận hành</span>
                              </button>
                            )}
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.items.map((theater) => (
              <div
                key={theater.id}
                className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Cover Image */}
                  <div className="w-full h-36 relative overflow-hidden bg-secondary/80 border-b border-border/50">
                    <img
                      src={theater.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      <AdminStatusBadge status={theater.status} size="sm" />
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-0.5 rounded-md bg-background/90 backdrop-blur-md text-[11px] font-bold text-foreground border border-border/60">
                        {theater.city}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    <Link
                      to={`/admin/theaters/${theater.id}`}
                      className="font-bold text-foreground hover:text-primary transition-colors text-base line-clamp-1 block"
                    >
                      {theater.name}
                    </Link>

                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
                      <MapPin className="w-4 h-4 text-muted-foreground/70 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[11px]">{theater.address}</span>
                    </div>

                    {/* Stats Pill Row */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50 text-center">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Phòng</span>
                        <span className="font-mono font-bold text-xs text-foreground">
                          {theater.totalRooms}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Tổng ghế</span>
                        <span className="font-mono font-bold text-xs text-foreground">
                          {theater.totalSeats}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Suất hôm nay</span>
                        <span className="font-mono font-bold text-xs text-primary">
                          {theater.todayShowtimesCount}
                        </span>
                      </div>
                    </div>

                    {/* Features Badges */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {theater.features.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground border border-border/50"
                        >
                          {f}
                        </span>
                      ))}
                      {theater.features.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">
                          +{theater.features.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-secondary/25 border-t border-border/50 flex items-center justify-between gap-2">
                  <Button asChild variant="outline" size="sm" className="h-8 text-xs rounded-xl flex-1 cursor-pointer">
                    <Link to={`/admin/theaters/${theater.id}`}>
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      <span>Xem chi tiết</span>
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-8 text-xs rounded-xl cursor-pointer">
                    <Link to={`/admin/theaters/${theater.id}/edit`}>
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      <span>Sửa</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. Pagination */}
        {data && (
          <div className="p-3 border-t border-border/50">
            <AdminPagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={(page) => updateUrlParams({ page })}
              onPageSizeChange={(pageSize) => updateUrlParams({ pageSize, page: 1 })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
