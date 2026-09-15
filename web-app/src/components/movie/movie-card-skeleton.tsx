import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface MovieCardSkeletonProps {
  className?: string
}

export function MovieCardSkeleton({ className }: MovieCardSkeletonProps) {
  return (
    <article
      aria-busy="true"
      aria-label="Đang tải thông tin phim..."
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl select-none',
        className
      )}
    >
      {/* 1. Poster Skeleton (Tỉ lệ chuẩn 2:3, bo góc rounded-xl, khớp 100% MovieCard để chống layout shift) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-border/40 bg-card">
        <Skeleton className="h-full w-full rounded-none" />

        {/* Placeholder Badge độ tuổi (Góc trên bên trái) */}
        <div className="absolute top-2.5 left-2.5">
          <Skeleton className="h-5 w-8 rounded-md bg-muted/90" />
        </div>

        {/* 2. Rating Badge Skeleton (Góc dưới bên trái của Poster) */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-md border border-border/40 bg-background/80 px-2 py-1 shadow-xs">
          {/* Star icon placeholder */}
          <Skeleton className="h-3.5 w-3.5 rounded-full bg-amber-400/40" />
          {/* Rating number placeholder */}
          <Skeleton className="h-3 w-6 rounded bg-muted/90" />
        </div>
      </div>

      {/* 3. Phần thông tin chữ bên dưới Poster (pt-3 pb-1, min-h khớp chính xác MovieCard) */}
      <div className="pt-3 pb-1">
        {/* Title Skeleton: Đảm bảo min-h-[2.5rem] tương đương 2 dòng chữ tiêu đề, chống rung giật giao diện */}
        <div className="min-h-[2.5rem] flex flex-col justify-center space-y-1.5">
          <Skeleton className="h-4 md:h-4.5 w-5/6 rounded" />
          <Skeleton className="h-4 md:h-4.5 w-1/2 rounded" />
        </div>

        {/* 4. Metadata Skeleton: Thời lượng (duration) & Thể loại (genres) */}
        <div className="mt-1.5 flex items-center gap-2">
          {/* Thời lượng placeholder */}
          <Skeleton className="h-3.5 w-14 rounded" />

          {/* Dấu chấm phân cách */}
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />

          {/* Thể loại phim placeholder */}
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>
      </div>
    </article>
  )
}

export default MovieCardSkeleton
