import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Clock,
  Users,
  Image,
  ImageOff,
  AlertCircle,
  Plus,
  X,
  Loader2,
} from 'lucide-react'
import type {
  AdminMovieStatus,
  AdminAgeRating,
  MovieFormData,
  MovieFormErrors,
} from '@/types/admin-movie'
import {
  getAdminMovieById,
  createAdminMovie,
  updateAdminMovie,
} from '@/mocks/admin/movies'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const DEFAULT_GENRES = [
  'Hành động',
  'Khoa học viễn tưởng',
  'Phiêu lưu',
  'Hoạt hình',
  'Hài hước',
  'Gia đình',
  'Kinh dị',
  'Bí ẩn',
  'Hồi hộp',
  'Tâm lý',
  'Lãng mạn',
  'Kịch tính',
  'Tiểu sử',
  'Lịch sử',
  'Tài liệu',
]

const AGE_RATINGS: Array<{ value: AdminAgeRating; label: string; desc: string }> = [
  { value: 'P', label: 'P — Phổ thông', desc: 'Được phép phổ biến cho người xem ở mọi lứa tuổi' },
  { value: 'K', label: 'K — Dưới 13 tuổi có kèm', desc: 'Người xem dưới 13 tuổi với điều kiện có cha mẹ/người giám hộ đi cùng' },
  { value: 'T13', label: 'T13 — Từ 13 tuổi trở lên', desc: 'Được phép phổ biến đến người xem từ đủ 13 tuổi trở lên' },
  { value: 'T16', label: 'T16 — Từ 16 tuổi trở lên', desc: 'Được phép phổ biến đến người xem từ đủ 16 tuổi trở lên' },
  { value: 'T18', label: 'T18 — Từ 18 tuổi trở lên', desc: 'Được phép phổ biến đến người xem từ đủ 18 tuổi trở lên' },
]

const INITIAL_FORM_DATA: MovieFormData = {
  title: '',
  originalTitle: '',
  overview: '',
  genres: ['Hành động'],
  ageRating: 'T16',
  status: 'now-showing',
  duration: 120,
  releaseDate: new Date().toISOString().slice(0, 10),
  director: '',
  cast: '',
  posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
  trailerUrl: '',
}

export default function AdminMovieForm() {
  const { movieId } = useParams<{ movieId: string }>()
  const isEditMode = Boolean(movieId)
  const navigate = useNavigate()

  const [formData, setFormData] = useState<MovieFormData>(INITIAL_FORM_DATA)
  const [initialData, setInitialData] = useState<MovieFormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<MovieFormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof MovieFormData, boolean>>>({})
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Live preview image error states
  const [posterImgFailed, setPosterImgFailed] = useState(false)
  const [backdropImgFailed, setBackdropImgFailed] = useState(false)

  // Unsaved changes warning dialog
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  // Custom genre input state
  const [newGenreInput, setNewGenreInput] = useState('')
  const [showAddGenre, setShowAddGenre] = useState(false)

  // Load existing movie for Edit mode
  useEffect(() => {
    if (!isEditMode || !movieId) return

    let isMounted = true

    getAdminMovieById(movieId)
      .then((movie) => {
        if (!isMounted) return
        if (!movie) {
          toast.error(`Không tìm thấy phim có mã "${movieId}"`)
          navigate('/admin/movies', { replace: true })
          return
        }

        const loaded: MovieFormData = {
          title: movie.title,
          originalTitle: movie.originalTitle || '',
          overview: movie.overview || '',
          genres: movie.genres,
          ageRating: movie.ageRating,
          status: movie.status,
          duration: movie.duration,
          releaseDate: movie.releaseDate,
          director: movie.director || '',
          cast: movie.cast ? movie.cast.join(', ') : '',
          posterUrl: movie.posterUrl,
          backdropUrl: movie.backdropUrl || '',
          trailerUrl: movie.trailerUrl || '',
        }
        setFormData(loaded)
        setInitialData(loaded)
        setIsLoading(false)
      })
      .catch(() => {
        if (isMounted) {
          toast.error('Lỗi khi tải thông tin phim')
          navigate('/admin/movies', { replace: true })
        }
      })

    return () => {
      isMounted = false
    }
  }, [isEditMode, movieId, navigate])

  // Determine dirty state
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData)
  }, [formData, initialData])

  // Warn on browser unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Field validation function
  const validateField = useCallback(
    (field: keyof MovieFormData, value: any): string | undefined => {
      switch (field) {
        case 'title':
          if (!value || typeof value !== 'string' || !value.trim()) {
            return 'Tên phim tiếng Việt không được để trống'
          }
          if (value.trim().length < 2) {
            return 'Tên phim phải có ít nhất 2 ký tự'
          }
          return undefined

        case 'duration': {
          const num = Number(value)
          if (!value || isNaN(num) || num <= 0 || !Number.isInteger(num)) {
            return 'Thời lượng phải là số nguyên dương hợp lệ (số phút > 0)'
          }
          if (num > 600) {
            return 'Thời lượng không được vượt quá 600 phút'
          }
          return undefined
        }

        case 'releaseDate':
          if (!value || typeof value !== 'string' || !value.trim()) {
            return 'Ngày khởi chiếu không được để trống'
          }
          return undefined

        case 'posterUrl':
          if (!value || typeof value !== 'string' || !value.trim()) {
            return 'URL Poster không được để trống'
          }
          if (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('/')) {
            return 'URL Poster phải là đường dẫn hợp lệ bắt đầu bằng http:// hoặc https://'
          }
          return undefined

        case 'backdropUrl':
          if (value && typeof value === 'string' && value.trim()) {
            if (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('/')) {
              return 'URL Backdrop phải là đường dẫn hợp lệ bắt đầu bằng http:// hoặc https://'
            }
          }
          return undefined

        case 'trailerUrl':
          if (value && typeof value === 'string' && value.trim()) {
            if (!value.startsWith('http://') && !value.startsWith('https://')) {
              return 'URL Trailer phải bắt đầu bằng http:// hoặc https://'
            }
          }
          return undefined

        case 'genres':
          if (!Array.isArray(value) || value.length === 0) {
            return 'Vui lòng chọn ít nhất 1 thể loại cho phim'
          }
          return undefined

        default:
          return undefined
      }
    },
    []
  )

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: MovieFormErrors = {}
    let isValid = true

    const fieldsToValidate: Array<keyof MovieFormData> = [
      'title',
      'duration',
      'releaseDate',
      'posterUrl',
      'backdropUrl',
      'trailerUrl',
      'genres',
    ]

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, formData[field])
      if (err) {
        newErrors[field] = err
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  // Handle field blur
  const handleBlur = (field: keyof MovieFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const err = validateField(field, formData[field])
    setErrors((prev) => ({ ...prev, [field]: err }))
  }

  // Handle field change
  const handleChange = (field: keyof MovieFormData, value: any) => {
    if (field === 'posterUrl') {
      setPosterImgFailed(false)
    }
    if (field === 'backdropUrl') {
      setBackdropImgFailed(false)
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      const err = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: err }))
    }
  }

  // Toggle Genre Tag
  const handleToggleGenre = (genre: string) => {
    setFormData((prev) => {
      const current = prev.genres
      const next = current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre]
      return { ...prev, genres: next }
    })
    setTouched((prev) => ({ ...prev, genres: true }))
  }

  // Add custom genre
  const handleAddCustomGenre = () => {
    const trimmed = newGenreInput.trim()
    if (!trimmed) return
    if (!formData.genres.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, genres: [...prev.genres, trimmed] }))
    }
    setNewGenreInput('')
    setShowAddGenre(false)
  }

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all as touched
    const allTouched: Partial<Record<keyof MovieFormData, boolean>> = {}
    Object.keys(formData).forEach((k) => {
      allTouched[k as keyof MovieFormData] = true
    })
    setTouched(allTouched)

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các trường thông tin có lỗi!')
      return
    }

    try {
      setIsSubmitting(true)
      if (isEditMode && movieId) {
        await updateAdminMovie(movieId, formData)
        toast.success(`Đã cập nhật thông tin phim "${formData.title}" thành công!`)
      } else {
        const created = await createAdminMovie(formData)
        toast.success(`Đã tạo mới phim "${created.title}" thành công!`)
      }
      navigate('/admin/movies')
    } catch {
      toast.error('Có lỗi xảy ra trong quá trình lưu dữ liệu. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Cancel / Go Back
  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveDialog(true)
    } else {
      navigate('/admin/movies')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* 1. Header with Breadcrumb & Back button */}
      <div className="space-y-3 pb-6 border-b border-border/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-xl border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Quay lại danh sách phim"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <AdminPageHeader
            title={isEditMode ? `Chỉnh sửa: ${formData.title || 'Phim'}` : 'Thêm Phim Mới'}
            description={
              isEditMode
                ? `Cập nhật thông tin chi tiết, trạng thái phát hành và hình ảnh truyền thông cho phim`
                : 'Điền đầy đủ các thông tin để tạo mới một bộ phim trên hệ thống CineBook'
            }
            breadcrumbs={[
              { label: 'Admin', href: '/admin' },
              { label: 'Quản lý phim', href: '/admin/movies' },
              { label: isEditMode ? 'Chỉnh sửa phim' : 'Thêm phim mới' },
            ]}
            actions={
              isDirty && (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold"
                >
                  Có thay đổi chưa lưu
                </Badge>
              )
            }
          />
        </div>
      </div>

      {/* 2. Main Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* SECTION 1: Thông tin cơ bản */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Thông Tin Cơ Bản</h2>
              <p className="text-xs text-muted-foreground">Tên phim, tên gốc quốc tế và bản tóm tắt nội dung</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title (Vietnamese) */}
            <div className="space-y-1.5">
              <label htmlFor="movie-title" className="text-xs font-bold text-foreground flex items-center gap-1">
                <span>Tên phim (tiếng Việt)</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="movie-title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="Ví dụ: Dune: Hành Tinh Cát - Phần Hai"
                error={touched.title ? errors.title : undefined}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* Original Title */}
            <div className="space-y-1.5">
              <label htmlFor="movie-orig-title" className="text-xs font-bold text-foreground">
                Tên gốc quốc tế (Original Title)
              </label>
              <Input
                id="movie-orig-title"
                value={formData.originalTitle}
                onChange={(e) => handleChange('originalTitle', e.target.value)}
                placeholder="Ví dụ: Dune: Part Two"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            {/* Overview */}
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="movie-overview" className="text-xs font-bold text-foreground">
                Tóm tắt nội dung phim (Overview)
              </label>
              <textarea
                id="movie-overview"
                rows={4}
                value={formData.overview}
                onChange={(e) => handleChange('overview', e.target.value)}
                placeholder="Mô tả cốt truyện, bối cảnh và điểm nhấn chính của bộ phim..."
                className="w-full rounded-xl border border-border/70 bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 leading-relaxed resize-y"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Phân loại & Trạng thái */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Phân Loại &amp; Trạng Thái</h2>
              <p className="text-xs text-muted-foreground">Thể loại phim, phân loại độ tuổi khán giả và trạng thái phát hành</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Genres Multi-Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>Thể loại phim (chọn một hoặc nhiều)</span>
                  <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Đã chọn: <strong className="text-primary">{formData.genres.length}</strong> thể loại
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {DEFAULT_GENRES.map((genre) => {
                  const isSelected = formData.genres.includes(genre)
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleToggleGenre(genre)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-secondary/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      {genre}
                    </button>
                  )
                })}

                {/* Custom genres added by user */}
                {formData.genres
                  .filter((g) => !DEFAULT_GENRES.includes(g))
                  .map((customGenre) => (
                    <button
                      key={customGenre}
                      type="button"
                      onClick={() => handleToggleGenre(customGenre)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground border border-primary shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{customGenre}</span>
                      <X className="w-3 h-3" />
                    </button>
                  ))}

                {/* Add Custom Genre Button */}
                {showAddGenre ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="text"
                      value={newGenreInput}
                      onChange={(e) => setNewGenreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomGenre()
                        }
                      }}
                      placeholder="Nhập thể loại..."
                      className="h-8 px-2.5 rounded-lg border-primary text-xs bg-background outline-none w-32"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomGenre}
                      className="h-8 px-2.5 text-xs rounded-lg"
                    >
                      Thêm
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowAddGenre(false)}
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddGenre(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm khác</span>
                  </button>
                )}
              </div>

              {touched.genres && errors.genres && (
                <p className="text-[11px] text-destructive flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.genres}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Age Rating */}
              <div className="space-y-1.5">
                <label htmlFor="movie-age-rating" className="text-xs font-bold text-foreground">
                  Phân loại độ tuổi khán giả
                </label>
                <Select
                  value={formData.ageRating}
                  onValueChange={(val) => handleChange('ageRating', val as AdminAgeRating)}
                >
                  <SelectTrigger
                    id="movie-age-rating"
                    className="h-10 text-xs rounded-xl bg-card border-border/70"
                    aria-label="Phân loại độ tuổi khán giả"
                  >
                    <SelectValue placeholder="Chọn phân loại độ tuổi" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RATINGS.map((ar) => (
                      <SelectItem key={ar.value} value={ar.value}>
                        {ar.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {AGE_RATINGS.find((r) => r.value === formData.ageRating)?.desc}
                </p>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label htmlFor="movie-status" className="text-xs font-bold text-foreground">
                  Trạng thái phát hành
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => handleChange('status', val as AdminMovieStatus)}
                >
                  <SelectTrigger
                    id="movie-status"
                    className="h-10 text-xs rounded-xl bg-card border-border/70"
                    aria-label="Trạng thái phát hành"
                  >
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now-showing">Đang chiếu (Now Showing)</SelectItem>
                    <SelectItem value="coming-soon">Sắp chiếu (Coming Soon)</SelectItem>
                    <SelectItem value="ended">Ngừng chiếu (Ended)</SelectItem>
                    <SelectItem value="archived">Lưu trữ (Archived - Không hiển thị)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {formData.status === 'now-showing' && 'Phim hiển thị trên lịch chiếu bán vé trang chủ.'}
                  {formData.status === 'coming-soon' && 'Phim hiển thị trong danh mục phim sắp chiếu.'}
                  {formData.status === 'ended' && 'Phim đã kết thúc đợt chiếu tại rạp.'}
                  {formData.status === 'archived' && 'Phim được ẩn hoàn toàn để lưu trữ dữ liệu nội bộ.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Phát hành & Thời lượng */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Thời Lượng &amp; Ngày Phát Hành</h2>
              <p className="text-xs text-muted-foreground">Thời lượng phim và ngày chính thức ra rạp</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Duration */}
            <div className="space-y-1.5">
              <label htmlFor="movie-duration" className="text-xs font-bold text-foreground flex items-center gap-1">
                <span>Thời lượng (phút)</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="movie-duration"
                type="number"
                min={1}
                max={600}
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                onBlur={() => handleBlur('duration')}
                placeholder="Ví dụ: 120"
                error={touched.duration ? errors.duration : undefined}
                leftIcon={<Clock className="w-4 h-4 text-muted-foreground" />}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* Release Date */}
            <div className="space-y-1.5">
              <label htmlFor="movie-release-date" className="text-xs font-bold text-foreground flex items-center gap-1">
                <span>Ngày khởi chiếu</span>
                <span className="text-destructive">*</span>
              </label>
              <DatePicker
                id="movie-release-date"
                value={formData.releaseDate}
                onChange={(val) => handleChange('releaseDate', val)}
                placeholder="Chọn ngày khởi chiếu"
                error={Boolean(touched.releaseDate && errors.releaseDate)}
                className="h-10 text-xs rounded-xl"
              />
              {touched.releaseDate && errors.releaseDate && (
                <p className="text-[11px] text-destructive flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.releaseDate}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: Đoàn làm phim */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Đoàn Làm Phim</h2>
              <p className="text-xs text-muted-foreground">Thông tin đạo diễn và danh sách diễn viên chính</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Director */}
            <div className="space-y-1.5">
              <label htmlFor="movie-director" className="text-xs font-bold text-foreground">
                Đạo diễn (Director)
              </label>
              <Input
                id="movie-director"
                value={formData.director}
                onChange={(e) => handleChange('director', e.target.value)}
                placeholder="Ví dụ: Denis Villeneuve, Christopher Nolan"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            {/* Cast */}
            <div className="space-y-1.5">
              <label htmlFor="movie-cast" className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Diễn viên chính (Cast)</span>
                <span className="text-[10px] text-muted-foreground font-normal">Phân tách bằng dấu phẩy</span>
              </label>
              <Input
                id="movie-cast"
                value={formData.cast}
                onChange={(e) => handleChange('cast', e.target.value)}
                placeholder="Ví dụ: Timothée Chalamet, Zendaya, Rebecca Ferguson"
                leftIcon={<Users className="w-4 h-4 text-muted-foreground" />}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: Media & Preview trực tiếp */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              5
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Hình Ảnh &amp; Media Truyền Thông</h2>
              <p className="text-xs text-muted-foreground">Đường dẫn Poster dọc (2:3), Backdrop ngang (16:9) và Trailer YouTube</p>
            </div>
          </div>

          {/* URL Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Poster URL */}
            <div className="space-y-1.5">
              <label htmlFor="movie-poster-url" className="text-xs font-bold text-foreground flex items-center gap-1">
                <span>URL Ảnh Poster (2:3)</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="movie-poster-url"
                value={formData.posterUrl}
                onChange={(e) => handleChange('posterUrl', e.target.value)}
                onBlur={() => handleBlur('posterUrl')}
                placeholder="https://images.unsplash.com/..."
                error={touched.posterUrl ? errors.posterUrl : undefined}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* Backdrop URL */}
            <div className="space-y-1.5">
              <label htmlFor="movie-backdrop-url" className="text-xs font-bold text-foreground">
                URL Ảnh Backdrop ngang (16:9)
              </label>
              <Input
                id="movie-backdrop-url"
                value={formData.backdropUrl}
                onChange={(e) => handleChange('backdropUrl', e.target.value)}
                onBlur={() => handleBlur('backdropUrl')}
                placeholder="https://images.unsplash.com/..."
                error={touched.backdropUrl ? errors.backdropUrl : undefined}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            {/* Trailer URL */}
            <div className="space-y-1.5">
              <label htmlFor="movie-trailer-url" className="text-xs font-bold text-foreground">
                URL Video Trailer (YouTube)
              </label>
              <Input
                id="movie-trailer-url"
                value={formData.trailerUrl}
                onChange={(e) => handleChange('trailerUrl', e.target.value)}
                onBlur={() => handleBlur('trailerUrl')}
                placeholder="https://www.youtube.com/watch?v=..."
                error={touched.trailerUrl ? errors.trailerUrl : undefined}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Live Preview Area */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-primary" />
              <span>Xem trước hiển thị trực tiếp (Live Media Preview)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 p-4 rounded-xl bg-secondary/30 border border-border/60">
              {/* Poster Preview (4 cols) */}
              <div className="sm:col-span-4 space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Poster Thumbnail (2:3)
                </span>
                <div className="w-full max-w-[160px] aspect-[2/3] rounded-xl overflow-hidden border border-border/70 bg-card shadow-sm relative flex items-center justify-center">
                  {formData.posterUrl && !posterImgFailed ? (
                    <img
                      src={formData.posterUrl}
                      alt="Xem trước Poster"
                      className="w-full h-full object-cover"
                      onError={() => setPosterImgFailed(true)}
                    />
                  ) : (
                    <div className="p-3 text-center space-y-1 text-muted-foreground">
                      <ImageOff className="w-6 h-6 mx-auto opacity-50" />
                      <p className="text-[10px]">
                        {posterImgFailed ? 'Không tải được ảnh từ URL' : 'Chưa có ảnh poster'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Backdrop Preview (8 cols) */}
              <div className="sm:col-span-8 space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Backdrop Banner (16:9)
                </span>
                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-border/70 bg-card shadow-sm relative flex items-center justify-center">
                  {formData.backdropUrl && !backdropImgFailed ? (
                    <img
                      src={formData.backdropUrl}
                      alt="Xem trước Backdrop"
                      className="w-full h-full object-cover"
                      onError={() => setBackdropImgFailed(true)}
                    />
                  ) : (
                    <div className="p-4 text-center space-y-1 text-muted-foreground">
                      <ImageOff className="w-8 h-8 mx-auto opacity-50" />
                      <p className="text-xs">
                        {backdropImgFailed ? 'Không tải được ảnh từ URL' : 'Chưa có ảnh backdrop banner'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Sticky Action Bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-xl text-xs cursor-pointer"
            >
              Hủy bỏ
            </Button>
            {isDirty && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium hidden sm:inline">
                Dữ liệu có thay đổi chưa lưu
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs gap-1.5 shadow-sm shadow-primary/30 cursor-pointer font-bold px-5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditMode ? 'Lưu thay đổi' : 'Tạo phim mới'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* 4. Dirty Exit Confirmation Modal */}
      <AdminConfirmDialog
        isOpen={showLeaveDialog}
        title="Bạn có thay đổi chưa lưu"
        description="Bạn đã chỉnh sửa thông tin của bộ phim này. Nếu rời trang bây giờ, mọi thay đổi chưa lưu sẽ bị mất."
        confirmText="Rời trang không lưu"
        cancelText="Ở lại tiếp tục sửa"
        variant="destructive"
        onConfirm={() => {
          setShowLeaveDialog(false)
          navigate('/admin/movies')
        }}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  )
}
