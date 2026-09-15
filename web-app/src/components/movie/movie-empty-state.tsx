import React from 'react'
import { Clapperboard, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface MovieEmptyStateProps {
  /** Icon Lucide hiển thị (mặc định Clapperboard) */
  icon?: LucideIcon
  /** Tiêu đề thông báo trạng thái rỗng */
  title?: string
  /** Mô tả chi tiết */
  description?: React.ReactNode
  /** Từ khóa tìm kiếm (dùng để hiển thị mô tả động nếu không truyền description) */
  searchQuery?: string
  /** Nhãn nút đặt lại bộ lọc */
  resetLabel?: string
  /** Callback xử lý đặt lại bộ lọc (Optional - chỉ hiển thị nút khi có hàm này) */
  onReset?: () => void
  className?: string
}

export function MovieEmptyState({
  icon: Icon = Clapperboard,
  title = 'Không tìm thấy phim phù hợp',
  description,
  searchQuery,
  resetLabel = 'Đặt lại bộ lọc',
  onReset,
  className,
}: MovieEmptyStateProps) {
  // Nội dung mô tả mặc định (Tuyệt đối không dùng emoji theo đặc tả Task 40)
  const renderDescription = () => {
    if (description) {
      return description
    }

    if (searchQuery && searchQuery.trim()) {
      return (
        <span>
          Không tìm thấy bộ phim nào khớp với từ khóa &ldquo;
          <span className="font-semibold text-foreground">{searchQuery}</span>
          &rdquo;. Vui lòng kiểm tra lại chính tả hoặc thử lại với từ khóa khác.
        </span>
      )
    }

    return 'Không có bộ phim nào phù hợp với bộ lọc hiện tại. Vui lòng thay đổi thể loại, trạng thái hoặc làm mới danh sách.'
  }

  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-14 sm:py-16 text-center backdrop-blur-xs transition-all',
        className
      )}
    >
      {/* 1. Lucide Icon Container (Không sử dụng emoji) */}
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-secondary/80 text-muted-foreground shadow-xs"
        aria-hidden="true"
      >
        <Icon className="h-8 w-8 stroke-[1.75]" />
      </div>

      {/* 2. Tiêu đề (Title) */}
      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
        {title}
      </h3>

      {/* 3. Mô tả (Description) */}
      <p className="mt-2 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {renderDescription()}
      </p>

      {/* 4. Nút đặt lại bộ lọc (Reset Filter Button - Optional) */}
      {onReset && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onReset}
          className="mt-6 gap-2 border border-border/60 hover:bg-secondary/90 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span>{resetLabel}</span>
        </Button>
      )}
    </div>
  )
}

export default MovieEmptyState
