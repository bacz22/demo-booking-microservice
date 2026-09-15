import React, { useState, useEffect } from 'react'
import { X, Tv, Loader2, Info, Check } from 'lucide-react'
import type {
  AdminAuditorium,
  AuditoriumFormat,
  AuditoriumStatus,
  AuditoriumFormData,
} from '@/types/admin-theater'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AuditoriumModalProps {
  isOpen: boolean
  auditorium?: AdminAuditorium | null
  theaterName: string
  onSave: (data: AuditoriumFormData) => Promise<void>
  onClose: () => void
}

const AUDITORIUM_FORMATS: Array<{ value: AuditoriumFormat; label: string; desc: string }> = [
  { value: '2D', label: '2D Digital Chuẩn', desc: 'Định dạng phổ biến, hình ảnh kỹ thuật số sắc nét' },
  { value: '3D', label: '3D Laser Digital', desc: 'Trải nghiệm không gian 3 chiều sống động với kính lọc sắc' },
  { value: 'IMAX Laser', label: 'IMAX Laser Thế Hệ Mới', desc: 'Màn chiếu siêu đại, độ tương phản cực đỉnh và âm thanh đa tầng' },
  { value: '4DX', label: '4DX Dynamic Motion', desc: 'Ghế chuyển động đa hướng kết hợp hiệu ứng gió, nước, khói, hương thơm' },
  { value: 'ScreenX', label: 'ScreenX 270° Toàn Cảnh', desc: 'Màn hình chiếu 3 mặt trải rộng 270 độ bao quát tầm nhìn' },
  { value: 'Dolby Atmos', label: 'Dolby Atmos Đa Chiều', desc: 'Hệ thống âm thanh vòm đỉnh cao định vị từng nguồn phát' },
]

export function AuditoriumModal({
  isOpen,
  auditorium,
  theaterName,
  onSave,
  onClose,
}: AuditoriumModalProps) {
  const isEdit = Boolean(auditorium)

  const [formData, setFormData] = useState<AuditoriumFormData>({
    name: '',
    format: '2D',
    status: 'active',
  })
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (auditorium) {
        setFormData({
          name: auditorium.name,
          format: auditorium.format,
          status: auditorium.status,
        })
      } else {
        setFormData({
          name: '',
          format: '2D',
          status: 'active',
        })
      }
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, auditorium])

  // Handle ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const validate = (): boolean => {
    const errs: { name?: string } = {}
    if (!formData.name.trim()) {
      errs.name = 'Vui lòng nhập tên phòng chiếu'
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Tên phòng chiếu phải có ít nhất 2 ký tự'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsSubmitting(true)
      await onSave(formData)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auditorium-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 id="auditorium-modal-title" className="text-base font-bold text-foreground">
                {isEdit ? 'Chỉnh Sửa Phòng Chiếu' : 'Thêm Phòng Chiếu Mới'}
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {theaterName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Room Name */}
          <div className="space-y-1.5">
            <label htmlFor="aud-name" className="text-xs font-bold text-foreground flex items-center gap-1">
              <span>Tên phòng chiếu</span>
              <span className="text-destructive">*</span>
            </label>
            <Input
              id="aud-name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors({})
              }}
              placeholder="Ví dụ: Phòng 01 — IMAX Laser, Phòng 02..."
              error={errors.name}
              className="h-10 text-xs rounded-xl"
              autoFocus
              required
            />
          </div>

          {/* Technology Format */}
          <div className="space-y-1.5">
            <label htmlFor="aud-format" className="text-xs font-bold text-foreground flex items-center gap-1">
              <span>Định dạng công nghệ chiếu</span>
              <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.format}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, format: val as AuditoriumFormat }))}
            >
              <SelectTrigger id="aud-format" className="h-10 text-xs rounded-xl bg-card border-border/70">
                <SelectValue placeholder="Chọn định dạng công nghệ" />
              </SelectTrigger>
              <SelectContent>
                {AUDITORIUM_FORMATS.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {AUDITORIUM_FORMATS.find((f) => f.value === formData.format)?.desc}
            </p>
          </div>

          {/* Operational Status */}
          <div className="space-y-1.5">
            <label htmlFor="aud-status" className="text-xs font-bold text-foreground">
              Trạng thái vận hành
            </label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val as AuditoriumStatus }))}
            >
              <SelectTrigger id="aud-status" className="h-10 text-xs rounded-xl bg-card border-border/70">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang hoạt động (Sẵn sàng mở suất chiếu)</SelectItem>
                <SelectItem value="maintenance">Đang bảo trì thiết bị / ghế</SelectItem>
                <SelectItem value="inactive">Tạm ngưng vận hành</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Derived totalSeats info box */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Số lượng ghế ngồi:</span>
              </span>
              <span className="font-mono font-bold text-foreground bg-card/80 px-2 py-0.5 rounded-md border border-border/60">
                {isEdit && auditorium ? `${auditorium.totalSeats} ghế` : 'Tính từ Sơ đồ ghế'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Theo quy chuẩn hệ thống, số ghế của phòng chiếu được tính tự động dựa trên{' '}
              <strong className="text-foreground">Sơ đồ ghế (Seat Layout)</strong> thực tế và không cho phép
              chỉnh sửa thủ công trực tiếp để tránh xung đột dữ liệu đặt vé.
            </p>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs gap-1.5 shadow-sm shadow-primary/30 cursor-pointer font-bold px-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Cập nhật phòng' : 'Tạo phòng chiếu'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
