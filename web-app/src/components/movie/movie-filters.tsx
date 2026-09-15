import { RotateCcw, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_MOVIE_GENRES,
  STATUS_OPTIONS,
  SORT_OPTIONS,
} from '@/constants/filters'
import { cn } from '@/lib/utils'

export interface MovieFilterState {
  genre: string
  status: string // 'all' | 'now-showing' | 'coming-soon'
  sort: string // 'popular' | 'rating' | 'latest'
}

export interface MovieFiltersProps {
  values: MovieFilterState
  onChange: (filters: MovieFilterState) => void
  onReset?: () => void
  genres?: string[]
  className?: string
}

export function MovieFilters({
  values,
  onChange,
  onReset,
  genres = DEFAULT_MOVIE_GENRES,
  className,
}: MovieFiltersProps) {
  const isFiltered =
    (values.genre !== 'all' && values.genre !== 'Tất cả' && values.genre !== '') ||
    values.status !== 'all' ||
    values.sort !== 'popular'

  const handleStatusChange = (status: string) => {
    onChange({ ...values, status })
  }

  const handleGenreChange = (val: string) => {
    onChange({ ...values, genre: val })
  }

  const handleSortChange = (val: string) => {
    onChange({ ...values, sort: val })
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      onChange({
        genre: 'all',
        status: 'all',
        sort: 'popular',
      })
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-md md:p-5',
        className
      )}
    >
      {/* Hàng 1: Trạng thái phim (Pills Segmented) & Nút Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Nhóm chọn trạng thái: Tất cả / Đang chiếu / Sắp chiếu */}
        <div
          role="radiogroup"
          aria-label="Lọc theo trạng thái phim"
          className="flex items-center gap-1 rounded-xl bg-secondary/50 p-1 border border-border/50"
        >
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = values.status === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleStatusChange(opt.value)}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Nút Reset Filters */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Đặt lại bộ lọc</span>
          </Button>
        )}
      </div>

      {/* Hàng 2: Dropdowns đồng bộ Thể loại & Sắp xếp (Sort) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Bộ lọc Thể loại (Custom Synced Select) */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-genre"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Thể loại</span>
          </label>
          <Select value={values.genre} onValueChange={handleGenreChange}>
            <SelectTrigger id="filter-genre">
              <SelectValue placeholder="Chọn thể loại phim" />
            </SelectTrigger>
            <SelectContent>
              {genres.map((g) => {
                const val = g === 'Tất cả' ? 'all' : g
                return (
                  <SelectItem key={g} value={val}>
                    {g}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Bộ lọc Sắp xếp (Custom Synced Select) */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-sort"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sắp xếp theo</span>
          </label>
          <Select value={values.sort} onValueChange={handleSortChange}>
            <SelectTrigger id="filter-sort">
              <SelectValue placeholder="Sắp xếp danh sách" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default MovieFilters
