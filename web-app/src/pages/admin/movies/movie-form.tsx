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
  Upload,
  Film,
  FileVideo,
  CheckCircle2,
  Eye,
} from 'lucide-react'

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  try {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    const match = trimmed.match(regExp)
    if (match && match[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`
    }
  } catch {
    return null
  }
  return null
}

function processImageFile(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size < 250 * 1024) {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
      return
    }

    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    }
    img.src = url
  })
}

function compressImageFile(file: File, maxDimension = 1200, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    if (file.size < 250 * 1024) {
      resolve(file)
      return
    }

    const img = new window.Image()
    const url = URL.createObjectURL(file)

    const useOriginal = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob || blob.size >= file.size) {
          resolve(file)
          return
        }

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
        resolve(new File([blob], `${baseName}.jpg`, {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        }))
      }, 'image/jpeg', quality)
    }
    img.onerror = useOriginal
    img.src = url
  })
}
import type {
  AdminMovieStatus,
  AdminAgeRating,
  MovieFormData,
  MovieFormErrors,
} from '@/types/admin-movie'
import { movieApiService } from '@/services/movie-api.service'
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
  posterUrl: '',
  backdropUrl: '',
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

  // Live preview image & video error states
  const [posterImgFailed, setPosterImgFailed] = useState(false)
  const [backdropImgFailed, setBackdropImgFailed] = useState(false)
  const [trailerVideoFailed, setTrailerVideoFailed] = useState(false)

  // Upload file names and statuses
  const [posterFileName, setPosterFileName] = useState<string>('')
  const [backdropFileName, setBackdropFileName] = useState<string>('')
  const [trailerFileName, setTrailerFileName] = useState<string>('')

  // Loading states during file processing
  const [isProcessingPoster, setIsProcessingPoster] = useState(false)
  const [isProcessingBackdrop, setIsProcessingBackdrop] = useState(false)
  const [isProcessingTrailer, setIsProcessingTrailer] = useState(false)

  // Drag-and-drop state indicators
  const [isDraggingPoster, setIsDraggingPoster] = useState(false)
  const [isDraggingBackdrop, setIsDraggingBackdrop] = useState(false)
  const [isDraggingTrailer, setIsDraggingTrailer] = useState(false)

  // File input refs
  const posterInputRef = React.useRef<HTMLInputElement>(null)
  const backdropInputRef = React.useRef<HTMLInputElement>(null)
  const trailerInputRef = React.useRef<HTMLInputElement>(null)

  // YouTube Embed URL memo
  const youtubeEmbedUrl = useMemo(() => {
    return getYouTubeEmbedUrl(formData.trailerUrl)
  }, [formData.trailerUrl])

  // File handler: Poster
  const handlePosterFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)')
      return
    }
    try {
      setIsProcessingPoster(true)
      // 1. Thử upload trực tiếp lên Cloudinary qua Backend
      try {
        const uploadFile = await compressImageFile(file, 1000, 0.88)
        const res = await movieApiService.uploadImage(uploadFile)
        if (res.secureUrl) {
          setPosterFileName(`${file.name} (${formatFileSize(file.size)})`)
          setPosterImgFailed(false)
          handleChange('posterUrl', res.secureUrl)
          toast.success(`Đã tải lên ảnh Poster: "${file.name}"`)
          return
        }
      } catch (apiErr) {
        console.warn('Backend upload chưa sẵn sàng, sử dụng xử lý nén cục bộ:', apiErr)
      }

      // 2. Fallback xử lý cục bộ an toàn nếu backend chưa sẵn sàng
      const dataUrl = await processImageFile(file, 1000, 0.88)
      setPosterFileName(`${file.name} (${formatFileSize(file.size)})`)
      setPosterImgFailed(false)
      handleChange('posterUrl', dataUrl)
      toast.success(`Đã chọn ảnh Poster "${file.name}"`)
    } catch {
      toast.error('Lỗi khi xử lý file ảnh poster từ máy')
    } finally {
      setIsProcessingPoster(false)
    }
  }

  // File handler: Backdrop
  const handleBackdropFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)')
      return
    }
    try {
      setIsProcessingBackdrop(true)
      // 1. Thử upload trực tiếp lên Cloudinary qua Backend
      try {
        const uploadFile = await compressImageFile(file, 1600, 0.85)
        const res = await movieApiService.uploadImage(uploadFile)
        if (res.secureUrl) {
          setBackdropFileName(`${file.name} (${formatFileSize(file.size)})`)
          setBackdropImgFailed(false)
          handleChange('backdropUrl', res.secureUrl)
          toast.success(`Đã tải lên ảnh Backdrop: "${file.name}"`)
          return
        }
      } catch (apiErr) {
        console.warn('Backend upload chưa sẵn sàng, sử dụng xử lý nén cục bộ:', apiErr)
      }

      // 2. Fallback xử lý cục bộ
      const dataUrl = await processImageFile(file, 1600, 0.85)
      setBackdropFileName(`${file.name} (${formatFileSize(file.size)})`)
      setBackdropImgFailed(false)
      handleChange('backdropUrl', dataUrl)
      toast.success(`Đã chọn ảnh Backdrop "${file.name}"`)
    } catch {
      toast.error('Lỗi khi xử lý file ảnh backdrop từ máy')
    } finally {
      setIsProcessingBackdrop(false)
    }
  }

  // File handler: Trailer
  const handleTrailerFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('Vui lòng chọn tệp video hợp lệ (MP4, WebM, QuickTime)')
      return
    }
    try {
      setIsProcessingTrailer(true)
      // 1. Thử upload video lên Cloudinary qua Backend
      try {
        const res = await movieApiService.uploadVideo(file)
        if (res.secureUrl) {
          setTrailerFileName(`${file.name} (${formatFileSize(file.size)})`)
          setTrailerVideoFailed(false)
          handleChange('trailerUrl', res.secureUrl)
          toast.success(`Đã tải lên video Trailer: "${file.name}"`)
          return
        }
      } catch (apiErr) {
        console.warn('Backend upload video chưa sẵn sàng, dùng trình phát blob cục bộ:', apiErr)
      }

      // 2. Fallback blob preview
      const blobUrl = URL.createObjectURL(file)
      setTrailerFileName(`${file.name} (${formatFileSize(file.size)})`)
      setTrailerVideoFailed(false)
      handleChange('trailerUrl', blobUrl)
      toast.success(`Đã chọn video Trailer "${file.name}"`)
    } catch {
      toast.error('Lỗi khi tải video trailer từ máy')
    } finally {
      setIsProcessingTrailer(false)
    }
  }

  // Clear handlers
  const handleClearPoster = () => {
    setPosterFileName('')
    setPosterImgFailed(false)
    handleChange('posterUrl', '')
    if (posterInputRef.current) posterInputRef.current.value = ''
  }

  const handleClearBackdrop = () => {
    setBackdropFileName('')
    setBackdropImgFailed(false)
    handleChange('backdropUrl', '')
    if (backdropInputRef.current) backdropInputRef.current.value = ''
  }

  const handleClearTrailer = () => {
    setTrailerFileName('')
    setTrailerVideoFailed(false)
    handleChange('trailerUrl', '')
    if (trailerInputRef.current) trailerInputRef.current.value = ''
  }

  // Unsaved changes warning dialog
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  // Custom genre input state
  const [newGenreInput, setNewGenreInput] = useState('')
  const [showAddGenre, setShowAddGenre] = useState(false)

  // Load existing movie for Edit mode
  useEffect(() => {
    if (!isEditMode || !movieId) return

    let isMounted = true

    movieApiService.getMovieById(movieId)
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
            return 'Vui lòng tải lên ảnh Poster hoặc nhập đường dẫn'
          }
          if (
            !value.startsWith('http://') &&
            !value.startsWith('https://') &&
            !value.startsWith('/') &&
            !value.startsWith('data:') &&
            !value.startsWith('blob:')
          ) {
            return 'Đường dẫn hoặc file ảnh Poster không hợp lệ'
          }
          return undefined

        case 'backdropUrl':
          if (value && typeof value === 'string' && value.trim()) {
            if (
              !value.startsWith('http://') &&
              !value.startsWith('https://') &&
              !value.startsWith('/') &&
              !value.startsWith('data:') &&
              !value.startsWith('blob:')
            ) {
              return 'Đường dẫn hoặc file ảnh Backdrop không hợp lệ'
            }
          }
          return undefined

        case 'trailerUrl':
          if (value && typeof value === 'string' && value.trim()) {
            if (
              !value.startsWith('http://') &&
              !value.startsWith('https://') &&
              !value.startsWith('/') &&
              !value.startsWith('data:') &&
              !value.startsWith('blob:')
            ) {
              return 'Đường dẫn hoặc file video Trailer không hợp lệ'
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
    if (field === 'trailerUrl') {
      setTrailerVideoFailed(false)
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
        await movieApiService.updateMovie(movieId, formData)
        toast.success(`Đã cập nhật thông tin phim "${formData.title}" thành công!`)
      } else {
        const created = await movieApiService.createMovie(formData)
        toast.success(`Đã tạo mới phim "${created.title}" thành công!`)
      }
      navigate('/admin/movies')
    } catch (err: any) {
      const msg = err?.message || 'Có lỗi xảy ra trong quá trình lưu dữ liệu. Vui lòng thử lại.'
      toast.error(msg)
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
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {formData.status === 'now-showing' && 'Phim hiển thị trên lịch chiếu bán vé trang chủ.'}
                  {formData.status === 'coming-soon' && 'Phim hiển thị trong danh mục phim sắp chiếu.'}
                  {formData.status === 'ended' && 'Phim đã kết thúc đợt chiếu tại rạp.'}
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
              <p className="text-xs text-muted-foreground">
                Tải lên ảnh Poster dọc (2:3), Backdrop ngang (16:9) và Video Trailer từ máy tính
              </p>
            </div>
          </div>

          {/* 3 Upload Zones (Poster, Backdrop, Trailer) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. POSTER UPLOAD (2:3) */}
            <div className="space-y-2 flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-secondary/15">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>Ảnh Poster dọc (2:3)</span>
                  <span className="text-destructive">*</span>
                </label>
                <p className="text-[11px] text-muted-foreground">Tỷ lệ dọc 2:3 hiển thị trên danh sách phim</p>
              </div>

              {/* Hidden file input */}
              <input
                ref={posterInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePosterFile(file)
                }}
              />

              <div>
                {formData.posterUrl && !posterImgFailed ? (
                  <div className="p-3 rounded-xl border border-border/80 bg-card flex items-center gap-3">
                    <div className="w-12 h-16 rounded-lg overflow-hidden border border-border/60 shrink-0 bg-secondary/40">
                      <img src={formData.posterUrl} alt="Poster" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{posterFileName || 'Đã chọn ảnh poster'}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => posterInputRef.current?.click()}
                          disabled={isProcessingPoster}
                          className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                        >
                          Đổi ảnh khác
                        </button>
                        <span className="text-muted-foreground text-[10px]">•</span>
                        <button
                          type="button"
                          onClick={handleClearPoster}
                          className="text-[11px] font-medium text-destructive hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => posterInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        posterInputRef.current?.click()
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingPoster(true)
                    }}
                    onDragLeave={() => setIsDraggingPoster(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingPoster(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file) handlePosterFile(file)
                    }}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] space-y-2',
                      isDraggingPoster
                        ? 'border-primary bg-primary/10'
                        : 'border-border/80 hover:border-primary/60 bg-card hover:bg-secondary/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                      {isProcessingPoster ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">
                        {isProcessingPoster ? 'Đang xử lý ảnh...' : 'Nhấn để chọn ảnh từ máy'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">hoặc kéo thả tệp vào đây</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70">JPG, PNG, WEBP (tối đa 10MB)</span>
                  </div>
                )}
                {touched.posterUrl && errors.posterUrl && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 pt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.posterUrl}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 2. BACKDROP UPLOAD (16:9) */}
            <div className="space-y-2 flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-secondary/15">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Ảnh Backdrop ngang (16:9)</label>
                <p className="text-[11px] text-muted-foreground">Tỷ lệ ngang 16:9 làm banner chi tiết phim</p>
              </div>

              {/* Hidden file input */}
              <input
                ref={backdropInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleBackdropFile(file)
                }}
              />

              <div>
                {formData.backdropUrl && !backdropImgFailed ? (
                  <div className="p-3 rounded-xl border border-border/80 bg-card flex items-center gap-3">
                    <div className="w-16 h-10 rounded-lg overflow-hidden border border-border/60 shrink-0 bg-secondary/40">
                      <img src={formData.backdropUrl} alt="Backdrop" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{backdropFileName || 'Đã chọn ảnh backdrop'}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => backdropInputRef.current?.click()}
                          disabled={isProcessingBackdrop}
                          className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                        >
                          Đổi ảnh khác
                        </button>
                        <span className="text-muted-foreground text-[10px]">•</span>
                        <button
                          type="button"
                          onClick={handleClearBackdrop}
                          className="text-[11px] font-medium text-destructive hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => backdropInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        backdropInputRef.current?.click()
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingBackdrop(true)
                    }}
                    onDragLeave={() => setIsDraggingBackdrop(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingBackdrop(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file) handleBackdropFile(file)
                    }}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] space-y-2',
                      isDraggingBackdrop
                        ? 'border-primary bg-primary/10'
                        : 'border-border/80 hover:border-primary/60 bg-card hover:bg-secondary/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                      {isProcessingBackdrop ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">
                        {isProcessingBackdrop ? 'Đang xử lý ảnh...' : 'Nhấn để chọn ảnh từ máy'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">hoặc kéo thả tệp vào đây</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70">JPG, PNG, WEBP (tối đa 10MB)</span>
                  </div>
                )}
                {touched.backdropUrl && errors.backdropUrl && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 pt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.backdropUrl}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 3. VIDEO TRAILER UPLOAD (16:9) */}
            <div className="space-y-2 flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-secondary/15">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-primary" />
                  <span>Video Trailer (16:9)</span>
                </label>
                <p className="text-[11px] text-muted-foreground">Tải tệp video từ máy tính phát thử trực tiếp</p>
              </div>

              {/* Hidden file input */}
              <input
                ref={trailerInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleTrailerFile(file)
                }}
              />

              <div>
                {formData.trailerUrl && !trailerVideoFailed ? (
                  <div className="p-3 rounded-xl border border-border/80 bg-card flex items-center gap-3">
                    <div className="w-12 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-border/60">
                      <FileVideo className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{trailerFileName || 'Video đã sẵn sàng'}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => trailerInputRef.current?.click()}
                          disabled={isProcessingTrailer}
                          className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                        >
                          Đổi video khác
                        </button>
                        <span className="text-muted-foreground text-[10px]">•</span>
                        <button
                          type="button"
                          onClick={handleClearTrailer}
                          className="text-[11px] font-medium text-destructive hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => trailerInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        trailerInputRef.current?.click()
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingTrailer(true)
                    }}
                    onDragLeave={() => setIsDraggingTrailer(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingTrailer(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file) handleTrailerFile(file)
                    }}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] space-y-2',
                      isDraggingTrailer
                        ? 'border-primary bg-primary/10'
                        : 'border-border/80 hover:border-primary/60 bg-card hover:bg-secondary/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                      {isProcessingTrailer ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">
                        {isProcessingTrailer ? 'Đang chuẩn bị video...' : 'Nhấn để chọn video từ máy'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">hoặc kéo thả tệp vào đây</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70">MP4, WebM (tối đa 100MB)</span>
                  </div>
                )}
                {touched.trailerUrl && errors.trailerUrl && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 pt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.trailerUrl}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* LIVE MEDIA PREVIEW (XEM TRƯỚC CẢ 3 PHƯƠNG TIỆN TRỰC TIẾP) */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Xem trước hiển thị trực tiếp (Live Media Preview) — Đầy đủ 3 phương tiện</span>
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Tự động đồng bộ và phát thử trực tiếp
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 rounded-2xl bg-secondary/20 border border-border/60">
              {/* 1. Poster Thumbnail (2:3) */}
              <div className="md:col-span-3 space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-primary" />
                    <span>Poster (2:3)</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-semibold bg-background">
                    Dọc 2:3
                  </Badge>
                </div>

                <div className="w-full aspect-[2/3] max-w-[200px] mx-auto md:mx-0 rounded-xl overflow-hidden border border-border/80 bg-card shadow-md relative flex items-center justify-center group">
                  {formData.posterUrl && !posterImgFailed ? (
                    <img
                      src={formData.posterUrl}
                      alt="Xem trước Poster"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => setPosterImgFailed(true)}
                    />
                  ) : (
                    <div className="p-4 text-center space-y-2 text-muted-foreground">
                      <ImageOff className="w-7 h-7 mx-auto opacity-40" />
                      <p className="text-[11px] font-medium">
                        {posterImgFailed ? 'Không hiển thị được ảnh' : 'Chưa có ảnh poster'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">Tải ảnh từ máy để xem trước</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Backdrop Banner (16:9) */}
              <div className="md:col-span-4 space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-primary" />
                    <span>Backdrop (16:9)</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-semibold bg-background">
                    Ngang 16:9
                  </Badge>
                </div>

                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-border/80 bg-card shadow-md relative flex items-center justify-center group">
                  {formData.backdropUrl && !backdropImgFailed ? (
                    <img
                      src={formData.backdropUrl}
                      alt="Xem trước Backdrop"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => setBackdropImgFailed(true)}
                    />
                  ) : (
                    <div className="p-4 text-center space-y-2 text-muted-foreground">
                      <ImageOff className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs font-medium">
                        {backdropImgFailed ? 'Không hiển thị được ảnh' : 'Chưa có ảnh backdrop'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">Tải ảnh nền banner từ máy</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Video Trailer Preview (16:9) */}
              <div className="md:col-span-5 space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-primary" />
                    <span>Video Trailer (16:9)</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-semibold bg-background text-primary border-primary/30">
                    Phát thử trực tiếp
                  </Badge>
                </div>

                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-border/80 bg-black/90 shadow-md relative flex items-center justify-center">
                  {youtubeEmbedUrl ? (
                    <iframe
                      src={youtubeEmbedUrl}
                      title="Xem trước Video Trailer YouTube"
                      className="w-full h-full border-0 rounded-xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : formData.trailerUrl && !trailerVideoFailed ? (
                    <video
                      key={formData.trailerUrl}
                      src={formData.trailerUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover rounded-xl bg-black"
                      onError={() => setTrailerVideoFailed(true)}
                    />
                  ) : (
                    <div className="p-4 text-center space-y-2 text-muted-foreground">
                      <Film className="w-8 h-8 mx-auto opacity-40 text-primary/70" />
                      <p className="text-xs font-medium text-foreground/80">
                        {trailerVideoFailed ? 'Không phát được file video này' : 'Chưa có video trailer'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 max-w-xs mx-auto">
                        Tải file video (.mp4, .webm) từ máy tính hoặc điền link YouTube để phát thử
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
