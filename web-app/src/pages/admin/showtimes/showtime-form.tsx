import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Clock,
  Film,
  Building2,
  Tv,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react'
import type {
  ShowtimeFormData,
  ShowtimeFormErrors,
  ShowtimeTechnologyFormat,
  ShowtimeLanguageType,
  AdminShowtimeStatus,
} from '@/types/admin-showtime'
import type { AdminMovie } from '@/types/admin-movie'
import type { AdminTheater, AdminAuditorium } from '@/types/admin-theater'
import {
  showtimeApiService,
  mapBackendShowtimeToAdminShowtime,
  calculateEndTime,
  timeToMinutes,
  minutesToTime,
} from '@/services/showtime-api.service'
import { theaterApiService } from '@/services/theater-api.service'
import { movieApiService } from '@/services/movie-api.service'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { DatePicker, TimePicker } from '@/components/ui/date-picker'

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

const FORMAT_OPTIONS: { value: ShowtimeTechnologyFormat; label: string }[] = [
  { value: '2D', label: '2D Digital' },
  { value: '3D', label: '3D Digital' },
  { value: 'IMAX Laser', label: 'IMAX Laser' },
  { value: '4DX', label: '4DX Dynamic' },
  { value: 'ScreenX', label: 'ScreenX 270°' },
  { value: 'Dolby Atmos', label: 'Dolby Atmos' },
]

const LANGUAGE_OPTIONS: { value: ShowtimeLanguageType; label: string }[] = [
  { value: 'Phụ đề', label: 'Phụ đề tiếng Việt' },
  { value: 'Lồng tiếng', label: 'Lồng tiếng Việt' },
  { value: 'Thuyết minh', label: 'Thuyết minh tiếng Việt' },
]

const STATUS_OPTIONS: { value: AdminShowtimeStatus; label: string }[] = [
  { value: 'selling', label: 'Đang mở bán vé' },
  { value: 'sold-out', label: 'Hết vé' },
  { value: 'ended', label: 'Đã kết thúc' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const QUICK_PRICES = [85000, 110000, 130000, 160000, 200000]

export default function AdminShowtimeForm() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(showtimeId)

  // Options
  const [theaters, setTheaters] = useState<AdminTheater[]>([])
  const [auditoriums, setAuditoriums] = useState<AdminAuditorium[]>([])
  const [movies, setMovies] = useState<AdminMovie[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  // Today string YYYY-MM-DD for min date
  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  // Form State
  const [formData, setFormData] = useState<ShowtimeFormData>({
    movieId: '',
    theaterId: '',
    auditoriumId: '',
    date: todayStr,
    startTime: '10:00',
    endTime: '12:00',
    cleaningBufferMinutes: 15,
    format: '2D',
    language: 'Phụ đề',
    basePrice: 110000,
    status: 'selling',
  })

  const [initialDataJson, setInitialDataJson] = useState<string>('')
  const [errors, setErrors] = useState<ShowtimeFormErrors>({})

  // Điều phối chỉ 1 popup (DatePicker hoặc TimePicker) mở tại một thời điểm
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null)

  // Selected Movie details
  const selectedMovie = useMemo(() => {
    return movies.find((m) => m.id === formData.movieId)
  }, [movies, formData.movieId])

  // Selected Auditorium details
  const selectedAuditorium = useMemo(() => {
    return auditoriums.find((a) => a.id === formData.auditoriumId)
  }, [auditoriums, formData.auditoriumId])

  // Load theaters and movies
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [thRes, mvRes] = await Promise.all([
          theaterApiService.getAdminTheaters({ pageSize: 100 }),
          movieApiService.getMovies({ pageSize: 100 }),
        ])
        setTheaters(thRes.items || [])
        // Keep active movies (if editing, include all movies)
        setMovies(mvRes.items || [])
      } catch (err) {
        console.error('Lỗi tải dữ liệu rạp và phim:', err)
        toast.error('Không thể tải danh mục rạp và phim từ hệ thống')
      }
    }
    loadPrerequisites()
  }, [])

  // Update auditoriums when theaterId changes
  useEffect(() => {
    let isCancelled = false
    const loadAuds = async () => {
      if (formData.theaterId) {
        try {
          const auds = await theaterApiService.getAuditoriumsByTheaterId(formData.theaterId)
          if (!isCancelled) {
            setAuditoriums(auds)
            // If currently selected auditorium does not belong to new theater, reset it (only in create mode)
            if (formData.auditoriumId && !auds.some((a) => a.id === formData.auditoriumId) && !isEdit) {
              setFormData((prev) => ({ ...prev, auditoriumId: '' }))
            }
          }
        } catch (err) {
          console.error('Lỗi tải phòng chiếu:', err)
          if (!isCancelled) setAuditoriums([])
        }
      } else {
        if (!isCancelled) {
          setAuditoriums([])
          if (!isEdit) {
            setFormData((prev) => ({ ...prev, auditoriumId: '' }))
          }
        }
      }
    }
    loadAuds()
    return () => {
      isCancelled = true
    }
  }, [formData.theaterId, isEdit])

  // If editing, load showtime data
  useEffect(() => {
    if (!showtimeId) {
      setIsLoading(false)
      setInitialDataJson(
        JSON.stringify({
          movieId: '',
          theaterId: '',
          auditoriumId: '',
          date: todayStr,
          startTime: '10:00',
          endTime: '12:00',
          cleaningBufferMinutes: 15,
          format: '2D',
          language: 'Phụ đề',
          basePrice: 110000,
          status: 'selling',
        })
      )
      return
    }

    const fetchDetail = async () => {
      setIsLoading(true)
      try {
        const rawSt = await showtimeApiService.getAdminShowtimeById(showtimeId)
        if (!rawSt) {
          toast.error('Không tìm thấy suất chiếu')
          navigate('/admin/showtimes')
          return
        }

        const st = mapBackendShowtimeToAdminShowtime(rawSt)

        if (st.theaterId) {
          try {
            const auds = await theaterApiService.getAuditoriumsByTheaterId(st.theaterId)
            setAuditoriums(auds)
          } catch (e) {
            console.error('Lỗi tải phòng chiếu:', e)
          }
        }

        const data: ShowtimeFormData = {
          movieId: st.movieId,
          theaterId: st.theaterId,
          auditoriumId: st.auditoriumId,
          date: st.date,
          startTime: st.startTime,
          endTime: st.endTime,
          cleaningBufferMinutes: st.cleaningBufferMinutes || 15,
          format: st.format,
          language: st.language,
          basePrice: st.basePrice,
          status: st.status,
        }

        setFormData(data)
        setInitialDataJson(JSON.stringify(data))
      } catch (err: any) {
        toast.error(err?.message || 'Lỗi khi tải thông tin suất chiếu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetail()
  }, [showtimeId, navigate, todayStr])

  // Automatically recalculate endTime when startTime or movie duration changes
  useEffect(() => {
    if (selectedMovie && formData.startTime) {
      const calculated = calculateEndTime(formData.startTime, selectedMovie.duration)
      setFormData((prev) => ({ ...prev, endTime: calculated }))
    }
  }, [selectedMovie, formData.startTime])

  // Cleaning end time: endTime + 15 mins
  const readyForNextTime = useMemo(() => {
    if (!formData.endTime) return ''
    const endMin = timeToMinutes(formData.endTime)
    return minutesToTime(endMin + (formData.cleaningBufferMinutes || 15))
  }, [formData.endTime, formData.cleaningBufferMinutes])

  // Existing showtimes of selected auditorium & date for live client hint
  const [existingShowtimes, setExistingShowtimes] = useState<any[]>([])

  useEffect(() => {
    if (!formData.auditoriumId || !formData.date) {
      setExistingShowtimes([])
      return
    }
    let isCancelled = false
    showtimeApiService
      .getAdminShowtimes({
        auditoriumId: formData.auditoriumId,
        dateFrom: formData.date,
        pageSize: 100,
      })
      .then((res) => {
        if (!isCancelled) {
          setExistingShowtimes(res.items || [])
        }
      })
      .catch(() => {
        if (!isCancelled) setExistingShowtimes([])
      })
    return () => {
      isCancelled = true
    }
  }, [formData.auditoriumId, formData.date])

  // Live Conflict Check
  const conflictInfo = useMemo(() => {
    if (!formData.auditoriumId || !formData.date || !formData.startTime || !formData.endTime) {
      return { hasConflict: false }
    }
    const newStart = timeToMinutes(formData.startTime)
    const newEndWithBuffer = timeToMinutes(formData.endTime) + (formData.cleaningBufferMinutes || 15)

    for (const st of existingShowtimes) {
      if (showtimeId && st.id === showtimeId) continue
      if (st.status === 'cancelled') continue

      const stStart = timeToMinutes(st.startTime)
      const stEndWithBuffer = timeToMinutes(st.endTime) + (st.cleaningBufferMinutes || 15)

      if (Math.max(newStart, stStart) < Math.min(newEndWithBuffer, stEndWithBuffer)) {
        return {
          hasConflict: true,
          reason: `Trùng khung giờ với suất "${st.movieTitle}" (${st.startTime} - ${st.endTime}, phòng sẵn sàng lúc ${minutesToTime(stEndWithBuffer)} sau dọn phòng).`,
        }
      }
    }

    return { hasConflict: false }
  }, [formData.auditoriumId, formData.date, formData.startTime, formData.endTime, formData.cleaningBufferMinutes, existingShowtimes, showtimeId])

  // Dirty check
  const isDirty = useMemo(() => {
    if (!initialDataJson) return false
    return JSON.stringify(formData) !== initialDataJson
  }, [formData, initialDataJson])

  // Validation
  const validate = (): boolean => {
    const errs: ShowtimeFormErrors = {}

    if (!formData.movieId) {
      errs.movieId = 'Vui lòng chọn phim'
    }

    if (!formData.theaterId) {
      errs.theaterId = 'Vui lòng chọn cụm rạp'
    }

    if (!formData.auditoriumId) {
      errs.auditoriumId = 'Vui lòng chọn phòng chiếu'
    }

    if (!formData.date) {
      errs.date = 'Vui lòng chọn ngày chiếu'
    } else if (formData.date < todayStr && !isEdit) {
      errs.date = 'Không thể lên lịch suất chiếu trong quá khứ'
    }

    if (!formData.startTime) {
      errs.startTime = 'Vui lòng nhập giờ bắt đầu'
    }

    if (!formData.basePrice || Number(formData.basePrice) <= 0) {
      errs.basePrice = 'Giá vé cơ bản phải lớn hơn 0 ₫'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại các trường thông tin có lỗi')
      return
    }

    try {
      setIsSubmitting(true)

      if (isEdit && showtimeId) {
        await showtimeApiService.updateShowtime(showtimeId, formData)
        toast.success('Đã cập nhật suất chiếu thành công!')
      } else {
        await showtimeApiService.createShowtime(formData)
        toast.success('Đã tạo suất chiếu mới thành công!')
      }

      setInitialDataJson(JSON.stringify(formData))
      navigate('/admin/showtimes')
    } catch (err: any) {
      console.error('Lỗi khi lưu suất chiếu:', err)
      if (err?.code === 'SHOWTIME_OVERLAP') {
        toast.error(err.message || 'Phòng chiếu đã có suất chiếu khác trong khung giờ này (trùng lịch)!')
        setErrors((prev) => ({ ...prev, startTime: err.message || 'Trùng lịch chiếu với suất khác' }))
      } else if (err?.code === 'MOVIE_NOT_FOUND') {
        toast.error('Phim được chọn không tồn tại hoặc đã bị gỡ khỏi hệ thống!')
        setErrors((prev) => ({ ...prev, movieId: 'Phim không tồn tại trên hệ thống' }))
      } else if (err?.code === 'SHOWTIME_IN_PAST') {
        toast.error('Thời gian bắt đầu suất chiếu không thể ở trong quá khứ!')
        setErrors((prev) => ({ ...prev, startTime: 'Thời gian bắt đầu không thể ở quá khứ' }))
      } else if (err?.code === 'INVALID_SHOWTIME_STATE') {
        toast.error(err.message || 'Chỉ có thể chỉnh sửa khi suất chiếu ở trạng thái SCHEDULED!')
      } else {
        toast.error(err?.message || 'Có lỗi xảy ra khi lưu suất chiếu. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (isDirty) {
      setShowLeaveDialog(true)
    } else {
      navigate('/admin/showtimes')
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin suất chiếu...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-xs text-muted-foreground hover:text-foreground -ml-2 mb-1 gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách</span>
          </Button>

          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEdit ? 'Chỉnh sửa suất chiếu' : 'Tạo suất chiếu mới'}
            </h1>
            {isDirty && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                Chưa lưu thay đổi
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Cấu hình thời gian chiếu, địa điểm, phòng chiếu và giá vé tiêu chuẩn
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Phim & Định dạng */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Film className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
              1. Phim & Định dạng trình chiếu
            </h2>
          </div>

          {isEdit && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                Suất chiếu đã lên lịch không hỗ trợ đổi phim hoặc phòng chiếu. Bạn có thể điều chỉnh thời gian bắt đầu, thời gian dọn phòng và giá vé bên dưới.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Movie Select */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">
                Chọn phim <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.movieId}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, movieId: val }))
                  if (errors.movieId) setErrors((prev) => ({ ...prev, movieId: undefined }))
                }}
                disabled={isEdit}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/70 bg-background">
                  <SelectValue placeholder="-- Chọn phim chiếu rạp --" />
                </SelectTrigger>
                <SelectContent>
                  {movies.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title} ({m.duration} phút • {m.ageRating})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.movieId && <p className="text-[11px] text-rose-500">{errors.movieId}</p>}

              {/* Movie Details Card Preview */}
              {selectedMovie && (
                <div className="mt-3 p-3.5 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-3.5 animate-in fade-in duration-200">
                  <img
                    src={selectedMovie.posterUrl}
                    alt={selectedMovie.title}
                    className="w-12 h-16 object-cover rounded-md border border-border/80 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'
                    }}
                  />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-foreground text-sm block">
                      {selectedMovie.title}
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 border-amber-500/40 text-amber-500"
                      >
                        {selectedMovie.ageRating}
                      </Badge>
                      <span className="font-mono font-semibold text-primary">
                        {selectedMovie.duration} phút
                      </span>
                      <span>•</span>
                      <span>{selectedMovie.genres.join(', ')}</span>
                    </div>
                    <p className="text-muted-foreground/80 line-clamp-1">{selectedMovie.overview}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Format Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Định dạng công nghệ <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.format}
                onValueChange={(val: any) => setFormData((prev) => ({ ...prev, format: val }))}
                disabled={isEdit}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/70 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ngôn ngữ & Thuyết minh <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.language}
                onValueChange={(val: any) => setFormData((prev) => ({ ...prev, language: val }))}
                disabled={isEdit}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/70 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Cụm rạp & Phòng chiếu */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Building2 className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
              2. Địa điểm & Phòng chiếu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Theater Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cụm rạp <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.theaterId}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, theaterId: val }))
                  if (errors.theaterId) setErrors((prev) => ({ ...prev, theaterId: undefined }))
                }}
                disabled={isEdit}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/70 bg-background">
                  <SelectValue placeholder="-- Chọn cụm rạp --" />
                </SelectTrigger>
                <SelectContent>
                  {theaters.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.theaterId && <p className="text-[11px] text-rose-500">{errors.theaterId}</p>}
            </div>

            {/* Auditorium Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Phòng chiếu <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.auditoriumId}
                onValueChange={(val) => {
                  const aud = auditoriums.find((a) => a.id === val)
                  setFormData((prev) => ({
                    ...prev,
                    auditoriumId: val,
                    format: (aud?.format as any) || prev.format,
                  }))
                  if (errors.auditoriumId)
                    setErrors((prev) => ({ ...prev, auditoriumId: undefined }))
                }}
                disabled={isEdit || !formData.theaterId}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/70 bg-background">
                  <SelectValue
                    placeholder={
                      formData.theaterId
                        ? '-- Chọn phòng chiếu --'
                        : 'Vui lòng chọn cụm rạp trước'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {auditoriums.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.format} • {a.totalSeats} ghế)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.auditoriumId && (
                <p className="text-[11px] text-rose-500">{errors.auditoriumId}</p>
              )}

              {selectedAuditorium && (
                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <Tv className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Công suất phòng:{' '}
                    <strong className="font-mono text-foreground">
                      {selectedAuditorium.totalSeats} ghế
                    </strong>{' '}
                    (tự động tính từ Sơ đồ ghế)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Lịch chiếu & Thời gian */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
              3. Lịch chiếu & Khung thời gian
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ngày chiếu <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                value={formData.date}
                onChange={(date) => {
                  setFormData((prev) => ({ ...prev, date }))
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }))
                }}
                minDate={isEdit ? undefined : todayStr}
                placeholder="Chọn ngày chiếu..."
                error={Boolean(errors.date)}
                clearable={false}
                toYear={new Date().getFullYear() + 3}
                open={activePicker === 'date'}
                onOpenChange={(open) => setActivePicker(open ? 'date' : null)}
              />
              {errors.date && <p className="text-[11px] text-rose-500">{errors.date}</p>}
            </div>

            {/* Start Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Giờ bắt đầu chiếu <span className="text-rose-500">*</span>
              </label>
              <TimePicker
                value={formData.startTime}
                onChange={(time) => {
                  setFormData((prev) => ({ ...prev, startTime: time }))
                  if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: undefined }))
                }}
                placeholder="Chọn giờ bắt đầu..."
                error={Boolean(errors.startTime)}
                open={activePicker === 'time'}
                onOpenChange={(open) => setActivePicker(open ? 'time' : null)}
              />
              {errors.startTime && <p className="text-[11px] text-rose-500">{errors.startTime}</p>}
            </div>

            {/* End Time (Computed) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Giờ kết thúc (tính tự động)
              </label>
              <div className="w-full h-10 px-3.5 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-between text-xs text-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono font-bold text-sm text-foreground">
                    {formData.endTime || '--:--'}
                  </span>
                </div>
                {formData.endTime && (
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                    +{selectedMovie?.duration || 0} phút
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                = Giờ bắt đầu + {selectedMovie?.duration || 0} phút thời lượng phim
              </p>
            </div>
          </div>

          {/* Buffer & Cleaning info banner */}
          <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 text-xs flex items-center gap-2.5">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <div className="text-muted-foreground">
              Khoảng nghỉ dọn phòng tiêu chuẩn:{' '}
              <strong className="text-foreground font-mono">15 phút</strong>. Phòng chiếu sẽ sẵn
              sàng cho suất kế tiếp lúc{' '}
              <strong className="text-primary font-mono font-bold">
                {readyForNextTime || '--:--'}
              </strong>
              .
            </div>
          </div>

          {/* Conflict Warning Indicator */}
          {conflictInfo.hasConflict && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                <span>Phát hiện xung đột lịch chiếu trong phòng này:</span>
              </div>
              <p className="text-xs">{conflictInfo.reason}</p>
              <p className="text-[11px] text-muted-foreground italic border-t border-rose-500/20 pt-1.5">
                * Cảnh báo sơ bộ cục bộ dựa trên dữ liệu hiện có; không thay thế xác thực authoritative
                từ backend.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 4: Giá vé & Trạng thái */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
              4. Giá vé cơ bản & Trạng thái vận hành
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Price */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Giá vé cơ bản (VND) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={10000}
                  step={5000}
                  value={formData.basePrice}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, basePrice: Number(e.target.value) }))
                    if (errors.basePrice) setErrors((prev) => ({ ...prev, basePrice: undefined }))
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-border/70 bg-background text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  ₫
                </span>
              </div>
              {errors.basePrice && <p className="text-[11px] text-rose-500">{errors.basePrice}</p>}

              {/* Quick price chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-muted-foreground">Gợi ý nhanh:</span>
                {QUICK_PRICES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, basePrice: p }))}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors cursor-pointer',
                      formData.basePrice === p
                        ? 'border-primary bg-primary text-primary-foreground font-bold'
                        : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {formatVND(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Trạng thái mở bán <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.status}
                onValueChange={(val: any) => setFormData((prev) => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/70 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Suất chiếu ở trạng thái &quot;Đang mở bán&quot; sẽ lập tức hiển thị trên ứng dụng đặt vé của
                khách hàng.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 relative">
            {conflictInfo.hasConflict && (
              <span className="absolute left-0 text-xs font-bold text-amber-500 flex items-center gap-1 hidden md:flex">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Có cảnh báo xung đột giờ</span>
              </span>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="cursor-pointer text-xs rounded-xl px-6 h-10 font-medium"
            >
              Hủy bỏ
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[150px] rounded-xl font-bold shadow-xs px-6 h-10"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Lưu thay đổi' : 'Tạo suất chiếu'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Dirty Leave Warning Dialog */}
      <AdminConfirmDialog
        isOpen={showLeaveDialog}
        title="Bạn có thay đổi chưa lưu"
        description="Thông tin suất chiếu đang chỉnh sửa chưa được lưu lại. Bạn có chắc chắn muốn rời khỏi trang không?"
        confirmText="Rời trang không lưu"
        cancelText="Ở lại tiếp tục sửa"
        variant="destructive"
        onConfirm={() => {
          setShowLeaveDialog(false)
          navigate('/admin/showtimes')
        }}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  )
}
