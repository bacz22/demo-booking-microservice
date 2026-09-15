export type AgeRating = 'P' | 'K' | 'T13' | 'T16' | 'T18' | string

export type MovieStatus = 'now-showing' | 'coming-soon' | string

export interface Movie {
  id: string
  title: string
  originalTitle?: string
  overview?: string
  posterUrl: string
  backdropUrl?: string
  trailerUrl?: string
  duration?: number // thời lượng theo phút
  releaseDate?: string
  ageRating?: AgeRating
  genres?: string[]
  rating?: number
  director?: string
  cast?: string[]
  status?: MovieStatus
}
