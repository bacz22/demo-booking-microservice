import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Clock,
  Sparkles,
  Check,
  ChevronDown,
  RotateCcw,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface OperatingHoursPickerProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
}

const COMMON_PRESETS = [
  { label: '08:30 - 23:30', desc: 'TTTM phổ biến', open: '08:30', close: '23:30' },
  { label: '08:00 - 24:00', desc: 'Tiêu chuẩn CineBook', open: '08:00', close: '24:00' },
  { label: '09:00 - 01:00', desc: 'Suất khuya đêm', open: '09:00', close: '01:00' },
  { label: '08:00 - 02:00', desc: 'Cuối tuần & Lễ', open: '08:00', close: '02:00' },
]

const HOURS_LIST = Array.from({ length: 25 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/**
 * Phân tích chuỗi "08:30 - 23:30 (Hàng ngày)" thành { open, close, note }
 */
function parseOperatingHours(raw?: string): { open: string; close: string; note: string } {
  if (!raw || !raw.trim()) {
    return { open: '08:30', close: '23:30', note: '' }
  }

  let mainPart = raw.trim()
  let note = ''

  const noteMatch = mainPart.match(/\((.*?)\)/)
  if (noteMatch) {
    note = noteMatch[1].trim()
    mainPart = mainPart.replace(/\(.*?\)/, '').trim()
  }

  const parts = mainPart.split(/[-~–]|đến|to/i).map((s) => s.trim())
  let open = parts[0] || '08:30'
  let close = parts[1] || '23:30'

  if (/^\d{1,2}:\d{2}$/.test(open)) {
    const [h, m] = open.split(':')
    open = `${h.padStart(2, '0')}:${m}`
  } else if (/^\d{1,2}$/.test(open)) {
    open = `${open.padStart(2, '0')}:00`
  }

  if (/^\d{1,2}:\d{2}$/.test(close)) {
    const [h, m] = close.split(':')
    close = `${h.padStart(2, '0')}:${m}`
  } else if (/^\d{1,2}$/.test(close)) {
    close = `${close.padStart(2, '0')}:00`
  }

  return { open, close, note }
}

export function OperatingHoursPicker({
  id,
  value = '',
  onChange,
  placeholder = 'Ví dụ: 08:30 - 23:30 (Hàng ngày)',
  className,
  disabled = false,
  error,
}: OperatingHoursPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'open' | 'close'>('open')

  // Parse state từ value hiện tại
  const parsed = useMemo(() => parseOperatingHours(value), [value])
  const [openHour, setOpenHour] = useState(() => parsed.open.split(':')[0] || '08')
  const [openMin, setOpenMin] = useState(() => parsed.open.split(':')[1] || '30')
  const [closeHour, setCloseHour] = useState(() => parsed.close.split(':')[0] || '23')
  const [closeMin, setCloseMin] = useState(() => parsed.close.split(':')[1] || '30')
  const [selectedNote, setSelectedNote] = useState(parsed.note)

  // Input text state để cho phép nhập trực tiếp
  const [inputText, setInputText] = useState(value || '')

  const openHoursRef = useRef<HTMLDivElement>(null)
  const closeHoursRef = useRef<HTMLDivElement>(null)
  const openMinutesRef = useRef<HTMLDivElement>(null)
  const closeMinutesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Đồng bộ khi value bên ngoài thay đổi
  useEffect(() => {
    setInputText(value || '')
    const p = parseOperatingHours(value)
    const [oh, om] = p.open.split(':')
    const [ch, cm] = p.close.split(':')
    setOpenHour(oh || '08')
    setOpenMin(om || '30')
    setCloseHour(ch || '23')
    setCloseMin(cm || '30')
    setSelectedNote(p.note)
  }, [value])

  // Cuộn đến giờ & phút được chọn khi mở popover
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const hourRef = activeTab === 'open' ? openHoursRef.current : closeHoursRef.current
        const selHour = hourRef?.querySelector('[data-active="true"]') as HTMLElement | null
        if (selHour && hourRef) {
          hourRef.scrollTop = selHour.offsetTop - hourRef.offsetTop - 30
        }

        const minRef = activeTab === 'open' ? openMinutesRef.current : closeMinutesRef.current
        const selMin = minRef?.querySelector('[data-active="true"]') as HTMLElement | null
        if (selMin && minRef) {
          minRef.scrollTop = selMin.offsetTop - minRef.offsetTop - 30
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, activeTab])

  // Ghép chuỗi hoàn chỉnh
  const currentFormatted = useMemo(() => {
    const o = `${openHour.padStart(2, '0')}:${openMin.padStart(2, '0')}`
    const c = `${closeHour.padStart(2, '0')}:${closeMin.padStart(2, '0')}`
    const n = selectedNote ? ` (${selectedNote})` : ''
    return `${o} - ${c}${n}`
  }, [openHour, openMin, closeHour, closeMin, selectedNote])

  // Xử lý áp dụng
  const handleApply = (customVal?: string) => {
    const finalVal = customVal !== undefined ? customVal : currentFormatted
    setInputText(finalVal)
    onChange?.(finalVal)
    setIsOpen(false)
  }

  // Chọn preset nhanh
  const handleSelectPreset = (preset: (typeof COMMON_PRESETS)[0]) => {
    const [oh, om] = preset.open.split(':')
    const [ch, cm] = preset.close.split(':')
    setOpenHour(oh || '08')
    setOpenMin(om || '30')
    setCloseHour(ch || '23')
    setCloseMin(cm || '30')

    const n = selectedNote ? ` (${selectedNote})` : ''
    const formatted = `${preset.open} - ${preset.close}${n}`
    handleApply(formatted)
  }

  // Nhập trực tiếp
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value
    setInputText(txt)
    onChange?.(txt)

    if (txt.includes('-')) {
      const p = parseOperatingHours(txt)
      const [oh, om] = p.open.split(':')
      const [ch, cm] = p.close.split(':')
      if (oh) setOpenHour(oh)
      if (om) setOpenMin(om)
      if (ch) setCloseHour(ch)
      if (cm) setCloseMin(cm)
      setSelectedNote(p.note)
    }
  }

  // Xóa trắng
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInputText('')
    onChange?.('')
    setOpenHour('08')
    setOpenMin('30')
    setCloseHour('23')
    setCloseMin('30')
    setSelectedNote('')
  }

  // Đặt lại mặc định
  const handleReset = () => {
    setOpenHour('08')
    setOpenMin('30')
    setCloseHour('23')
    setCloseMin('30')
    setSelectedNote('')
    handleApply('08:30 - 23:30')
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div
            onClick={() => {
              if (!disabled) {
                setIsOpen(true)
                inputRef.current?.focus()
              }
            }}
            className={cn(
              'flex items-center w-full h-10 rounded-xl border bg-card text-xs font-mono transition-all cursor-text',
              error
                ? 'border-destructive ring-1 ring-destructive/30'
                : 'border-border/70 hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
              disabled && 'opacity-60 cursor-not-allowed bg-secondary/30',
              isOpen && 'border-primary ring-2 ring-primary/20'
            )}
          >
            {/* Nút Clock Icon */}
            <div
              className="pl-3 pr-2 py-2 text-primary hover:text-primary/80 transition-colors select-none cursor-pointer shrink-0"
              title="Khung giờ hoạt động"
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled) {
                  setIsOpen((prev) => !prev)
                }
              }}
            >
              <Clock className="w-4 h-4" />
            </div>

            {/* Input text cho phép vừa gõ vừa chọn */}
            <input
              ref={inputRef}
              id={id}
              type="text"
              disabled={disabled}
              value={inputText}
              onChange={handleInputChange}
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled) setIsOpen(true)
              }}
              onFocus={() => {
                if (!disabled) setIsOpen(true)
              }}
              placeholder={placeholder}
              className="flex-1 min-w-0 bg-transparent py-2 text-xs font-mono font-medium text-foreground placeholder:text-muted-foreground/60 placeholder:font-sans focus:outline-none cursor-text"
            />

            {/* Actions: Nút Clear & Chevron */}
            <div className="flex items-center gap-1 pr-2 shrink-0">
              {inputText && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                  title="Xóa khung giờ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!disabled) setIsOpen((prev) => !prev)
                }}
                className="p-1 text-muted-foreground hover:text-primary rounded-md transition-colors cursor-pointer"
                title={isOpen ? 'Đóng bộ chọn' : 'Mở bộ chọn khung giờ'}
              >
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    isOpen && 'rotate-180 text-primary'
                  )}
                />
              </button>
            </div>
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[360px] sm:w-[380px] p-4 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl space-y-4 text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Chọn Khung Giờ Hoạt Động</h4>
                <p className="text-[10px] text-muted-foreground">Giờ mở cửa &amp; đóng cửa cụm rạp</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
              title="Đặt về 08:30 - 23:30"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Mặc định</span>
            </button>
          </div>

          {/* Time Range Preview Card */}
          <div className="p-3 rounded-xl border border-border/60 bg-secondary/30 flex items-center justify-between">
            <div
              onClick={() => setActiveTab('open')}
              className={cn(
                'flex-1 text-center p-2 rounded-lg cursor-pointer transition-all border',
                activeTab === 'open'
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                  : 'border-transparent hover:bg-secondary/60'
              )}
            >
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Sun className="w-3 h-3" />
                <span>Giờ mở cửa</span>
              </div>
              <div className="text-sm font-mono font-bold text-foreground mt-0.5">
                {openHour}:{openMin}
              </div>
            </div>

            <div className="px-2 text-muted-foreground font-mono text-xs font-bold">➜</div>

            <div
              onClick={() => setActiveTab('close')}
              className={cn(
                'flex-1 text-center p-2 rounded-lg cursor-pointer transition-all border',
                activeTab === 'close'
                  ? 'bg-rose-500/10 border-rose-500/40 shadow-xs'
                  : 'border-transparent hover:bg-secondary/60'
              )}
            >
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                <Moon className="w-3 h-3" />
                <span>Giờ đóng cửa</span>
              </div>
              <div className="text-sm font-mono font-bold text-foreground mt-0.5">
                {closeHour}:{closeMin}
              </div>
            </div>
          </div>

          {/* Time Picker Columns for Active Tab */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {activeTab === 'open' ? 'Chọn Giờ Mở Cửa' : 'Chọn Giờ Đóng Cửa'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('open')}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold transition-all',
                    activeTab === 'open'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Mở cửa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('close')}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold transition-all',
                    activeTab === 'close'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Đóng cửa
                </button>
              </div>
            </div>

            {/* Grid 2 Columns: Hours & Minutes */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl border border-border/60 bg-secondary/20">
              {/* Giờ (00 - 24) */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground text-center pb-1 mb-1 border-b border-border/40">
                  Giờ (00 - 24)
                </div>
                <div
                  ref={activeTab === 'open' ? openHoursRef : closeHoursRef}
                  className="max-h-36 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
                >
                  {HOURS_LIST.map((h) => {
                    const isSel = activeTab === 'open' ? h === openHour : h === closeHour
                    return (
                      <button
                        key={h}
                        type="button"
                        data-active={isSel ? 'true' : undefined}
                        onClick={() => {
                          if (activeTab === 'open') {
                            setOpenHour(h)
                          } else {
                            setCloseHour(h)
                          }
                        }}
                        className={cn(
                          'w-full py-1 text-center rounded-lg text-xs font-mono transition-all select-none cursor-pointer',
                          isSel
                            ? activeTab === 'open'
                              ? 'bg-emerald-500 text-white font-bold shadow-xs'
                              : 'bg-rose-500 text-white font-bold shadow-xs'
                            : 'hover:bg-secondary text-foreground font-medium'
                        )}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Phút (00 - 59) */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground text-center pb-1 mb-1 border-b border-border/40">
                  Phút (00 - 59)
                </div>
                <div
                  ref={activeTab === 'open' ? openMinutesRef : closeMinutesRef}
                  className="max-h-36 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
                >
                  {MINUTES_LIST.map((m) => {
                    const isSel = activeTab === 'open' ? m === openMin : m === closeMin
                    return (
                      <button
                        key={m}
                        type="button"
                        data-active={isSel ? 'true' : undefined}
                        onClick={() => {
                          if (activeTab === 'open') {
                            setOpenMin(m)
                          } else {
                            setCloseMin(m)
                          }
                        }}
                        className={cn(
                          'w-full py-1.5 text-center rounded-lg text-xs font-mono transition-all select-none cursor-pointer',
                          isSel
                            ? activeTab === 'open'
                              ? 'bg-emerald-500 text-white font-bold shadow-xs'
                              : 'bg-rose-500 text-white font-bold shadow-xs'
                            : 'hover:bg-secondary text-foreground font-medium'
                        )}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Khung giờ phổ biến:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {COMMON_PRESETS.map((preset) => {
                const isActive =
                  openHour === preset.open.split(':')[0] &&
                  openMin === preset.open.split(':')[1] &&
                  closeHour === preset.close.split(':')[0] &&
                  closeMin === preset.close.split(':')[1]
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between',
                      isActive
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                        : 'bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                    )}
                  >
                    <div>
                      <div className="text-[11px] font-mono font-bold leading-tight">{preset.label}</div>
                      <div className="text-[9px] opacity-75">{preset.desc}</div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
            <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[170px]" title={currentFormatted}>
              {currentFormatted}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 px-2.5 text-xs rounded-xl"
              >
                Đóng
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleApply()}
                className="h-8 px-3 text-xs rounded-xl font-bold gap-1 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Áp dụng</span>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-[11px] text-destructive pt-1">{error}</p>}
    </div>
  )
}

export default OperatingHoursPicker
