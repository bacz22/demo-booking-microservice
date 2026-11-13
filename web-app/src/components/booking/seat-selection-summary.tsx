import { BookingSummary, type BookingSummaryProps } from '@/components/booking/booking-summary'

export interface SeatSelectionSummaryProps extends Partial<BookingSummaryProps> {
  movie?: { title: string; posterUrl: string }
  movieTitle?: string
  posterUrl?: string
  cinemaName: string
  roomName?: string
  date: string
  showtime: string
  selectedSeats?: string[]
  seats?: string[]
  prices?: { standard?: number; vip?: number; couple?: number }
  ticketPrice?: number
  total?: number
  onContinue?: () => void
  continueDisabled?: boolean
  className?: string
}

export function SeatSelectionSummary({
  movie,
  movieTitle = movie?.title || '',
  posterUrl = movie?.posterUrl || '',
  cinemaName,
  roomName = 'Phòng chiếu 03',
  date,
  showtime,
  selectedSeats,
  seats = selectedSeats || [],
  prices,
  ticketPrice = prices?.standard || 75000,
  priceLines,
  total = 0,
  onContinue,
  continueDisabled,
  className,
}: SeatSelectionSummaryProps) {
  return (
    <BookingSummary
      movieTitle={movieTitle}
      posterUrl={posterUrl}
      cinemaName={cinemaName}
      roomName={roomName}
      date={date}
      showtime={showtime}
      seats={seats}
      ticketPrice={ticketPrice}
      priceLines={priceLines}
      total={total}
      onContinue={onContinue}
      continueDisabled={continueDisabled}
      continueText="Tiếp tục"
      className={className}
    />
  )
}

export default SeatSelectionSummary
