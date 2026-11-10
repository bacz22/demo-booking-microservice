import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { AdminLayout } from '@/components/layout/admin-layout'
import { RequireAdmin } from '@/components/auth/require-admin'
import { RequireAuth } from '@/components/auth/require-auth'
import HomePage from '@/pages/home'
import MoviesPage from '@/pages/movies'
import MovieDetailPage from '@/pages/movie-detail'
import CinemasPage from '@/pages/cinemas'
import SeatSelectionPage from '@/pages/seat-selection'
import CheckoutPage from '@/pages/checkout'
import PaymentSuccessPage from '@/pages/payment-success'
import PaymentFailedPage from '@/pages/payment-failed'
import MyBookingsPage from '@/pages/my-bookings'
import BookingDetailPage from '@/pages/booking-detail'
import LoginPage from '@/pages/login'
import RegisterPage from '@/pages/register'
import ForgotPasswordPage from '@/pages/forgot-password'
import ProfilePage from '@/pages/profile'
import NotFoundPage from '@/pages/not-found'
import ForbiddenPage from '@/pages/forbidden'
import AdminDashboardPage from '@/pages/admin/dashboard'
import AdminMovieList from '@/pages/admin/movies/movie-list'
import AdminMovieForm from '@/pages/admin/movies/movie-form'
import AdminTheaterList from '@/pages/admin/theaters/theater-list'
import AdminTheaterForm from '@/pages/admin/theaters/theater-form'
import AdminTheaterDetail from '@/pages/admin/theaters/theater-detail'
import AdminAuditoriumSeatLayout from '@/pages/admin/theaters/auditorium-seat-layout'
import AdminShowtimeList from '@/pages/admin/showtimes/showtime-list'
import AdminShowtimeForm from '@/pages/admin/showtimes/showtime-form'
import AdminBookingList from '@/pages/admin/bookings/booking-list'
import AdminBookingDetail from '@/pages/admin/bookings/booking-detail'
import AdminPaymentList from '@/pages/admin/payments/payment-list'
import AdminPaymentDetail from '@/pages/admin/payments/payment-detail'
import AdminUserList from '@/pages/admin/users/user-list'
import AdminUserDetail from '@/pages/admin/users/user-detail'

export function AppRoutes() {
  return (
    <Routes>
      {/* Customer Routes (under AppLayout with customer Navbar & Footer) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:movieId" element={<MovieDetailPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        {/* Trang cần đăng nhập: danh tính lấy từ JWT qua API Gateway */}
        <Route element={<RequireAuth />}>
          <Route path="/booking/:showtimeId/seats" element={<SeatSelectionPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/my-bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin Routes (protected by RequireAdmin, under AdminLayout) */}
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/movies" element={<AdminMovieList />} />
          <Route path="/admin/movies/new" element={<AdminMovieForm />} />
          <Route path="/admin/movies/:movieId/edit" element={<AdminMovieForm />} />
          <Route path="/admin/theaters" element={<AdminTheaterList />} />
          <Route path="/admin/theaters/new" element={<AdminTheaterForm />} />
          <Route path="/admin/theaters/:theaterId" element={<AdminTheaterDetail />} />
          <Route path="/admin/theaters/:theaterId/edit" element={<AdminTheaterForm />} />
          <Route path="/admin/auditoriums/:auditoriumId/seats" element={<AdminAuditoriumSeatLayout />} />
          <Route path="/admin/showtimes" element={<AdminShowtimeList />} />
          <Route path="/admin/showtimes/new" element={<AdminShowtimeForm />} />
          <Route path="/admin/showtimes/:showtimeId/edit" element={<AdminShowtimeForm />} />
          <Route path="/admin/bookings" element={<AdminBookingList />} />
          <Route path="/admin/bookings/:bookingId" element={<AdminBookingDetail />} />
          <Route path="/admin/payments" element={<AdminPaymentList />} />
          <Route path="/admin/payments/:paymentId" element={<AdminPaymentDetail />} />
          <Route path="/admin/users" element={<AdminUserList />} />
          <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
