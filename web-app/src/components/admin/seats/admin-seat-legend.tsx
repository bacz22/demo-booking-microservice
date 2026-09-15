import { Crown, Heart, Accessibility, Ban, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSeatLegendProps {
  className?: string
}

export function AdminSeatLegend({ className }: AdminSeatLegendProps) {
  const items = [
    {
      label: 'Ghế Thường (Standard)',
      icon: null,
      shapeClass: 'bg-slate-700 border border-slate-500/60 text-slate-200',
      desc: '1 chỗ ngồi chuẩn',
    },
    {
      label: 'Ghế VIP',
      icon: Crown,
      shapeClass:
        'bg-amber-500/20 border border-amber-500 text-amber-500 shadow-xs shadow-amber-500/20',
      desc: 'Khu vực góc nhìn đẹp nhất',
    },
    {
      label: 'Ghế Đôi (Couple)',
      icon: Heart,
      shapeClass:
        'bg-rose-500/20 border border-rose-500 text-rose-500 w-12 sm:w-14 shadow-xs shadow-rose-500/20',
      desc: 'Băng ghế đôi 2 chỗ ngồi',
    },
    {
      label: 'Ghế Ưu Tiên (Accessibility)',
      icon: Accessibility,
      shapeClass:
        'bg-sky-500/20 border border-sky-500 text-sky-500 shadow-xs shadow-sky-500/20',
      desc: 'Dành cho người khuyết tật',
    },
    {
      label: 'Ghế Đang Chọn',
      icon: Check,
      shapeClass:
        'bg-primary text-primary-foreground border-2 border-primary shadow-sm shadow-primary/40',
      desc: 'Được đánh dấu để chỉnh sửa',
    },
    {
      label: 'Khóa / Hỏng (Disabled)',
      icon: Ban,
      shapeClass:
        'bg-secondary/40 border border-dashed border-border/60 text-muted-foreground/50 opacity-60',
      desc: 'Không mở bán vé',
    },
  ]

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-2.5',
        className
      )}
      aria-label="Chú thích phân loại ghế rạp chiếu"
    >
      <div className="flex items-center justify-between text-xs pb-1 border-b border-border/40">
        <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
          Chú thích phân loại ghế &amp; trạng thái
        </span>
        <span className="text-[11px] text-muted-foreground">
          Click trực tiếp vào ghế để chọn và chuyển đổi
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1 text-xs">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className={cn(
                  'h-7 w-7 rounded-t-md rounded-b-xs flex items-center justify-center shrink-0 text-[10px]',
                  item.shapeClass
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="font-semibold text-foreground text-xs line-clamp-1">
                  {item.label}
                </span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">
                  {item.desc}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
