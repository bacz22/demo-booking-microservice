import { useState } from 'react'
import {
  BarChart3,
  Table as TableIcon,
  Coins,
  Ticket,
} from 'lucide-react'
import type { RevenueTrendPoint } from '@/types/admin'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RevenueTrendChartProps {
  data: RevenueTrendPoint[]
  className?: string
}

export function RevenueTrendChart({ data, className }: RevenueTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'bookings'>('revenue')
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const activeIndex = hoveredIndex !== null ? hoveredIndex : focusedIndex

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  // Calculate maximum value for chart scaling
  const values = data.map((d) => d[activeMetric])
  const rawMax = Math.max(...values, 1)
  const chartMax = rawMax * 1.15

  // SVG dimensions
  const svgWidth = 700
  const svgHeight = 260
  const paddingX = 45
  const paddingTop = 25
  const paddingBottom = 40
  const plotWidth = svgWidth - paddingX * 2
  const plotHeight = svgHeight - paddingTop - paddingBottom

  const barCount = data.length
  const slotWidth = plotWidth / barCount
  const barWidth = Math.min(slotWidth * 0.55, 48)

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between',
        className
      )}
    >
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <h2 className="text-base sm:text-lg font-heading font-black tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Xu hướng Kinh doanh</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Biến động doanh thu và lượt vé thành công theo chu kỳ đã chọn
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Selector Tabs */}
          <div className="inline-flex rounded-xl bg-secondary/80 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveMetric('revenue')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                activeMetric === 'revenue'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Doanh thu</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('bookings')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                activeMetric === 'bookings'
                  ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Lượt vé</span>
            </button>
          </div>

          {/* View Mode Toggle: Chart vs Accessible Data Table */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode((prev) => (prev === 'chart' ? 'table' : 'chart'))}
            className="h-8 rounded-xl text-xs gap-1.5 cursor-pointer"
            aria-label={viewMode === 'chart' ? 'Chuyển sang chế độ bảng số liệu' : 'Chuyển sang chế độ biểu đồ'}
          >
            {viewMode === 'chart' ? (
              <>
                <TableIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Dạng bảng</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Dạng biểu đồ</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Chart Legend & Summary Strip */}
      <div className="flex items-center justify-between py-3 text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-3 h-3 rounded-sm',
                activeMetric === 'revenue' ? 'bg-primary' : 'bg-emerald-500'
              )}
            />
            <span className="font-medium text-foreground">
              {activeMetric === 'revenue' ? 'Doanh thu (VNĐ)' : 'Số lượt đặt vé'}
            </span>
          </div>

          <span className="text-muted-foreground/60 hidden sm:inline">•</span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Hỗ trợ điều hướng bằng phím Tab và xem giá trị
          </span>
        </div>

        {activeIndex !== null && data[activeIndex] && (
          <div className="inline-flex items-center gap-2 rounded-lg bg-secondary/80 px-2.5 py-1 text-xs font-bold text-foreground border border-border/60 animate-in fade-in duration-150">
            <span className="text-muted-foreground">{data[activeIndex].label}:</span>
            <span className="text-primary font-black">
              {formatVND(data[activeIndex].revenue)}
            </span>
            <span className="text-muted-foreground/60">|</span>
            <span className="text-emerald-500 font-black">
              {formatNumber(data[activeIndex].bookings)} vé
            </span>
          </div>
        )}
      </div>

      {/* Content Area: Chart vs Table */}
      {viewMode === 'chart' ? (
        <div className="relative w-full pt-2">
          <div className="w-full overflow-x-auto scrollbar-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 min-w-[500px] select-none"
              role="img"
              aria-label="Biểu đồ cột xu hướng doanh thu và lượt đặt vé"
            >
              <defs>
                {/* Primary Crimson Gradient */}
                <linearGradient id="crimsonBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E11D48" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#BE123C" stopOpacity="0.75" />
                </linearGradient>

                {/* Emerald Gradient for Bookings */}
                <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.75" />
                </linearGradient>

                {/* Subtle Grid Pattern */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Background Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingTop + plotHeight * (1 - ratio)
                const gridVal = chartMax * ratio
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-border/40"
                      strokeDasharray={ratio === 0 ? undefined : '4 4'}
                      strokeWidth={1}
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] fill-muted-foreground font-mono font-medium"
                    >
                      {activeMetric === 'revenue'
                        ? ratio === 0
                          ? '0'
                          : `${Math.round(gridVal / 1000000)}M`
                        : Math.round(gridVal)}
                    </text>
                  </g>
                )
              })}

              {/* Bars */}
              {data.map((point, index) => {
                const val = point[activeMetric]
                const barHeight = Math.max((val / chartMax) * plotHeight, 4)
                const x = paddingX + index * slotWidth + (slotWidth - barWidth) / 2
                const y = paddingTop + plotHeight - barHeight
                const isCurrentActive = activeIndex === index

                const accessibleLabel = `${point.label}: Doanh thu ${formatVND(point.revenue)}, ${formatNumber(point.bookings)} lượt vé`

                return (
                  <g
                    key={point.date}
                    className="cursor-pointer group outline-none"
                    tabIndex={0}
                    role="button"
                    aria-label={accessibleLabel}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                  >
                    {/* Background hover highlight column */}
                    <rect
                      x={paddingX + index * slotWidth}
                      y={paddingTop}
                      width={slotWidth}
                      height={plotHeight}
                      fill="currentColor"
                      className={cn(
                        'transition-opacity duration-150',
                        isCurrentActive ? 'text-primary/[0.07]' : 'opacity-0'
                      )}
                      rx={6}
                    />

                    {/* Bar graphic */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={6}
                      fill={activeMetric === 'revenue' ? 'url(#crimsonBarGrad)' : 'url(#emeraldBarGrad)'}
                      className={cn(
                        'transition-all duration-200',
                        isCurrentActive
                          ? 'filter drop-shadow(0 4px 8px rgba(225,29,72,0.4)) brightness-110'
                          : 'opacity-90 group-hover:opacity-100'
                      )}
                    />

                    {/* Value indicator on top when active */}
                    {isCurrentActive && (
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(y - 6, paddingTop + 10)}
                        textAnchor="middle"
                        className="text-[11px] font-black fill-foreground font-mono"
                      >
                        {activeMetric === 'revenue'
                          ? `${(point.revenue / 1000000).toFixed(1)}Tr`
                          : `${point.bookings} vé`}
                      </text>
                    )}

                    {/* X-axis date label */}
                    <text
                      x={x + barWidth / 2}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      className={cn(
                        'text-[11px] font-medium transition-colors',
                        isCurrentActive
                          ? 'fill-foreground font-bold'
                          : 'fill-muted-foreground'
                      )}
                    >
                      {point.date}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* Accessible Data Table Alternative */
        <div className="pt-2 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" aria-label="Bảng số liệu xu hướng kinh doanh">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/30">
                <th scope="col" className="py-2.5 px-3 font-bold text-foreground">Thời điểm</th>
                <th scope="col" className="py-2.5 px-3 font-bold text-foreground text-right">Doanh thu</th>
                <th scope="col" className="py-2.5 px-3 font-bold text-foreground text-right">Số lượt vé</th>
                <th scope="col" className="py-2.5 px-3 font-bold text-foreground text-right">TB / Lượt vé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {data.map((row) => {
                const avgTicketPrice = row.bookings > 0 ? Math.round(row.revenue / row.bookings) : 0
                return (
                  <tr key={row.date} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-2 px-3 font-sans font-medium text-foreground">{row.label}</td>
                    <td className="py-2 px-3 text-right font-bold text-primary">{formatVND(row.revenue)}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(row.bookings)}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{formatVND(avgTicketPrice)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RevenueTrendChart
