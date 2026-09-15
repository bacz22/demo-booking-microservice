import { Crown } from 'lucide-react'
import { CopyButton } from '@/components/ui/copy-button'
import { formatPrice } from '@/lib/utils'
import type { MembershipInfo } from '@/mocks/user'
import { cn } from '@/lib/utils'

export interface MembershipCardProps {
  membership: MembershipInfo
  userName: string
  className?: string
  onViewPerks?: () => void
}

export function MembershipCard({
  membership,
  userName,
  className,
  onViewPerks,
}: MembershipCardProps) {
  const percent = Math.min(
    100,
    Math.round((membership.totalSpentThisYear / membership.spendingGoal) * 100)
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-neutral-950 via-zinc-900 to-amber-950/40 p-6 sm:p-7 text-white shadow-2xl transition-all duration-300 hover:border-amber-400/60 hover:shadow-amber-500/10',
        className
      )}
    >
      {/* Hiệu ứng ánh sáng Metallic Shimmer & Hologram nền */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-rose-500/15 via-transparent to-transparent blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_60%)]" />

      {/* NỘI DUNG THẺ */}
      <div className="relative z-10 space-y-6">
        {/* Header thẻ: Logo CineBook & Huy hiệu Hạng thẻ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
              CB
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-zinc-200">
                Cine<span className="text-amber-400">Book</span> Pass
              </span>
              <span className="text-[10px] block text-zinc-400 tracking-widest font-mono">
                MEMBERSHIP CLUB
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewPerks}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-black tracking-wider text-amber-300 backdrop-blur-md shadow-sm hover:bg-amber-400/25 transition-colors cursor-pointer"
            title="Xem đặc quyền hội viên"
          >
            <Crown className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>{membership.tierName}</span>
          </button>
        </div>

        {/* Giữa thẻ: Chip điện tử & Mã số thẻ hội viên */}
        <div className="space-y-2 pt-2">
          {/* Chip EMV giả lập */}
          <div className="flex items-center justify-between">
            <div className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 shadow-inner border border-amber-300/40 opacity-90" />
            <span className="font-mono text-[11px] text-zinc-400 tracking-widest uppercase">
              VIP Contactless
            </span>
          </div>

          {/* Số thẻ hội viên nổi bật */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-amber-100/95 drop-shadow-sm">
                {membership.cardNumber}
              </span>
              <CopyButton
                text={membership.cardNumber}
                title="Sao chép số thẻ hội viên"
                className="text-zinc-400 hover:text-white"
              />
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                Điểm tích lũy
              </span>
              <span className="font-extrabold text-lg sm:text-xl text-amber-400">
                {membership.points.toLocaleString('vi-VN')}{' '}
                <span className="text-xs font-normal text-zinc-300">điểm</span>
              </span>
            </div>
          </div>
        </div>

        {/* Cuối thẻ: Tên chủ thẻ & Thanh tiến trình thăng hạng */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">
                Chủ thẻ
              </span>
              <p className="font-bold text-sm tracking-wide text-zinc-100 uppercase">
                {userName}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Hạn xét hạng:</span>
              <span className="text-xs font-semibold text-zinc-300">{membership.validUntil}</span>
            </div>
          </div>

          {/* Thanh tiến trình duy trì / lên hạng */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Chi tiêu năm 2026: <strong className="text-zinc-200">{formatPrice(membership.totalSpentThisYear)}</strong></span>
              <span>Mục tiêu: <strong className="text-amber-400">{formatPrice(membership.spendingGoal)}</strong> ({percent}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/10 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MembershipCard
