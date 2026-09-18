import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Film, Sparkles, RefreshCw } from 'lucide-react'
import { BookingHistoryCard } from '@/components/booking/booking-history-card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { bookingApiService } from '@/services/booking-api.service'
import { movieApiService } from '@/services/movie-api.service'
import { theaterApiService } from '@/services/theater-api.service'
import type { BookingHistoryItem } from '@/types/booking'
import { cn } from '@/lib/utils'

export type BookingFilterCategory = 'all' | 'upcoming' | 'completed' | 'cancelled'

interface FilterTabOption {
  id: BookingFilterCategory
  label: string
}

const FILTER_TABS: FilterTabOption[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'upcoming', label: 'Sắp tới' },
  { id: 'completed', label: 'Đã xem' },
  { id: 'cancelled', label: 'Đã hủy / Hết hạn' },
]

export default function MyBookingsPage() {
  const [activeFilter, setActiveFilter] = useState<BookingFilterCategory>('all')
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = 'Vé của tôi | CineBook'
  }, [])

  // Tải danh sách vé từ Booking Service API
  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await bookingApiService.getMyBookings(0, 50)
      const rawList = res?.content || []

      // Bộ nhớ cache tạm thời để tránh gọi lặp lại movie/theater
      const movieCache = new Map<string, { title: string; posterUrl: string }>()
      const theaterCache = new Map<string, string>()

      const enrichedList: BookingHistoryItem[] = await Promise.all(
        rawList.map(async (item) => {
          let movieInfo = movieCache.get(item.movieId)
          if (!movieInfo && item.movieId) {
            try {
              const mv = await movieApiService.getMovieById(item.movieId)
              if (mv) {
                movieInfo = { title: mv.title, posterUrl: mv.posterUrl || '' }
                movieCache.set(item.movieId, movieInfo)
              }
            } catch {
              // fallback
            }
          }

          let theaterName = item.theaterId ? theaterCache.get(item.theaterId) : undefined
          if (!theaterName && item.theaterId) {
            try {
              const th = await theaterApiService.getPublicTheaterById(item.theaterId)
              if (th) {
                theaterName = th.name
                theaterCache.set(item.theaterId, theaterName)
              }
            } catch {
              // fallback
            }
          }

          return bookingApiService.mapBackendBookingToHistoryItem(item, {
            movieTitle: movieInfo?.title || 'Phim rạp CineBook',
            poster: movieInfo?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
            cinema: theaterName || 'Rạp CineBook Cinema',
            room: 'Phòng chiếu tiêu chuẩn',
            showtime: new Date(item.createdAt).toLocaleDateString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }),
          })
        })
      )

      setBookings(enrichedList)
    } catch (err) {
      console.error('Lỗi khi tải lịch sử vé:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchMyBookings()
  }, [fetchMyBookings])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchMyBookings()
  }

  // Phân loại danh sách vé vào các tab
  const categorized = useMemo(() => {
    const upcoming = bookings.filter(
      (b) => b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'PENDING_PAYMENT'
    )
    const completed = bookings.filter((b) => b.status === 'CONFIRMED')
    const cancelled = bookings.filter(
      (b) => b.status === 'CANCELLED' || b.status === 'EXPIRED' || b.status === 'PAYMENT_FAILED'
    )

    return {
      all: bookings,
      upcoming,
      completed,
      cancelled,
    }
  }, [bookings])

  // Đếm số lượng vé trong từng tab
  const counts = useMemo(() => {
    return {
      all: categorized.all.length,
      upcoming: categorized.upcoming.length,
      completed: categorized.completed.length,
      cancelled: categorized.cancelled.length,
    }
  }, [categorized])

  // Lọc danh sách theo filter đang chọn
  const filteredBookings = categorized[activeFilter] || bookings

  const handleFilterChange = (tabId: BookingFilterCategory) => {
    setActiveFilter(tabId)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* 1. Header Trang */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="border-border/60 hover:bg-secondary cursor-pointer"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isRefreshing && 'animate-spin')} />
            <span>Làm mới</span>
          </Button>

          <Button asChild variant="primary" size="sm">
            <Link to="/movies">
              <Film className="h-3.5 w-3.5 mr-1.5" />
              <span>Đặt vé mới</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Thanh lọc Filter: Tất cả | Sắp tới | Đã xem | Đã hủy / Hết hạn */}
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
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingHistoryCard
              key={booking.id || booking.bookingCode}
              bookingCode={booking.bookingCode}
              movieTitle={booking.movieTitle}
              poster={booking.poster}
              cinema={booking.cinema}
              room={booking.room}
              showtime={booking.showtime}
              seats={booking.seats}
              total={booking.total}
              status={booking.status}
              href={`/my-bookings/${booking.id || booking.bookingCode}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title="Không tìm thấy vé nào"
          description={`Bạn chưa có vé nào trong danh mục "${FILTER_TABS.find((t) => t.id === activeFilter)?.label}". Hãy chọn bộ phim yêu thích và đặt vé ngay hôm nay!`}
          action={{
            label: 'Khám phá phim đang chiếu',
            href: '/movies',
            icon: Sparkles,
          }}
        />
      )}
    </div>
  )
}
