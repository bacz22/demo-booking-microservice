import { cn } from '@/lib/utils'

export interface CinemaScreenProps {
  /** Nhãn chữ trên màn hình (mặc định là "MÀN HÌNH") */
  label?: string
  className?: string
}

export function CinemaScreen({
  label = 'MÀN HÌNH',
  className,
}: CinemaScreenProps) {
  return (
    <div
      role="presentation"
      aria-label="Màn hình rạp chiếu phim"
      className={cn(
        'relative mx-auto flex w-full max-w-2xl flex-col items-center justify-center select-none py-2',
        className
      )}
    >
      {/* 1. Đường cong màn hình rạp chiếu dạng Vector SVG */}
      <svg
        viewBox="0 0 600 36"
        className="w-full max-w-md sm:max-w-lg md:max-w-xl overflow-visible text-border"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cinema-screen-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.05" />
            <stop offset="15%" stopColor="var(--primary)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="85%" stopColor="var(--primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Đường cong màn hình chính */}
        <path
          d="M 15 30 Q 300 6 585 30"
          fill="none"
          stroke="url(#cinema-screen-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {/* 2. Hiệu ứng chùm sáng phản chiếu từ máy chiếu (Subtle projector light beam) */}
      <div
        className="pointer-events-none mx-auto h-7 sm:h-10 w-full max-w-sm sm:max-w-md md:max-w-lg bg-gradient-to-b from-primary/15 via-primary/5 to-transparent"
        style={{
          clipPath: 'polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)',
        }}
        aria-hidden="true"
      />

      {/* 3. Nhãn chữ "MÀN HÌNH" đơn giản, cinematic */}
      <div className="-mt-1.5 flex items-center justify-center">
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.35em] text-muted-foreground/80 transition-colors">
          {label}
        </span>
      </div>
    </div>
  )
}

export default CinemaScreen
