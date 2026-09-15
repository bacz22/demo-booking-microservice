import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  ExternalLink,
  Pencil,
  Archive,
  MoreVertical,
  Film,
  Sparkles,
  Clock,
  ImageOff,
  Search,
} from 'lucide-react'
import type {
  AdminMovie,
  AdminMovieStatus,
  AdminAgeRating,
  MovieFilterState,
  MoviePaginationResult,
} from '@/types/admin-movie'
import {
  getAdminMovies,
  getAllGenres,
  updateMovieStatus,
  archiveMovie,
  bulkUpdateMovieStatus,
  bulkArchiveMovies,
} from '@/mocks/admin/movies'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminFilterBar } from '@/components/admin/common/admin-filter-bar'
import { AdminTableToolbar } from '@/components/admin/common/admin-table-toolbar'
import { AdminPagination } from '@/components/admin/common/admin-pagination'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminMovieList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Derive filter state from URL Query params
  const filters: MovieFilterState = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
      genre: searchParams.get('genre') || 'all',
      ageRating: searchParams.get('ageRating') || 'all',
      sortBy: (searchParams.get('sortBy') as 'releaseDate' | 'updatedAt' | 'title') || 'releaseDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || 10,
    }
  }, [searchParams])

  const [data, setData] = useState<MoviePaginationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    mode: 'single-archive' | 'bulk-archive'
    targetMovie?: AdminMovie
    isLoading: boolean
  }>({
    isOpen: false,
    mode: 'single-archive',
    isLoading: false,
  })

  // Update URL Search Params helper
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

  const [genresList] = useState<string[]>(() => getAllGenres())
  const [refreshIndex, setRefreshIndex] = useState(0)

  // Load movies based on filters and refresh trigger
  useEffect(() => {
    let isCancelled = false

    getAdminMovies(filters)
      .then((result) => {
        if (!isCancelled) {
          setData(result)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          toast.error('Không thể tải danh sách phim. Vui lòng thử lại.')
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [filters, refreshIndex])

  const triggerRefresh = useCallback(() => {
    setIsLoading(true)
    setRefreshIndex((prev) => prev + 1)
  }, [])


  // Handlers for Filters
  const handleSearchChange = (search: string) => {
    updateUrlParams({ search, page: 1 })
  }

  const handleStatusChange = (status: string) => {
    updateUrlParams({ status, page: 1 })
  }

  const handleGenreChange = (genre: string) => {
    updateUrlParams({ genre, page: 1 })
  }

  const handleAgeRatingChange = (ageRating: string) => {
    updateUrlParams({ ageRating, page: 1 })
  }

  const handleSortChange = (sortBy: 'releaseDate' | 'updatedAt' | 'title', sortOrder: 'asc' | 'desc') => {
    updateUrlParams({ sortBy, sortOrder })
  }

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
    setSelectedIds([])
  }

  // Selection handlers
  const allCurrentIds = data?.items.map((m) => m.id) || []
  const isAllSelected = allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedIds.includes(id))
  const isSomeSelected = allCurrentIds.some((id) => selectedIds.includes(id)) && !isAllSelected

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allCurrentIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allCurrentIds])))
    }
  }

  const handleRowSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Row Actions: Quick Status Change
  const handleQuickStatus = async (movie: AdminMovie, status: AdminMovieStatus) => {
    setOpenActionMenuId(null)
    const success = await updateMovieStatus(movie.id, status)
    if (success) {
      toast.success(`Đã cập nhật trạng thái phim "${movie.title}"!`)
      triggerRefresh()
    }
  }

  // Row Action: Single Archive
  const handleOpenArchiveDialog = (movie: AdminMovie) => {
    setOpenActionMenuId(null)
    setConfirmDialog({
      isOpen: true,
      mode: 'single-archive',
      targetMovie: movie,
      isLoading: false,
    })
  }

  // Bulk Actions
  const handleBulkStatusChange = async (status: AdminMovieStatus) => {
    if (selectedIds.length === 0) return
    const count = await bulkUpdateMovieStatus(selectedIds, status)
    toast.success(`Đã cập nhật trạng thái cho ${count} phim đã chọn!`)
    setSelectedIds([])
    triggerRefresh()
  }

  const handleOpenBulkArchiveDialog = () => {
    if (selectedIds.length === 0) return
    setConfirmDialog({
      isOpen: true,
      mode: 'bulk-archive',
      isLoading: false,
    })
  }

  // Confirm Dialog Confirm Action
  const handleConfirmAction = async () => {
    try {
      setConfirmDialog((prev) => ({ ...prev, isLoading: true }))
      if (confirmDialog.mode === 'single-archive' && confirmDialog.targetMovie) {
        await archiveMovie(confirmDialog.targetMovie.id)
        toast.success(`Đã chuyển phim "${confirmDialog.targetMovie.title}" vào lưu trữ an toàn!`)
      } else if (confirmDialog.mode === 'bulk-archive') {
        const count = await bulkArchiveMovies(selectedIds)
        toast.success(`Đã lưu trữ an toàn ${count} phim đã chọn!`)
        setSelectedIds([])
      }
      setConfirmDialog({ isOpen: false, mode: 'single-archive', isLoading: false })
      triggerRefresh()
    } catch {
      toast.error('Thao tác không thành công. Vui lòng thử lại.')
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
    }
  }

  // Age Rating Badge Color
  const getAgeRatingBadge = (rating?: AdminAgeRating | string) => {
    switch (rating) {
      case 'P':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      case 'K':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
      case 'T13':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      case 'T16':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
      case 'T18':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      default:
        return 'bg-secondary text-secondary-foreground border-border/60'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header with CTA */}
      <AdminPageHeader
        title="Quản Lý Phim"
        description="Quản lý danh mục phim, kiểm soát trạng thái phát hành, thời lượng và lịch chiếu trên toàn hệ thống CineBook"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Quản lý phim' },
        ]}
        actions={
          <Button
            asChild
            variant="primary"
            size="sm"
            className="rounded-xl gap-2 shadow-sm shadow-primary/30 cursor-pointer font-bold"
          >
            <Link to="/admin/movies/new">
              <Plus className="w-4 h-4" />
              <span>Thêm phim mới</span>
            </Link>
          </Button>
        }
      />

      {/* 2. Filter & Search Bar */}
      <AdminFilterBar
        filters={filters}
        genresList={genresList}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onGenreChange={handleGenreChange}
        onAgeRatingChange={handleAgeRatingChange}
        onSortChange={handleSortChange}
        onReset={handleResetFilters}
      />

      {/* 3. Bulk Action Toolbar */}
      <AdminTableToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkArchive={handleOpenBulkArchiveDialog}
      />

      {/* 4. Semantic Data Table */}
      <div className="rounded-2xl border border-border/70 bg-card p-1 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          /* Empty State using shared component */
          <EmptyState
            icon={Search}
            title="Không tìm thấy bộ phim phù hợp"
            description="Không có phim nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại. Bạn hãy thử điều chỉnh lại bộ lọc."
            action={{
              label: 'Xóa tất cả bộ lọc',
              onClick: handleResetFilters,
            }}
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table
              className="w-full text-left text-xs border-collapse min-w-[980px]"
              aria-label="Bảng quản lý danh sách phim"
            >
              <caption className="sr-only">Danh sách phim hiện tại của hệ thống rạp CineBook</caption>
              <thead>
                <tr className="border-b border-border/60 bg-secondary/35 text-muted-foreground font-semibold">
                  {/* Checkbox Select All */}
                  <th scope="col" className="py-3 px-3.5 w-10">
                    <Input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected
                      }}
                      onChange={handleSelectAllToggle}
                      className="cursor-pointer"
                      aria-label="Chọn tất cả phim trong trang"
                    />
                  </th>

                  {/* Poster Thumbnail */}
                  <th scope="col" className="py-3 px-3 w-16 text-center">
                    Poster
                  </th>

                  {/* Title & Info */}
                  <th
                    scope="col"
                    className="py-3 px-4 font-bold"
                    aria-sort={
                      filters.sortBy === 'title'
                        ? filters.sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    Tên phim &amp; Tên gốc
                  </th>

                  {/* Genres */}
                  <th scope="col" className="py-3 px-3.5 font-bold">
                    Thể loại
                  </th>

                  {/* Duration & Age Rating */}
                  <th scope="col" className="py-3 px-3.5 font-bold">
                    Thời lượng &amp; Độ tuổi
                  </th>

                  {/* Release Date */}
                  <th
                    scope="col"
                    className="py-3 px-3.5 font-bold"
                    aria-sort={
                      filters.sortBy === 'releaseDate'
                        ? filters.sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    Khởi chiếu
                  </th>

                  {/* Status */}
                  <th scope="col" className="py-3 px-3.5 font-bold text-center">
                    Trạng thái
                  </th>

                  {/* Showtime Count */}
                  <th scope="col" className="py-3 px-3 font-bold text-center">
                    Suất chiếu
                  </th>

                  {/* Actions */}
                  <th scope="col" className="py-3 px-4 font-bold text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {data.items.map((movie) => {
                  const isSelected = selectedIds.includes(movie.id)
                  const isMenuOpen = openActionMenuId === movie.id

                  return (
                    <tr
                      key={movie.id}
                      className={cn(
                        'transition-colors duration-150',
                        isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/35'
                      )}
                    >
                      {/* Checkbox Select Row */}
                      <td className="py-3 px-3.5">
                        <Input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelectToggle(movie.id)}
                          className="cursor-pointer"
                          aria-label={`Chọn phim ${movie.title}`}
                        />
                      </td>

                      {/* Poster Thumbnail 2:3 */}
                      <td className="py-2.5 px-3">
                        <div className="w-12 h-18 rounded-lg overflow-hidden border border-border/60 bg-secondary/80 flex items-center justify-center shrink-0 shadow-xs relative">
                          <img
                            src={movie.posterUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback image handling
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center')
                            }}
                          />
                          <ImageOff className="w-4 h-4 text-muted-foreground/40 absolute pointer-events-none" />
                        </div>
                      </td>

                      {/* Title & Info */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <Link
                            to={`/admin/movies/${movie.id}/edit`}
                            className="font-bold text-foreground hover:text-primary transition-colors text-sm line-clamp-1"
                            title={movie.title}
                          >
                            {movie.title}
                          </Link>

                          {movie.originalTitle && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                              {movie.originalTitle}
                            </p>
                          )}

                          <div className="text-[10px] text-muted-foreground/70 font-mono">
                            Cập nhật: {movie.updatedAt}
                          </div>
                        </div>
                      </td>

                      {/* Genres */}
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {movie.genres.slice(0, 3).map((g) => (
                            <span
                              key={g}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-muted-foreground border border-border/50"
                            >
                              {g}
                            </span>
                          ))}
                          {movie.genres.length > 3 && (
                            <span className="px-1 py-0.5 text-[10px] text-muted-foreground font-mono">
                              +{movie.genres.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duration & Age Rating */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {movie.duration} phút
                          </span>
                          <span className="text-muted-foreground/50">•</span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 font-bold', getAgeRatingBadge(movie.ageRating))}
                          >
                            {movie.ageRating}
                          </Badge>
                        </div>
                      </td>

                      {/* Release Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {movie.releaseDate}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <AdminStatusBadge status={movie.status} size="sm" />
                      </td>

                      {/* Showtime Count */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {movie.showtimeCount > 0 ? (
                          <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {movie.showtimeCount}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground/60">—</span>
                        )}
                      </td>

                      {/* Row Action Menu */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Popover
                          open={isMenuOpen}
                          onOpenChange={(open) => setOpenActionMenuId(open ? movie.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary"
                              aria-label={`Thao tác cho phim ${movie.title}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>

                          {/* Action Popover Menu Content */}
                          <PopoverContent
                            align="end"
                            sideOffset={4}
                            className="w-48 rounded-xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl space-y-0.5 text-left"
                          >
                            {/* 1. View customer page */}
                            <a
                              href={`/movies/${movie.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setOpenActionMenuId(null)}
                              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Xem trang khách hàng</span>
                            </a>

                            {/* 2. Edit movie */}
                            <Link
                              to={`/admin/movies/${movie.id}/edit`}
                              onClick={() => setOpenActionMenuId(null)}
                              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-primary" />
                              <span>Chỉnh sửa phim</span>
                            </Link>

                            <div className="border-t border-border/50 my-1" />

                            {/* 3. Quick Status Toggles */}
                            <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                              Đổi trạng thái:
                            </div>

                            {movie.status !== 'now-showing' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(movie, 'now-showing')}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left"
                              >
                                <Film className="w-3.5 h-3.5" />
                                <span>Đang chiếu</span>
                              </button>
                            )}

                            {movie.status !== 'coming-soon' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(movie, 'coming-soon')}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer text-left"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Sắp chiếu</span>
                              </button>
                            )}

                            {movie.status !== 'ended' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(movie, 'ended')}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-500/10 transition-colors cursor-pointer text-left"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Ngừng chiếu</span>
                              </button>
                            )}

                            <div className="border-t border-border/50 my-1" />

                            {/* 4. Archive movie (with confirmation) */}
                            {movie.status !== 'archived' && (
                              <button
                                type="button"
                                onClick={() => handleOpenArchiveDialog(movie)}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer text-left font-semibold"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Lưu trữ phim</span>
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
        )}

        {/* 5. Pagination */}
        {data && (
          <div className="p-3 border-t border-border/50">
            <AdminPagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={(p) => updateUrlParams({ page: p })}
              onPageSizeChange={(ps) => updateUrlParams({ pageSize: ps, page: 1 })}
            />
          </div>
        )}
      </div>

      {/* 6. Confirm Dialog for Archive (Single / Bulk) */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.mode === 'single-archive'
            ? 'Xác nhận Lưu trữ phim'
            : `Xác nhận Lưu trữ ${selectedIds.length} phim đã chọn`
        }
        targetName={
          confirmDialog.mode === 'single-archive'
            ? confirmDialog.targetMovie?.title
            : undefined
        }
        description="Phim sẽ được chuyển sang trạng thái Lưu trữ (Archived) và tự động ẩn khỏi danh mục lịch chiếu khách hàng."
        consequenceWarning="Lưu trữ phim sẽ không làm mất dữ liệu lịch sử đặt vé hoặc báo cáo doanh thu liên quan của phim trên hệ thống CineBook."
        confirmText="Lưu trữ ngay"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={confirmDialog.isLoading}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, mode: 'single-archive', isLoading: false })
        }
      />
    </div>
  )
}
