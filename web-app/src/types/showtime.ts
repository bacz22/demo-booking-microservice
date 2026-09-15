export interface ShowtimeDateItem {
  date: string // YYYY-MM-DD
  dayOfWeek: string // e.g. "Hôm nay", "Thứ Hai", "CN"
  dayNumber: string | number // e.g. "14", "15"
  month: string // e.g. "Thg 09"
  disabled?: boolean
}

export interface ShowtimeItem {
  id: string
  movieId?: string
  cinemaId?: string
  roomId?: string
  startTime: string // "10:30"
  endTime?: string // "12:30"
  format?: string // "2D" | "3D" | "IMAX" | string
  language?: string // "Phụ đề" | "Lồng tiếng" | string
  remainingSeats?: number
  totalSeats?: number
  price?: number
  soldOut?: boolean
  disabled?: boolean
}
