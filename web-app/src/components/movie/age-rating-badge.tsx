import { cn } from '@/lib/utils'

export interface AgeRatingBadgeProps {
  /** Mã phân loại độ tuổi: P, K, T13, T16, T18, C13, C16, C18 */
  ageRating?: string
  /** Kích thước huy hiệu */
  size?: 'sm' | 'default' | 'lg'
  className?: string
  /** Có hiển thị tooltip giải thích không */
  showTooltip?: boolean
}

const AGE_RATING_CONFIG: Record<
  string,
  { label: string; description: string; className: string }
> = {
  T18: {
    label: 'T18',
    description: 'Phim dành cho khán giả từ 18 tuổi trở lên',
    className: 'bg-destructive text-destructive-foreground border-destructive/40 shadow-destructive/20',
  },
  C18: {
    label: 'C18',
    description: 'Phim cấm phổ biến đến khán giả dưới 18 tuổi',
    className: 'bg-destructive text-destructive-foreground border-destructive/40 shadow-destructive/20',
  },
  T16: {
    label: 'T16',
    description: 'Phim dành cho khán giả từ 16 tuổi trở lên',
    className: 'bg-warning text-slate-950 border-warning/50 shadow-warning/20',
  },
  C16: {
    label: 'C16',
    description: 'Phim cấm phổ biến đến khán giả dưới 16 tuổi',
    className: 'bg-warning text-slate-950 border-warning/50 shadow-warning/20',
  },
  T13: {
    label: 'T13',
    description: 'Phim dành cho khán giả từ 13 tuổi trở lên',
    className: 'bg-amber-500 text-slate-950 border-amber-400/50 shadow-amber-500/20',
  },
  C13: {
    label: 'C13',
    description: 'Phim cấm phổ biến đến khán giả dưới 13 tuổi',
    className: 'bg-amber-500 text-slate-950 border-amber-400/50 shadow-amber-500/20',
  },
  P: {
    label: 'P',
    description: 'Phim được phép phổ biến rộng rãi cho mọi đối tượng khán giả',
    className: 'bg-emerald-600 text-white border-emerald-500/40 shadow-emerald-500/20',
  },
  K: {
    label: 'K',
    description: 'Phim được phép phổ biến cho khán giả dưới 13 tuổi có người bảo hộ đi kèm',
    className: 'bg-emerald-600 text-white border-emerald-500/40 shadow-emerald-500/20',
  },
}

const DEFAULT_CONFIG = {
  label: '',
  description: 'Phân loại độ tuổi',
  className: 'bg-secondary/90 text-foreground border-border/50',
}

export function AgeRatingBadge({
  ageRating,
  size = 'default',
  className,
  showTooltip = true,
}: AgeRatingBadgeProps) {
  if (!ageRating) return null

  const key = ageRating.toUpperCase().trim()
  const config = AGE_RATING_CONFIG[key] || {
    ...DEFAULT_CONFIG,
    label: ageRating,
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] min-w-[28px]',
    default: 'px-2 py-0.5 text-xs min-w-[34px]',
    lg: 'px-2.5 py-1 text-xs font-black min-w-[40px]',
  }[size]

  return (
    <span
      title={showTooltip ? config.description : undefined}
      aria-label={config.description}
      className={cn(
        'inline-flex items-center justify-center rounded-md border font-bold uppercase tracking-wider text-center select-none shadow-md backdrop-blur-md transition-transform',
        sizeClasses,
        config.className,
        className
      )}
    >
      {config.label || ageRating}
    </span>
  )
}

export default AgeRatingBadge
