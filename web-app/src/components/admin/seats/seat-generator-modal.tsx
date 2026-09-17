import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Crown,
  Heart,
  Tv,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SeatGeneratePayload, SeatGenerateRowConfig } from '@/services/theater-api.service'
import { cn } from '@/lib/utils'

interface SeatGeneratorModalProps {
  isOpen: boolean
  auditoriumName: string
  auditoriumFormat: string
  currentTotalSeats: number
  isGenerating: boolean
  onGenerate: (payload: SeatGeneratePayload) => Promise<void>
  onClose: () => void
}

interface PresetOption {
  id: string
  name: string
  description: string
  rows: SeatGenerateRowConfig[]
}

const PRESETS: PresetOption[] = [
  {
    id: 'standard_2d_3d',
    name: 'Chuẩn 2D / 3D (8 hàng - 75 ghế)',
    description: '2 hàng Thường (20 ghế), 5 hàng VIP (50 ghế), 1 hàng Couple (5 ghế đôi)',
    rows: [
      { label: 'A', seatCount: 10, seatType: 'STANDARD' },
      { label: 'B', seatCount: 10, seatType: 'STANDARD' },
      { label: 'C', seatCount: 10, seatType: 'VIP' },
      { label: 'D', seatCount: 10, seatType: 'VIP' },
      { label: 'E', seatCount: 10, seatType: 'VIP' },
      { label: 'F', seatCount: 10, seatType: 'VIP' },
      { label: 'G', seatCount: 10, seatType: 'VIP' },
      { label: 'H', seatCount: 5, seatType: 'COUPLE' },
    ],
  },
  {
    id: 'large_imax_atmos',
    name: 'Rạp Lớn IMAX / Atmos (10 hàng - 114 ghế)',
    description: '3 hàng Thường (36 ghế), 6 hàng VIP (72 ghế), 1 hàng Couple (6 ghế đôi)',
    rows: [
      { label: 'A', seatCount: 12, seatType: 'STANDARD' },
      { label: 'B', seatCount: 12, seatType: 'STANDARD' },
      { label: 'C', seatCount: 12, seatType: 'STANDARD' },
      { label: 'D', seatCount: 12, seatType: 'VIP' },
      { label: 'E', seatCount: 12, seatType: 'VIP' },
      { label: 'F', seatCount: 12, seatType: 'VIP' },
      { label: 'G', seatCount: 12, seatType: 'VIP' },
      { label: 'H', seatCount: 12, seatType: 'VIP' },
      { label: 'J', seatCount: 12, seatType: 'VIP' },
      { label: 'K', seatCount: 6, seatType: 'COUPLE' },
    ],
  },
  {
    id: 'mini_vip_studio',
    name: 'Phòng Chiếu Nhỏ / Studio (5 hàng - 40 ghế)',
    description: '2 hàng Thường (16 ghế), 3 hàng VIP (24 ghế)',
    rows: [
      { label: 'A', seatCount: 8, seatType: 'STANDARD' },
      { label: 'B', seatCount: 8, seatType: 'STANDARD' },
      { label: 'C', seatCount: 8, seatType: 'VIP' },
      { label: 'D', seatCount: 8, seatType: 'VIP' },
      { label: 'E', seatCount: 8, seatType: 'VIP' },
    ],
  },
]

export function SeatGeneratorModal({
  isOpen,
  auditoriumName,
  auditoriumFormat,
  currentTotalSeats,
  isGenerating,
  onGenerate,
  onClose,
}: SeatGeneratorModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('standard_2d_3d')
  const [rows, setRows] = useState<SeatGenerateRowConfig[]>(PRESETS[0].rows)

  // Reset to default preset when opened
  useEffect(() => {
    if (isOpen) {
      // Pick suitable preset based on format
      if (auditoriumFormat.includes('IMAX') || auditoriumFormat.includes('Atmos')) {
        setSelectedPreset('large_imax_atmos')
        setRows(PRESETS[1].rows.map((r) => ({ ...r })))
      } else {
        setSelectedPreset('standard_2d_3d')
        setRows(PRESETS[0].rows.map((r) => ({ ...r })))
      }
    }
  }, [isOpen, auditoriumFormat])

  // Handle ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, isGenerating, onClose])

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId)
    const p = PRESETS.find((item) => item.id === presetId)
    if (p) {
      setRows(p.rows.map((r) => ({ ...r })))
    }
  }

  const handleUpdateRow = (index: number, patch: Partial<SeatGenerateRowConfig>) => {
    setSelectedPreset('custom')
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    )
  }

  const handleAddRow = () => {
    setSelectedPreset('custom')
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const usedLabels = rows.map((r) => r.label)
    const nextLabel = alphabet.find((l) => !usedLabels.includes(l)) || `R${rows.length + 1}`

    setRows((prev) => [
      ...prev,
      {
        label: nextLabel,
        seatCount: prev.length > 0 ? prev[prev.length - 1].seatCount : 10,
        seatType: 'STANDARD',
      },
    ])
  }

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return
    setSelectedPreset('custom')
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  // Summary Metrics
  const summary = useMemo(() => {
    let standard = 0
    let vip = 0
    let couple = 0
    let totalCapacity = 0

    rows.forEach((r) => {
      if (r.seatType === 'COUPLE') {
        couple += r.seatCount
        totalCapacity += r.seatCount * 2
      } else if (r.seatType === 'VIP') {
        vip += r.seatCount
        totalCapacity += r.seatCount
      } else {
        standard += r.seatCount
        totalCapacity += r.seatCount
      }
    })

    const totalPhysicalSeats = rows.reduce((acc, r) => acc + r.seatCount, 0)

    return {
      totalRows: rows.length,
      totalPhysicalSeats,
      totalCapacity,
      standard,
      vip,
      couple,
    }
  }, [rows])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rows.length === 0 || isGenerating) return

    const payload: SeatGeneratePayload = {
      rows: rows.map((r) => ({
        label: r.label.trim().toUpperCase(),
        seatCount: Math.max(1, Number(r.seatCount)),
        seatType: r.seatType,
      })),
    }

    await onGenerate(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isGenerating && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Khởi Tạo / Sinh Lại Sơ Đồ Ghế Tự Động</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Phòng chiếu <strong className="text-foreground">{auditoriumName}</strong> ({auditoriumFormat}) • Sức chứa hiện tại: {currentTotalSeats} ghế
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Lưu ý quan trọng khi sinh lại sơ đồ ghế</p>
              <p className="opacity-90 leading-relaxed">
                Hành động này sẽ xóa toàn bộ ghế cũ trong cơ sở dữ liệu và tái tạo danh sách ghế mới.
                Nếu phòng chiếu đang có suất chiếu trong tương lai, hệ thống sẽ từ chối để bảo vệ đơn vé đã đặt.
              </p>
            </div>
          </div>

          {/* 1. Chọn Mẫu Có Sẵn (Presets) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              <span>Chọn Cấu Hình Mẫu Nhanh (Preset)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESETS.map((p) => {
                const isSelected = selectedPreset === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                        : 'border-border/70 bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{p.name}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Chi Tiết Các Hàng Ghế */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-primary" />
                <span>Cấu Hình Từng Hàng Ghế ({rows.length} hàng)</span>
              </label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="h-7 text-xs rounded-lg gap-1 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm hàng</span>
              </Button>
            </div>

            <div className="border border-border/70 rounded-xl overflow-hidden bg-secondary/10">
              <div className="max-h-[260px] overflow-y-auto scrollbar-thin divide-y divide-border/50">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 px-3.5 flex items-center justify-between gap-3 text-xs hover:bg-secondary/30 transition-colors"
                  >
                    {/* Row Label */}
                    <div className="flex items-center gap-2 w-28">
                      <span className="text-[11px] font-semibold text-muted-foreground w-8">
                        #{idx + 1}
                      </span>
                      <Input
                        value={row.label}
                        onChange={(e) => handleUpdateRow(idx, { label: e.target.value.toUpperCase() })}
                        maxLength={3}
                        className="h-7 w-14 font-mono font-bold text-center uppercase bg-background"
                        placeholder="A"
                      />
                    </div>

                    {/* Seat Type */}
                    <div className="flex-1 max-w-[200px]">
                      <Select
                        value={row.seatType}
                        onValueChange={(val) =>
                          handleUpdateRow(idx, { seatType: val as 'STANDARD' | 'VIP' | 'COUPLE' })
                        }
                      >
                        <SelectTrigger className="h-7 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STANDARD">
                            <span className="flex items-center gap-1.5">
                              <span>Ghế Thường</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="VIP">
                            <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
                              <Crown className="w-3 h-3" />
                              <span>Ghế VIP</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="COUPLE">
                            <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                              <Heart className="w-3 h-3" />
                              <span>Ghế Đôi (Couple)</span>
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Seat Count */}
                    <div className="flex items-center gap-1.5 w-32 justify-center">
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={row.seatCount}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            seatCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="h-7 w-16 font-mono text-center bg-background text-xs"
                      />
                      <span className="text-[11px] text-muted-foreground">ghế</span>
                    </div>

                    {/* Delete button */}
                    <div className="w-8 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={rows.length <= 1}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer disabled:opacity-20"
                        title="Xóa hàng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Tóm Tắt Thống Kê Trước Khi Sinh */}
          <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Tổng số hàng
              </span>
              <span className="font-mono text-base font-extrabold text-foreground">
                {summary.totalRows} hàng
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Tổng ghế vật lý
              </span>
              <span className="font-mono text-base font-extrabold text-foreground">
                {summary.totalPhysicalSeats} ghế
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-primary block">
                Sức chứa bán vé
              </span>
              <span className="font-mono text-base font-extrabold text-primary">
                {summary.totalCapacity} vé
              </span>
            </div>

            <div className="space-y-0.5 text-left pl-2 border-l border-border/60 text-[11px]">
              <div className="text-muted-foreground">Thường: <strong className="text-foreground">{summary.standard}</strong></div>
              <div className="text-amber-500">VIP: <strong>{summary.vip}</strong></div>
              <div className="text-rose-500">Couple: <strong>{summary.couple} ({summary.couple * 2} chỗ)</strong></div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-xl text-xs cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isGenerating || rows.length === 0}
              className="rounded-xl text-xs gap-1.5 shadow-sm shadow-primary/30 cursor-pointer font-bold px-4"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang khởi tạo sơ đồ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Khởi tạo &amp; Lưu sơ đồ ghế</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
