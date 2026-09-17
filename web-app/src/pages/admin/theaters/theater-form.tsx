import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Building2,
  Phone,
  Image,
  ImageOff,
  AlertCircle,
  Plus,
  X,
  Loader2,
  MapPin,
  Upload,
  CheckCircle2,
} from 'lucide-react'
import type {
  AdminTheaterStatus,
  TheaterFormData,
  TheaterFormErrors,
} from '@/types/admin-theater'
import {
  theaterApiService,
  DEFAULT_THEATER_FEATURES,
} from '@/services/theater-api.service'
import { mediaApiService } from '@/services/media-api.service'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OperatingHoursPicker } from '@/components/ui/operating-hours-picker'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function compressImageFile(file: File, maxDimension = 1600, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    if (file.size < 300 * 1024) {
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

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'theater-image'
        resolve(
          new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: file.lastModified,
          })
        )
      }, 'image/jpeg', quality)
    }
    img.onerror = useOriginal
    img.src = url
  })
}

const INITIAL_FORM_DATA: TheaterFormData = {
  name: '',
  address: '',
  city: '',
  hotline: '',
  openingHours: '',
  features: [],
  imageUrl: '',
  status: 'active',
}

export default function AdminTheaterForm() {
  const { theaterId } = useParams<{ theaterId: string }>()
  const isEditMode = Boolean(theaterId)
  const navigate = useNavigate()

  const [formData, setFormData] = useState<TheaterFormData>(INITIAL_FORM_DATA)
  const [initialData, setInitialData] = useState<TheaterFormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<TheaterFormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof TheaterFormData, boolean>>>({})
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Live preview image error state
  const [imgFailed, setImgFailed] = useState(false)

  // Custom feature adding
  const [showAddFeature, setShowAddFeature] = useState(false)
  const [newFeatureInput, setNewFeatureInput] = useState('')

  // Dirty Leave Modal
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  // File upload state for theater image
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')

  const handleImageFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP, AVIF)')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 15MB')
      return
    }

    try {
      setIsUploadingImage(true)
      // 1. Thử nén ảnh và tải lên Media Service qua Backend
      try {
        const uploadFile = await compressImageFile(file, 1600, 0.85)
        const res = await mediaApiService.uploadImage(uploadFile)
        if (res.secureUrl) {
          setUploadedFileName(`${file.name} (${formatFileSize(file.size)})`)
          setImgFailed(false)
          handleChange('imageUrl', res.secureUrl)
          toast.success(`Đã tải lên ảnh cụm rạp: "${file.name}"`)
          return
        }
      } catch (apiErr) {
        console.warn('Backend upload chưa sẵn sàng, sử dụng fallback blob preview:', apiErr)
      }

      // 2. Fallback blob URL cho preview
      const blobUrl = URL.createObjectURL(file)
      setUploadedFileName(`${file.name} (${formatFileSize(file.size)})`)
      setImgFailed(false)
      handleChange('imageUrl', blobUrl)
      toast.success(`Đã chọn ảnh "${file.name}" từ thiết bị`)
    } catch {
      toast.error('Lỗi khi xử lý file ảnh từ máy')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleClearImage = () => {
    setUploadedFileName('')
    setImgFailed(false)
    handleChange('imageUrl', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Load existing theater if in edit mode
  useEffect(() => {
    if (!theaterId) return
    let isCancelled = false

    theaterApiService
      .getAdminTheaterById(theaterId)
      .then((t) => {
        if (isCancelled) return
        if (!t) {
          toast.error('Không tìm thấy thông tin cụm rạp yêu cầu')
          navigate('/admin/theaters')
          return
        }
        const data: TheaterFormData = {
          name: t.name,
          address: t.address,
          city: t.city,
          hotline: t.hotline,
          openingHours: t.openingHours,
          features: t.features,
          imageUrl: t.imageUrl,
          status: t.status,
        }
        setFormData(data)
        setInitialData(data)
        setIsLoading(false)
      })
      .catch((err: any) => {
        if (!isCancelled) {
          toast.error(err?.message || 'Lỗi khi tải thông tin cụm rạp')
          navigate('/admin/theaters')
        }
      })

    return () => {
      isCancelled = true
    }
  }, [theaterId, navigate])

  // Reset img error on URL change
  useEffect(() => {
    setImgFailed(false)
  }, [formData.imageUrl])

  // Dirty state calculation
  const isDirty = useMemo(() => {
    if (!isEditMode) {
      return (
        formData.name !== '' ||
        formData.address !== '' ||
        formData.features.length !== INITIAL_FORM_DATA.features.length
      )
    }
    return JSON.stringify(formData) !== JSON.stringify(initialData)
  }, [formData, initialData, isEditMode])

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Validate fields
  const validateField = (field: keyof TheaterFormData, val: any): string | undefined => {
    switch (field) {
      case 'name':
        if (!val || !val.trim()) return 'Vui lòng nhập tên cụm rạp'
        if (val.trim().length < 3) return 'Tên rạp phải có ít nhất 3 ký tự'
        return undefined

      case 'address':
        if (!val || !val.trim()) return 'Vui lòng nhập địa chỉ cụ thể của cụm rạp'
        if (val.trim().length < 5) return 'Địa chỉ phải có ít nhất 5 ký tự'
        return undefined

      case 'city':
        if (!val || !val.trim()) return 'Vui lòng chọn hoặc nhập thành phố'
        return undefined

      case 'imageUrl':
        if (val && typeof val === 'string' && val.trim()) {
          if (
            !val.startsWith('http://') &&
            !val.startsWith('https://') &&
            !val.startsWith('/') &&
            !val.startsWith('data:') &&
            !val.startsWith('blob:')
          ) {
            return 'Đường dẫn hoặc file ảnh cụm rạp không hợp lệ'
          }
        }
        return undefined

      default:
        return undefined
    }
  }

  const validateAll = (): boolean => {
    const newErrors: TheaterFormErrors = {}
    let isValid = true

    const fields: Array<keyof TheaterFormData> = ['name', 'address', 'city', 'imageUrl']
    fields.forEach((field) => {
      const err = validateField(field, formData[field])
      if (err) {
        newErrors[field] = err
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleChange = (field: keyof TheaterFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      const err = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: err }))
    }
  }

  const handleBlur = (field: keyof TheaterFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const err = validateField(field, formData[field])
    setErrors((prev) => ({ ...prev, [field]: err }))
  }

  // Feature tag toggle
  const handleToggleFeature = (feat: string) => {
    setFormData((prev) => {
      const exists = prev.features.includes(feat)
      const next = exists ? prev.features.filter((f) => f !== feat) : [...prev.features, feat]
      return { ...prev, features: next }
    })
  }

  const handleAddCustomFeature = () => {
    const trimmed = newFeatureInput.trim()
    if (!trimmed) return
    if (!formData.features.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, features: [...prev.features, trimmed] }))
    }
    setNewFeatureInput('')
    setShowAddFeature(false)
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Touch all required fields
    setTouched({
      name: true,
      address: true,
      city: true,
      imageUrl: true,
    })

    if (!validateAll()) {
      toast.error('Vui lòng kiểm tra và hoàn thành các trường bắt buộc có đánh dấu đỏ')
      return
    }

    try {
      setIsSubmitting(true)
      if (isEditMode && theaterId) {
        const updated = await theaterApiService.updateTheater(theaterId, formData)
        if (updated) {
          toast.success(`Đã lưu thay đổi cho rạp "${updated.name}" thành công!`)
          navigate(`/admin/theaters/${theaterId}`)
        }
      } else {
        const created = await theaterApiService.createTheater(formData)
        toast.success(`Đã thêm cụm rạp mới "${created.name}" thành công!`)
        navigate(`/admin/theaters/${created.id}`)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Không thể lưu thông tin cụm rạp. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveDialog(true)
    } else {
      navigate(isEditMode && theaterId ? `/admin/theaters/${theaterId}` : '/admin/theaters')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Button>

        <AdminPageHeader
          title={isEditMode ? `Chỉnh Sửa: ${formData.name || 'Cụm Rạp'}` : 'Thêm Cụm Rạp Mới'}
          description={
            isEditMode
              ? 'Cập nhật địa chỉ, tiện ích, trạng thái vận hành của cụm rạp'
              : 'Thiết lập thông tin cụm rạp chiếu mới trong hệ sinh thái CineBook'
          }
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Cụm rạp & Phòng', href: '/admin/theaters' },
            { label: isEditMode ? 'Chỉnh sửa rạp' : 'Thêm rạp mới' },
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
              <p className="text-xs text-muted-foreground">
                Tên cụm rạp, thành phố quản lý, hotline hỗ trợ và giờ mở cửa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Theater Name */}
            <div className="space-y-1.5">
              <label htmlFor="theater-name" className="text-xs font-bold text-foreground flex items-center gap-1">
                <span>Tên cụm rạp</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="theater-name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Ví dụ: CineBook Landmark 81, CineBook Vincom..."
                error={touched.name ? errors.name : undefined}
                leftIcon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label htmlFor="theater-city" className="text-xs font-bold text-foreground flex items-center gap-1">
                <span>Thành phố / Tỉnh thành</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="theater-city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
                placeholder="Nhập tên thành phố (ví dụ: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng...)"
                error={touched.city ? errors.city : undefined}
                leftIcon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* Hotline */}
            <div className="space-y-1.5">
              <label htmlFor="theater-hotline" className="text-xs font-bold text-foreground">
                Đường dây nóng (Hotline)
              </label>
              <Input
                id="theater-hotline"
                value={formData.hotline}
                onChange={(e) => handleChange('hotline', e.target.value)}
                placeholder="Ví dụ: 1900 6868 - Ext 101"
                leftIcon={<Phone className="w-4 h-4 text-muted-foreground" />}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            {/* Opening Hours */}
            <div className="space-y-1.5">
              <label htmlFor="theater-hours" className="text-xs font-bold text-foreground">
                Khung giờ hoạt động
              </label>
              <OperatingHoursPicker
                id="theater-hours"
                value={formData.openingHours}
                onChange={(val) => handleChange('openingHours', val)}
                placeholder="Chọn khung giờ hoạt động (Ví dụ: 08:30 - 23:30)"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Địa chỉ chi tiết (wrap tự nhiên) */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Địa Chỉ &amp; Vị Trí Cụm Rạp</h2>
              <p className="text-xs text-muted-foreground">
                Địa chỉ chi tiết, số tầng, tòa nhà trung tâm thương mại (hiển thị wrap tự nhiên)
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="theater-address" className="text-xs font-bold text-foreground flex items-center gap-1">
              <span>Địa chỉ đầy đủ</span>
              <span className="text-destructive">*</span>
            </label>
            <textarea
              id="theater-address"
              rows={3}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              placeholder="Ví dụ: Tầng B1, TTTM Vincom Center Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM"
              className={cn(
                'w-full rounded-xl border bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed resize-y',
                touched.address && errors.address
                  ? 'border-destructive focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/20'
                  : 'border-border/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'
              )}
              required
            />
            {touched.address && errors.address && (
              <p className="text-[11px] text-destructive flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.address}</span>
              </p>
            )}
          </div>
        </div>

        {/* SECTION 3: Tiện ích & Cơ sở vật chất */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Tiện Ích &amp; Dịch Vụ Cụm Rạp</h2>
              <p className="text-xs text-muted-foreground">
                Các trang thiết bị, phòng chiếu đặc biệt và tiện ích khách hàng
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Chọn các tiện ích sẵn có tại cụm rạp:
              </span>
              <span className="text-[11px] text-muted-foreground">
                Đã chọn: <strong className="text-primary">{formData.features.length}</strong> tiện ích
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {DEFAULT_THEATER_FEATURES.map((feat) => {
                const isSelected = formData.features.includes(feat)
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => handleToggleFeature(feat)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    {feat}
                  </button>
                )
              })}

              {/* Custom features */}
              {formData.features
                .filter((f) => !DEFAULT_THEATER_FEATURES.includes(f))
                .map((custom) => (
                  <button
                    key={custom}
                    type="button"
                    onClick={() => handleToggleFeature(custom)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground border border-primary shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{custom}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}

              {/* Add custom feature */}
              {showAddFeature ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCustomFeature()
                      }
                    }}
                    placeholder="Tên tiện ích..."
                    className="h-8 px-2.5 rounded-lg border-primary text-xs bg-background outline-none w-32"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomFeature}
                    className="h-8 px-2.5 text-xs rounded-lg cursor-pointer"
                  >
                    Thêm
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowAddFeature(false)}
                    className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddFeature(true)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tiện ích khác</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: Hình ảnh & Trạng thái */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Hình Ảnh &amp; Trạng Thái Vận Hành</h2>
              <p className="text-xs text-muted-foreground">
                Ảnh đại diện không gian rạp và trạng thái tiếp nhận khách
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột trái: Bộ chọn ảnh từ máy & Trạng thái */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>Ảnh Không Gian Cụm Rạp (16:9)</span>
                  <span className="text-destructive">*</span>
                </label>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageFile(file)
                  }}
                />

                {/* Chế độ chọn ảnh từ máy (Dropzone) */}
                <div>
                  {formData.imageUrl && !imgFailed ? (
                    <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-9 rounded-lg overflow-hidden border border-border/60 shrink-0 bg-secondary/40">
                          <img src={formData.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{uploadedFileName || 'Ảnh cụm rạp đã chọn'}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">Tỷ lệ 16:9 • Đã tải thành công</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="h-8 px-2.5 text-xs rounded-xl gap-1 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Đổi ảnh</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearImage}
                          className="h-8 px-2 text-xs rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          fileInputRef.current?.click()
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingImage(true)
                      }}
                      onDragLeave={() => setIsDraggingImage(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingImage(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file) handleImageFile(file)
                      }}
                      className={cn(
                        'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] space-y-2',
                        isDraggingImage
                          ? 'border-primary bg-primary/10'
                          : 'border-border/80 hover:border-primary/60 bg-secondary/15 hover:bg-secondary/30'
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                        {isUploadingImage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">
                          {isUploadingImage ? 'Đang tải ảnh lên hệ thống...' : 'Nhấn để chọn ảnh từ máy'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">hoặc kéo thả tệp hình ảnh vào đây</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70">Hỗ trợ JPG, PNG, WEBP (tối đa 15MB)</span>
                    </div>
                  )}

                  {touched.imageUrl && errors.imageUrl && (
                    <p className="text-[11px] text-destructive flex items-center gap-1 pt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.imageUrl}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5 pt-1">
                <label htmlFor="theater-status" className="text-xs font-bold text-foreground">
                  Trạng thái hoạt động
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => handleChange('status', val as AdminTheaterStatus)}
                >
                  <SelectTrigger id="theater-status" className="h-10 text-xs rounded-xl bg-card border-border/70">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang hoạt động (Mở cửa bán vé bình thường)</SelectItem>
                    <SelectItem value="maintenance">Đang bảo trì cơ sở vật chất (Tạm dừng suất)</SelectItem>
                    <SelectItem value="inactive">Tạm ngưng vận hành (Đóng cửa tạm thời)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cột phải: Live Preview Image 16:9 */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-primary" />
                <span>Xem trước hình ảnh cụm rạp (16:9)</span>
              </h3>

              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border/70 bg-secondary/30 shadow-sm relative flex items-center justify-center">
                {formData.imageUrl && !imgFailed ? (
                  <img
                    src={formData.imageUrl}
                    alt="Xem trước rạp"
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <div className="p-4 text-center space-y-1 text-muted-foreground">
                    <ImageOff className="w-8 h-8 mx-auto opacity-50" />
                    <p className="text-xs">
                      {imgFailed ? 'Không thể tải ảnh xem trước' : 'Chưa có ảnh không gian rạp'}
                    </p>
                    <p className="text-[10px] opacity-75">Ảnh tỷ lệ 16:9 hiển thị trên trang cụm rạp</p>
                  </div>
                )}
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
                <span>{isEditMode ? 'Lưu thay đổi rạp' : 'Tạo cụm rạp mới'}</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* 4. Dirty Exit Confirmation Modal */}
      <AdminConfirmDialog
        isOpen={showLeaveDialog}
        title="Bạn có thay đổi chưa lưu"
        description="Bạn đã thay đổi thông tin của cụm rạp này. Nếu rời trang bây giờ, mọi thay đổi chưa lưu sẽ bị mất."
        confirmText="Rời trang không lưu"
        cancelText="Ở lại tiếp tục sửa"
        variant="destructive"
        onConfirm={() => {
          setShowLeaveDialog(false)
          navigate(isEditMode && theaterId ? `/admin/theaters/${theaterId}` : '/admin/theaters')
        }}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  )
}
