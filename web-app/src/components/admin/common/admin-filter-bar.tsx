import { Search, X, RotateCcw, ArrowUpDown, Filter } from 'lucide-react'
import type { MovieFilterState } from '@/types/admin-movie'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdminFilterBarProps {
  filters: MovieFilterState
  genresList: string[]
  onSearchChange: (val: string) => void
  onStatusChange: (val: string) => void
  onGenreChange: (val: string) => void
  onAgeRatingChange: (val: string) => void
  onSortChange: (sortBy: 'releaseDate' | 'updatedAt' | 'title', sortOrder: 'asc' | 'desc') => void
  onReset: () => void
}

export function AdminFilterBar({
  filters,
  genresList,
  onSearchChange,
  onStatusChange,
  onGenreChange,
  onAgeRatingChange,
  onSortChange,
  onReset,
}: AdminFilterBarProps) {
  // Count active filters (ignoring default sort & page)
  let activeFilterCount = 0
  if (filters.search) activeFilterCount++
  if (filters.status !== 'all') activeFilterCount++
  if (filters.genre !== 'all') activeFilterCount++
  if (filters.ageRating !== 'all') activeFilterCount++

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Search and Primary Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Bar */}
        <div className="lg:col-span-4 relative">
          <Input
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên phim hoặc tên gốc..."
            leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
            rightIcon={
              filters.search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
            className="h-10 text-xs rounded-xl bg-secondary/40 border-border/70 focus-visible:bg-background"
          />
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-3">
          <Select value={filters.status} onValueChange={onStatusChange}>
            <SelectTrigger
              className="h-10 text-xs rounded-xl bg-secondary/40 border-border/70"
              aria-label="Lọc theo trạng thái phim"
            >
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="now-showing">Đang chiếu (Now Showing)</SelectItem>
              <SelectItem value="coming-soon">Sắp chiếu (Coming Soon)</SelectItem>
              <SelectItem value="ended">Ngừng chiếu (Ended)</SelectItem>
              <SelectItem value="archived">Đã lưu trữ (Archived)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Genre Filter */}
        <div className="lg:col-span-3">
          <Select value={filters.genre} onValueChange={onGenreChange}>
            <SelectTrigger
              className="h-10 text-xs rounded-xl bg-secondary/40 border-border/70"
              aria-label="Lọc theo thể loại phim"
            >
              <SelectValue placeholder="Tất cả thể loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thể loại</SelectItem>
              {genresList.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Age Rating Filter */}
        <div className="lg:col-span-2">
          <Select value={filters.ageRating} onValueChange={onAgeRatingChange}>
            <SelectTrigger
              className="h-10 text-xs rounded-xl bg-secondary/40 border-border/70"
              aria-label="Lọc theo phân loại độ tuổi"
            >
              <SelectValue placeholder="Mọi độ tuổi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi độ tuổi</SelectItem>
              <SelectItem value="P">P — Mọi lứa tuổi</SelectItem>
              <SelectItem value="K">K — Dưới 13 tuổi có kèm</SelectItem>
              <SelectItem value="T13">T13 — Từ 13 tuổi trở lên</SelectItem>
              <SelectItem value="T16">T16 — Từ 16 tuổi trở lên</SelectItem>
              <SelectItem value="T18">T18 — Từ 18 tuổi trở lên</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sorting & Filter Summary Strip */}
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
              const [sortBy, sortOrder] = val.split('-') as [
                'releaseDate' | 'updatedAt' | 'title',
                'asc' | 'desc',
              ]
              onSortChange(sortBy, sortOrder)
            }}
          >
            <SelectTrigger
              className="h-8 text-xs rounded-lg border-border/60 bg-secondary/50 min-w-[210px]"
              aria-label="Sắp xếp danh sách phim"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="releaseDate-desc">Ngày phát hành: Mới nhất</SelectItem>
              <SelectItem value="releaseDate-asc">Ngày phát hành: Cũ nhất</SelectItem>
              <SelectItem value="updatedAt-desc">Ngày cập nhật: Gần nhất</SelectItem>
              <SelectItem value="updatedAt-asc">Ngày cập nhật: Cũ nhất</SelectItem>
              <SelectItem value="title-asc">Tên phim: A đến Z</SelectItem>
              <SelectItem value="title-desc">Tên phim: Z đến A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters & Reset Button */}
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 ? (
            <>
              <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30 text-[11px] font-bold">
                <Filter className="w-3 h-3" />
                <span>{activeFilterCount} bộ lọc đang áp dụng</span>
              </Badge>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1 px-2.5 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </Button>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Đang hiển thị toàn bộ danh mục
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminFilterBar
