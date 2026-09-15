import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Film, Sparkles } from 'lucide-react'
import { BookingHistoryCard } from '@/components/booking/booking-history-card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { MOCK_BOOKINGS, type BookingFilterCategory } from '@/mocks/bookings'
import { cn } from '@/lib/utils'

interface FilterTabOption {
  id: BookingFilterCategory
  label: string
}

const FILTER_TABS: FilterTabOption[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'upcoming', label: 'Sắp tới' },
  { id: 'completed', label: 'Đã xem' },
  { id: 'cancelled', label: 'Đã hủy' },
]

export default function MyBookingsPage() {
  const [activeFilter, setActiveFilter] = useState<BookingFilterCategory>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = 'Vé của tôi | CineBook'
  }, [])

  // Đếm số lượng vé trong từng tab
  const counts = useMemo(() => {
    return {
      all: MOCK_BOOKINGS.length,
      upcoming: MOCK_BOOKINGS.filter((b) => b.category === 'upcoming').length,
      completed: MOCK_BOOKINGS.filter((b) => b.category === 'completed').length,
      cancelled: MOCK_BOOKINGS.filter((b) => b.category === 'cancelled').length,
    }
  }, [])

  // Lọc danh sách theo filter đang chọn
  const filteredBookings = useMemo(() => {
    if (activeFilter === 'all') {
      return MOCK_BOOKINGS
    }
    return MOCK_BOOKINGS.filter((b) => b.category === activeFilter)
  }, [activeFilter])

  // Giả lập hiệu ứng loading khi chuyển tab filter
  const handleFilterChange = (tabId: BookingFilterCategory) => {
    if (tabId === activeFilter) return
    setIsLoading(true)
    setActiveFilter(tabId)
    setTimeout(() => {
      setIsLoading(false)
    }, 200)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* 1. Header Trang */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Vé của tôi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quản lý danh sách các vé xem phim đã đặt và lịch sử giao dịch tại CineBook.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="self-start sm:self-auto border-border/60">
          <Link to="/movies">
            <Film className="h-3.5 w-3.5 mr-1.5" />
            <span>Khám phá phim mới</span>
          </Link>
        </Button>
      </div>

      {/* 2. Thanh lọc Filter: Tất cả | Sắp tới | Đã xem | Đã hủy */}
      <div
        role="tablist"
        aria-label="Lọc lịch sử đặt vé"
        className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/50 bg-card/60 p-1.5 backdrop-blur-md scrollbar-none"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id
          const count = counts[tab.id]

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleFilterChange(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 outline-hidden whitespace-nowrap cursor-pointer',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold transition-colors',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 3. Danh sách vé đặt / Loading State / Empty State */}
      {isLoading ? (
        // Hiệu ứng Loading Shimmer Skeletons
        <div className="space-y-4" aria-busy="true" aria-label="Đang tải danh sách vé">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-2xl border border-border/40 bg-card/50 p-4 sm:p-5 animate-pulse"
            >
              <div className="h-40 w-28 sm:h-36 sm:w-24 rounded-xl bg-muted/40 shrink-0 mx-auto sm:mx-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="flex justify-between">
                  <div className="h-4 w-28 rounded bg-muted/40" />
                  <div className="h-5 w-20 rounded-full bg-muted/40" />
                </div>
                <div className="h-6 w-3/4 rounded bg-muted/40" />
                <div className="space-y-2 pt-2">
                  <div className="h-3.5 w-1/2 rounded bg-muted/30" />
                  <div className="h-3.5 w-1/3 rounded bg-muted/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        // Danh sách các thẻ vé (Reuse BookingHistoryCard)
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingHistoryCard
              key={booking.bookingCode}
              bookingCode={booking.bookingCode}
              movieTitle={booking.movieTitle}
              poster={booking.poster}
              cinema={booking.cinema}
              room={booking.room}
              showtime={booking.showtime}
              seats={booking.seats}
              total={booking.total}
              status={booking.status}
            />
          ))}
        </div>
      ) : (
        // Trạng thái rỗng (Empty State)
        <EmptyState
          icon={Ticket}
          title="Không tìm thấy vé nào"
          description={`Bạn chưa có vé nào trong danh mục "${FILTER_TABS.find((t) => t.id === activeFilter)?.label}". Hãy chọn bộ phim yêu thích và đặt vé ngay hôm nay!`}
          action={{
            label: 'Đặt vé xem phim ngay',
            href: '/movies',
            icon: Sparkles,
          }}
        />
      )}
    </div>
  )
}
