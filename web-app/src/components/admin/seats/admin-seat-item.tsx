import React from 'react'
import { Crown, Heart, Accessibility, Ban, Check } from 'lucide-react'
import type { AdminSeatItem } from '@/types/admin-seat'
import { cn } from '@/lib/utils'

interface AdminSeatItemProps {
  seat: AdminSeatItem
  isSelected: boolean
  onToggleSelect: (seatId: string) => void
}

export function AdminSeatItemComponent({
  seat,
  isSelected,
  onToggleSelect,
}: AdminSeatItemProps) {
  const isCouple = seat.type === 'couple'
  const isDisabled = seat.status === 'disabled'

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleSelect(seat.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleSelect(seat.id)
    }
  }

  const ariaLabel = `Ghế ${seat.seatNumber}, loại ${seat.type}, trạng thái ${
    seat.status === 'disabled' ? 'Đã khóa/hỏng' : 'Khả dụng'
  }, ${isSelected ? 'đang được chọn' : 'chưa chọn'}`

  return (
    <div className={cn('flex items-center', seat.isAisleAfter && 'mr-6 sm:mr-8')}>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-pressed={isSelected}
        title={ariaLabel}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-t-lg rounded-b-xs transition-all duration-150 outline-none select-none cursor-pointer',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          // Dimensions
          isCouple ? 'h-9 w-18 sm:h-10 sm:w-20' : 'h-9 w-9 sm:h-10 sm:w-10',
          // 1. Selected State (Highest priority highlight)
          isSelected && [
            'bg-primary text-primary-foreground border-2 border-primary shadow-md shadow-primary/40 scale-105 z-10 font-bold',
          ],
          // 2. Disabled State (When not selected)
          !isSelected &&
            isDisabled && [
              'bg-secondary/30 border border-dashed border-border/70 text-muted-foreground/40 opacity-50 hover:border-border',
            ],
          // 3. Normal Available State (by Type)
          !isSelected &&
            !isDisabled && [
              seat.type === 'standard' &&
                'bg-slate-700/80 hover:bg-slate-600/90 border border-slate-500/50 text-slate-200 shadow-2xs hover:scale-105',
              seat.type === 'vip' &&
                'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/60 text-amber-500 shadow-2xs shadow-amber-500/20 hover:scale-105',
              seat.type === 'couple' &&
                'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/60 text-rose-500 shadow-2xs shadow-rose-500/20 hover:scale-105',
              seat.type === 'accessibility' &&
                'bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/60 text-sky-500 shadow-2xs shadow-sky-500/20 hover:scale-105',
            ]
        )}
      >
        {/* Top Mini Icon Indicator */}
        <div className="flex items-center justify-center h-3">
          {isSelected ? (
            <Check className="w-3 h-3 text-primary-foreground stroke-3" />
          ) : isDisabled ? (
            <Ban className="w-2.5 h-2.5 text-muted-foreground/60" />
          ) : seat.type === 'vip' ? (
            <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500/30" />
          ) : seat.type === 'couple' ? (
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500/30" />
          ) : seat.type === 'accessibility' ? (
            <Accessibility className="w-2.5 h-2.5 text-sky-500" />
          ) : null}
        </div>

        {/* Seat Number Label */}
        <span
          className={cn(
            'font-mono text-[10px] leading-tight font-bold tracking-tighter truncate max-w-full px-0.5',
            isSelected
              ? 'text-primary-foreground'
              : isDisabled
                ? 'line-through text-muted-foreground/50'
                : 'text-foreground'
          )}
        >
          {seat.seatNumber}
        </span>
      </button>
    </div>
  )
}
