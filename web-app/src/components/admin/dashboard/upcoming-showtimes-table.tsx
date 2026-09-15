import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  ArrowUpDown,
  ExternalLink,
  Users,
} from 'lucide-react'
import type { UpcomingShowtimeItem } from '@/types/admin'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UpcomingShowtimesTableProps {
  data: UpcomingShowtimeItem[]
  className?: string
}

type SortField = 'startTime' | 'movieTitle' | 'occupancyRate'
type SortOrder = 'asc' | 'desc'

export function UpcomingShowtimesTable({ data, className }: UpcomingShowtimesTableProps) {
  const [sortField, setSortField] = useState<SortField>('startTime')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0
    if (sortField === 'startTime') {
      comparison = a.startTime.localeCompare(b.startTime)
    } else if (sortField === 'movieTitle') {
      comparison = a.movieTitle.localeCompare(b.movieTitle)
    } else if (sortField === 'occupancyRate') {
      comparison = a.occupancyRate - b.occupancyRate
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
        <div>
          <h2 className="text-base sm:text-lg font-heading font-black tracking-tight text-foreground flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            <span>Suất Chiếu Sắp Bắt Đầu</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lịch các suất chiếu diễn ra trong 2 giờ tới và tình trạng lấp đầy phòng chiếu
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 rounded-xl text-xs gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Link to="/admin/showtimes">
            <span>Xem tất cả lịch chiếu</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>
        </Button>
      </div>

      {/* Semantic HTML Table */}
      <div className="mt-4 overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse min-w-[640px]">
          <caption className="sr-only">Danh sách suất chiếu sắp bắt đầu hôm nay</caption>
          <thead>
            <tr className="border-b border-border/60 bg-secondary/40 text-muted-foreground font-semibold">
              <th
                scope="col"
                className="py-3 px-3.5"
                aria-sort={sortField === 'startTime' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button
                  type="button"
                  onClick={() => handleSort('startTime')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer font-bold"
                >
                  <span>Giờ chiếu</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </button>
              </th>

              <th
                scope="col"
                className="py-3 px-3.5"
                aria-sort={sortField === 'movieTitle' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button
                  type="button"
                  onClick={() => handleSort('movieTitle')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer font-bold"
                >
                  <span>Phim &amp; Định dạng</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </button>
              </th>

              <th scope="col" className="py-3 px-3.5 font-bold">
                Cụm rạp &amp; Phòng
              </th>

              <th
                scope="col"
                className="py-3 px-3.5"
                aria-sort={sortField === 'occupancyRate' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button
                  type="button"
                  onClick={() => handleSort('occupancyRate')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer font-bold"
                >
                  <span>Tỷ lệ lấp đầy</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </button>
              </th>

              <th scope="col" className="py-3 px-3.5 font-bold text-center">
                Trạng thái
              </th>

              <th scope="col" className="py-3 px-3.5 font-bold text-right">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40">
            {sortedData.map((st) => (
              <tr key={st.id} className="hover:bg-secondary/30 transition-colors">
                {/* Time & Date */}
                <td className="py-3.5 px-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      {st.startTime}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{st.dateLabel}</span>
                  </div>
                </td>

                {/* Movie Title & Format */}
                <td className="py-3.5 px-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground hover:text-primary transition-colors">
                      {st.movieTitle}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold bg-secondary/80">
                      {st.format}
                    </Badge>
                  </div>
                </td>

                {/* Cinema & Auditorium */}
                <td className="py-3.5 px-3.5">
                  <div className="text-xs">
                    <p className="font-medium text-foreground">{st.cinemaName}</p>
                    <p className="text-[11px] text-muted-foreground">{st.auditoriumName}</p>
                  </div>
                </td>

                {/* Occupancy Rate & Seats */}
                <td className="py-3.5 px-3.5 min-w-[150px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-foreground">
                        {st.soldSeats}/{st.totalSeats} ghế
                      </span>
                      <span
                        className={cn(
                          'font-bold font-mono',
                          st.occupancyRate >= 90
                            ? 'text-rose-500'
                            : st.occupancyRate >= 75
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        )}
                      >
                        {st.occupancyRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          st.occupancyRate >= 90
                            ? 'bg-rose-500'
                            : st.occupancyRate >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        )}
                        style={{ width: `${st.occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                  <AdminStatusBadge status={st.status} size="sm" />
                </td>

                {/* Action */}
                <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Link to={`/admin/showtimes`} title="Xem chi tiết sơ đồ ghế suất chiếu">
                      <Users className="w-3.5 h-3.5 mr-1" />
                      <span>Ghế</span>
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UpcomingShowtimesTable
