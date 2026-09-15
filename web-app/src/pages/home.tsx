import { useEffect } from 'react'
import { MovieHero } from '@/components/movie/movie-hero'
import { MovieSection } from '@/components/movie/movie-section'
import {
  HERO_MOVIE,
  NOW_SHOWING_MOVIES,
  COMING_SOON_MOVIES,
  FEATURED_MOVIES,
} from '@/mocks/movies'

export default function HomePage() {
  useEffect(() => {
    document.title = 'CineBook — Đặt Vé Xem Phim Trực Tuyến'
  }, [])

  return (
    <div className="space-y-8 md:space-y-12 pb-8">
      {/* 1. Hero Section */}
      <MovieHero
        id={HERO_MOVIE.id}
        title={HERO_MOVIE.title}
        overview={HERO_MOVIE.overview}
        backdropUrl={HERO_MOVIE.backdropUrl ?? ''}
        posterUrl={HERO_MOVIE.posterUrl}
        genres={HERO_MOVIE.genres}
        duration={HERO_MOVIE.duration}
        ageRating={HERO_MOVIE.ageRating}
        rating={HERO_MOVIE.rating}
      />

      {/* 2. Section: Phim đang chiếu */}
      <MovieSection
        title="Phim đang chiếu"
        subtitle="Các tác phẩm điện ảnh đỉnh cao đang gây sốt tại phòng vé"
        movies={NOW_SHOWING_MOVIES}
        viewAllHref="/movies"
      />

      {/* 3. Section: Phim sắp chiếu */}
      <MovieSection
        title="Phim sắp chiếu"
        subtitle="Đặt trước vé những siêu phẩm được đón đợi nhất trong thời gian tới"
        movies={COMING_SOON_MOVIES}
        viewAllHref="/movies"
      />

      {/* 4. Section: Phim nổi bật */}
      <MovieSection
        title="Phim nổi bật"
        subtitle="Danh sách các bộ phim được khán giả đánh giá cao nhất tuần qua"
        movies={FEATURED_MOVIES}
        viewAllHref="/movies"
      />
    </div>
  )
}
