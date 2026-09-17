import type { ShowtimeItem } from './showtime'

export interface CinemaMovieSchedule {
  movieId: string
  movieTitle: string
  originalTitle?: string
  posterUrl: string
  ageRating?: string
  duration?: number
  genres?: string[]
  rating?: number
  showtimes: ShowtimeItem[]
}

export interface CinemaWithShowtimes {
  id: string
  name: string
  address: string
  city: string
  distance?: string
  imageUrl?: string
  hotline?: string
  openingHours?: string
  totalRooms?: number
  features?: string[]
  mapUrl?: string
  showtimes: ShowtimeItem[]
  movieSchedules?: CinemaMovieSchedule[]
}
