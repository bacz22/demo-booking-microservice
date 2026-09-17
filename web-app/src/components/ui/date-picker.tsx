import React, { useState, useRef, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { useFormFieldContext } from '@/components/ui/form-field-context'
import { cn } from '@/lib/utils'

// ====================================================
// HELPERS
// ====================================================
const MONTHS_VN = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

const DAYS_HEADER_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function formatDateToVN(isoDateStr?: string): string {
  if (!isoDateStr) return ''
  const parts = isoDateStr.split('-')
  if (parts.length !== 3) return isoDateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function parseISODate(isoStr?: string): Date | null {
  if (!isoStr) return null
  const [y, m, d] = isoStr.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toISODateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function validateAndFormatISO(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2100) return null
  if (m < 1 || m > 12) return null
  const maxDay = new Date(y, m, 0).getDate()
  if (d < 1 || d > maxDay) return null
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return iso
}

function parseDateInput(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // 1. Format: DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10)
    const m = parseInt(dmyMatch[2], 10)
    const y = parseInt(dmyMatch[3], 10)
    return validateAndFormatISO(y, m, d)
  }

  // 2. Format: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/)
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10)
    const m = parseInt(ymdMatch[2], 10)
    const d = parseInt(ymdMatch[3], 10)
    return validateAndFormatISO(y, m, d)
  }

  // 3. Format: 8 continuous digits: DDMMYYYY e.g. 20051990, 22112004
  const digits8 = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (digits8) {
    const d = parseInt(digits8[1], 10)
    const m = parseInt(digits8[2], 10)
    const y = parseInt(digits8[3], 10)
    return validateAndFormatISO(y, m, d)
  }

  return null
}

function isDateDisabled(d: Date, min?: string, max?: string): boolean {
  const iso = toISODateString(d)
  if (min && iso < min) return true
  if (max && iso > max) return true
  return false
}

// ====================================================
// 1. DATEPICKER COMPONENT
// ====================================================
export interface DatePickerProps {
  /** Giá trị ngày định dạng chuẩn 'YYYY-MM-DD' (vd: '2004-11-22') */
  value?: string
  /** Giá trị mặc định khi không truyền value */
  defaultValue?: string
  /** Callback khi người dùng chọn ngày hoặc xóa ngày */
  onChange?: (dateString: string) => void
  /** Placeholder hiển thị khi chưa chọn ngày */
  placeholder?: string
  /** Ngày nhỏ nhất cho phép chọn 'YYYY-MM-DD' */
  minDate?: string
  /** Ngày lớn nhất cho phép chọn 'YYYY-MM-DD' (vd: ngày sinh không thể ở tương lai) */
  maxDate?: string
  /** Bật/tắt trạng thái vô hiệu hóa */
  disabled?: boolean
  /** Hiển thị trạng thái viền đỏ lỗi */
  error?: boolean
  /** Id cho input/form field accessibility */
  id?: string
  /** ClassName tùy biến cho trigger input */
  className?: string
  /** Năm bắt đầu trong danh sách chọn nhanh */
  fromYear?: number
  /** Năm kết thúc trong danh sách chọn nhanh */
  toYear?: number
  /** Cho phép xóa nhanh giá trị */
  clearable?: boolean
  /** Tên trường form */
  name?: string
  /**
   * Controlled open state — dùng khi cần điều phối nhiều picker cùng lúc
   * (vd: date-range với 2 DatePicker để đảm bảo chỉ 1 picker mở tại một thời điểm)
   */
  open?: boolean
  /** Callback khi trạng thái mở thay đổi (dùng kèm với `open`) */
  onOpenChange?: (open: boolean) => void
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  defaultValue,
  onChange,
  placeholder = 'DD/MM/YYYY',
  minDate,
  maxDate,
  disabled = false,
  error: propError = false,
  id: propId,
  className,
  fromYear = 1920,
  toYear = new Date().getFullYear(),
  clearable = true,
  name,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const fieldContext = useFormFieldContext()
  const id = propId || fieldContext?.id
  const error = Boolean(propError || fieldContext?.hasError)

  const [internalVal, setInternalVal] = useState(defaultValue || '')
  const [internalOpen, setInternalOpen] = useState(false)

  // Nếu truyền prop `open` thì dùng controlled mode, ngược lại tự quản lý
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = (open: boolean) => {
    if (!isControlled) setInternalOpen(open)
    controlledOnOpenChange?.(open)
  }

  const selectedDateStr = value !== undefined ? value : internalVal
  const selectedDateObj = parseISODate(selectedDateStr)

  const [inputText, setInputText] = useState(
    selectedDateStr ? formatDateToVN(selectedDateStr) : ''
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calendar view (month & year)
  const initialYear = selectedDateObj ? selectedDateObj.getFullYear() : new Date().getFullYear()
  const initialMonth = selectedDateObj ? selectedDateObj.getMonth() : new Date().getMonth()
  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  // Custom Month & Year dropdown menus
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false)
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false)
  const monthMenuRef = useRef<HTMLDivElement>(null)
  const yearMenuRef = useRef<HTMLDivElement>(null)
  const activeYearRef = useRef<HTMLButtonElement>(null)

  // Đồng bộ với value prop theo chuẩn React 19
  const [prevValue, setPrevValue] = useState(value)
  if (prevValue !== value) {
    setPrevValue(value)
    if (value !== undefined) {
      setInternalVal(value)
      setInputText(value ? formatDateToVN(value) : '')
      if (value) {
        const d = parseISODate(value)
        if (d) {
          setViewYear(d.getFullYear())
          setViewMonth(d.getMonth())
        }
      }
    }
  }



  // Handle click outside sub-menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthMenuRef.current && !monthMenuRef.current.contains(e.target as Node)) {
        setIsMonthMenuOpen(false)
      }
      if (yearMenuRef.current && !yearMenuRef.current.contains(e.target as Node)) {
        setIsYearMenuOpen(false)
      }
    }
    if (isMonthMenuOpen || isYearMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMonthMenuOpen, isYearMenuOpen])

  // Auto scroll year to selected year
  useEffect(() => {
    if (isYearMenuOpen && activeYearRef.current) {
      activeYearRef.current.scrollIntoView({ block: 'center' })
    }
  }, [isYearMenuOpen])

  // Chọn ngày từ calendar
  const handleSelectDate = (d: Date) => {
    const iso = toISODateString(d)
    setInternalVal(iso)
    setInputText(formatDateToVN(iso))
    onChange?.(iso)
    setIsOpen(false)
  }

  // Xóa ngày
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInternalVal('')
    setInputText('')
    onChange?.('')
    inputRef.current?.focus()
  }

  // Nhập liệu trực tiếp từ bàn phím
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setInputText(text)

    if (!text.trim()) {
      setInternalVal('')
      onChange?.('')
      return
    }

    const iso = parseDateInput(text)
    if (iso && !isDateDisabled(new Date(iso), minDate, maxDate)) {
      setInternalVal(iso)
      onChange?.(iso)
      const d = parseISODate(iso)
      if (d) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
      // Nếu nhập 8 chữ số liên tục (vd: 22112004), tự động format ngay thành 22/11/2004
      if (/^\d{8}$/.test(text.trim())) {
        setInputText(formatDateToVN(iso))
      }
    }
  }

  // Khi click ra ngoài ô input (blur), chuẩn hóa định dạng
  const handleInputBlur = (e: React.FocusEvent) => {
    if (
      e.relatedTarget &&
      (e.relatedTarget as HTMLElement).closest('[data-radix-popper-content-wrapper]')
    ) {
      return
    }

    if (!inputText.trim()) {
      setInternalVal('')
      onChange?.('')
      return
    }

    const iso = parseDateInput(inputText)
    if (iso && !isDateDisabled(new Date(iso), minDate, maxDate)) {
      setInputText(formatDateToVN(iso))
      setInternalVal(iso)
      if (iso !== selectedDateStr) {
        onChange?.(iso)
      }
    } else {
      if (selectedDateStr) {
        setInputText(formatDateToVN(selectedDateStr))
      } else {
        setInputText('')
        setInternalVal('')
        onChange?.('')
      }
    }
  }

  // Xử lý phím Enter / Escape
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const iso = parseDateInput(inputText)
      if (iso && !isDateDisabled(new Date(iso), minDate, maxDate)) {
        setInputText(formatDateToVN(iso))
        setInternalVal(iso)
        onChange?.(iso)
        setIsOpen(false)
        inputRef.current?.blur()
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Chọn ngày hôm nay
  const handleSetToday = () => {
    const today = new Date()
    if (!isDateDisabled(today, minDate, maxDate)) {
      setViewYear(today.getFullYear())
      setViewMonth(today.getMonth())
      handleSelectDate(today)
    }
  }

  // Chuyển tháng trước
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => prev - 1)
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  // Chuyển tháng sau
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => prev + 1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6 // Chủ nhật = 6

  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const calendarDays: {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isDisabled: boolean
  }[] = []

  // Prev month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i)
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
      isSelected: selectedDateObj ? toISODateString(d) === selectedDateStr : false,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  // Current month days
  const todayStr = toISODateString(new Date())
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewYear, viewMonth, day)
    const iso = toISODateString(d)
    calendarDays.push({
      date: d,
      isCurrentMonth: true,
      isToday: iso === todayStr,
      isSelected: iso === selectedDateStr,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  // Next month padding to fill 35 or 42 cells
  const remainingCells = (7 - (calendarDays.length % 7)) % 7
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(viewYear, viewMonth + 1, day)
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
      isSelected: selectedDateObj ? toISODateString(d) === selectedDateStr : false,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  // Danh sách các năm cho selector
  const yearList = React.useMemo(() => {
    const years: number[] = []
    for (let y = toYear; y >= fromYear; y--) {
      years.push(y)
    }
    return years
  }, [fromYear, toYear])

  return (
    <div className={cn('relative w-full', className)}>
      {/* Hidden input để tương thích form submission */}
      {name && <input type="hidden" name={name} value={selectedDateStr || ''} />}

      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            setIsMonthMenuOpen(false)
            setIsYearMenuOpen(false)
          }
        }}
      >
        <PopoverAnchor asChild>
          <div
            ref={containerRef}
            onClick={() => {
              if (!disabled) {
                setIsOpen(true)
                inputRef.current?.focus()
              }
            }}
            className={cn(
              'w-full h-10 flex items-center justify-between gap-2 rounded-xl border bg-background/60 px-3.5 text-sm text-foreground shadow-xs transition-all duration-150 cursor-text',
              'hover:border-border hover:bg-background/80',
              isOpen && 'border-primary ring-2 ring-primary/25',
              error
                ? 'border-destructive ring-1 ring-destructive/30 bg-destructive/5'
                : 'border-border/60',
              disabled && 'opacity-50 cursor-not-allowed bg-muted/40 border-border/40'
            )}
          >
            <input
              ref={inputRef}
              id={id}
              type="text"
              value={inputText}
              disabled={disabled}
              onChange={handleInputChange}
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled) {
                  setIsOpen(true)
                }
              }}
              onFocus={() => {
                if (!disabled) setIsOpen(true)
              }}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/60 text-sm font-medium"
            />

            <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
              {clearable && selectedDateStr && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:text-foreground rounded-full hover:bg-secondary cursor-pointer transition-colors"
                  title="Xóa ngày đã chọn"
                  aria-label="Xóa ngày đã chọn"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!disabled) {
                    setIsOpen(!isOpen)
                  }
                }}
                className="p-1 hover:text-primary rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                title="Mở lịch chọn ngày"
                aria-label="Mở lịch chọn ngày"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          onPointerDownOutside={(e) => {
            if (containerRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            if (containerRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
          className="z-50 w-80 p-4 rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150 text-foreground"
        >
          {/* Header Month / Year controls */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40 relative">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-tight text-foreground">
              {/* Custom Month Dropdown */}
              <div className="relative" ref={monthMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsMonthMenuOpen((prev) => !prev)
                    setIsYearMenuOpen(false)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none border',
                    isMonthMenuOpen
                      ? 'bg-primary/15 border-primary/40 text-primary ring-2 ring-primary/20'
                      : 'border-border/50 bg-secondary/50 hover:bg-secondary text-foreground'
                  )}
                >
                  <span>{MONTHS_VN[viewMonth]}</span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform opacity-70',
                      isMonthMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isMonthMenuOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-36 max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-card/98 shadow-xl p-1 z-30 animate-in fade-in-0 zoom-in-95 duration-100 divide-y divide-border/20 backdrop-blur-md">
                    {MONTHS_VN.map((mName, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setViewMonth(idx)
                          setIsMonthMenuOpen(false)
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer',
                          viewMonth === idx
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-secondary text-foreground'
                        )}
                      >
                        <span>{mName}</span>
                        {viewMonth === idx && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Year Dropdown */}
              <div className="relative" ref={yearMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsYearMenuOpen((prev) => !prev)
                    setIsMonthMenuOpen(false)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none border',
                    isYearMenuOpen
                      ? 'bg-primary/15 border-primary/40 text-primary ring-2 ring-primary/20'
                      : 'border-border/50 bg-secondary/50 hover:bg-secondary text-foreground'
                  )}
                >
                  <span>{viewYear}</span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform opacity-70',
                      isYearMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isYearMenuOpen && (
                  <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-28 max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-card/98 shadow-xl p-1 z-30 animate-in fade-in-0 zoom-in-95 duration-100 backdrop-blur-md">
                    {yearList.map((y) => (
                      <button
                        key={y}
                        ref={y === viewYear ? activeYearRef : undefined}
                        type="button"
                        onClick={() => {
                          setViewYear(y)
                          setIsYearMenuOpen(false)
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer',
                          viewYear === y
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-secondary text-foreground'
                        )}
                      >
                        <span>{y}</span>
                        {viewYear === y && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_HEADER_VN.map((dayName, idx) => (
              <div
                key={dayName}
                className={cn(
                  'text-[11px] font-semibold py-1 select-none',
                  idx >= 5 ? 'text-amber-500 font-bold' : 'text-muted-foreground'
                )}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((item, idx) => {
              const dayNum = item.date.getDate()
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => !item.isDisabled && handleSelectDate(item.date)}
                  className={cn(
                    'h-8 w-8 mx-auto flex items-center justify-center text-xs rounded-lg transition-all relative select-none font-medium cursor-pointer',
                    item.isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30 scale-105 z-10'
                      : item.isCurrentMonth
                      ? 'text-foreground hover:bg-primary/15 hover:text-primary'
                      : 'text-muted-foreground/40 hover:bg-secondary/40',
                    item.isDisabled && 'opacity-25 cursor-not-allowed hover:bg-transparent text-muted-foreground',
                    item.isToday && !item.isSelected && 'font-bold text-primary border border-primary/40'
                  )}
                >
                  <span>{dayNum}</span>
                  {item.isToday && !item.isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer Quick Action Buttons */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40 text-xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Hôm nay
            </button>
            {selectedDateStr && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-destructive font-medium cursor-pointer"
              >
                Xóa chọn
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ====================================================
// 2. TIMEPICKER COMPONENT (00-23h & 00-59m with auto-scroll)
// ====================================================
export interface TimePickerProps {
  value?: string // HH:mm (24h)
  defaultValue?: string
  onChange?: (time: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Trạng thái mở điều phối từ bên ngoài */
  open?: boolean
  /** Callback khi thay đổi trạng thái mở */
  onOpenChange?: (open: boolean) => void
}

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const QUICK_TIME_PRESETS = [
  { label: '08:00 (Sáng sớm)', time: '08:00' },
  { label: '09:30 (Khung giờ vàng)', time: '09:30' },
  { label: '14:00 (Đầu giờ chiều)', time: '14:00' },
  { label: '18:00 (Tan sở)', time: '18:00' },
  { label: '20:30 (Buổi tối)', time: '20:30' },
]

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  defaultValue,
  onChange,
  placeholder = 'Chọn giờ...',
  disabled = false,
  error = false,
  size = 'md',
  className,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalVal, setInternalVal] = useState(defaultValue || '')
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = (open: boolean) => {
    if (!isControlled) setInternalOpen(open)
    controlledOnOpenChange?.(open)
  }

  // Đồng bộ với value prop
  const [prevValue, setPrevValue] = useState(value)
  if (prevValue !== value) {
    setPrevValue(value)
    if (value !== undefined) {
      setInternalVal(value)
    }
  }

  const hoursContainerRef = useRef<HTMLDivElement>(null)
  const minutesContainerRef = useRef<HTMLDivElement>(null)

  const selectedTime = value !== undefined ? value : internalVal
  const [selectedHour, selectedMinute] = selectedTime.includes(':')
    ? selectedTime.split(':')
    : ['09', '30']

  // Auto scroll to active hour & minute when opening popover
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const selHourEl = hoursContainerRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
        if (selHourEl && hoursContainerRef.current) {
          hoursContainerRef.current.scrollTop = selHourEl.offsetTop - hoursContainerRef.current.offsetTop - 40
        }

        const selMinEl = minutesContainerRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
        if (selMinEl && minutesContainerRef.current) {
          minutesContainerRef.current.scrollTop = selMinEl.offsetTop - minutesContainerRef.current.offsetTop - 40
        }
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [isOpen, selectedHour, selectedMinute])

  const handleSelectTime = (h: string, m: string) => {
    const t = `${h}:${m}`
    setInternalVal(t)
    onChange?.(t)
  }

  const handleSelectPreset = (t: string) => {
    setInternalVal(t)
    onChange?.(t)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInternalVal('')
    onChange?.('')
  }

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    md: 'h-10 px-3.5 text-sm rounded-xl',
    lg: 'h-11 px-4 text-base rounded-xl',
  }[size]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(true)}
          className={cn(
            'w-full flex items-center justify-between gap-2 border bg-background/60 text-foreground select-none cursor-pointer transition-colors',
            isOpen && 'border-primary ring-2 ring-primary/25',
            error
              ? 'border-destructive ring-1 ring-destructive/30 bg-destructive/5'
              : 'border-border/60 hover:border-border',
            disabled && 'opacity-50 cursor-not-allowed bg-muted/40 border-border/40',
            sizeClasses,
            className
          )}
        >
          <span className={cn('truncate font-medium font-mono', !selectedTime && 'text-muted-foreground font-sans font-normal')}>
            {selectedTime ? selectedTime : placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
            {selectedTime && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 hover:text-foreground rounded cursor-pointer transition-colors"
                title="Xóa giờ đã chọn"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-50 w-72 p-3.5 rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 text-foreground"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
            Chọn Thời Gian (24H)
          </div>
          <div className="text-xs font-mono font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-md border border-primary/30">
            {selectedHour}:{selectedMinute}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border border-border/60 rounded-xl p-1.5 bg-secondary/30">
          {/* Hours Column (00 - 23) */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground text-center pb-1.5 mb-1 border-b border-border/40">
              Giờ (00 - 23)
            </div>
            <div
              ref={hoursContainerRef}
              className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
            >
              {HOURS_LIST.map((h) => {
                const isSel = h === selectedHour
                return (
                  <button
                    key={h}
                    type="button"
                    data-selected={isSel ? 'true' : undefined}
                    onClick={() => handleSelectTime(h, selectedMinute)}
                    className={cn(
                      'w-full py-1.5 text-center rounded-lg text-xs font-mono transition-all select-none cursor-pointer',
                      isSel
                        ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 scale-[1.02]'
                        : 'hover:bg-secondary text-foreground font-medium'
                    )}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Minutes Column (00 - 59 Full List) */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground text-center pb-1.5 mb-1 border-b border-border/40">
              Phút (00 - 59)
            </div>
            <div
              ref={minutesContainerRef}
              className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
            >
              {MINUTES_LIST.map((m) => {
                const isSel = m === selectedMinute
                return (
                  <button
                    key={m}
                    type="button"
                    data-selected={isSel ? 'true' : undefined}
                    onClick={() => handleSelectTime(selectedHour, m)}
                    className={cn(
                      'w-full py-1.5 text-center rounded-lg text-xs font-mono transition-all select-none cursor-pointer',
                      isSel
                        ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 scale-[1.02]'
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

        {/* Quick Presets */}
        <div className="mt-3 pt-2.5 border-t border-border/40 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Gợi Ý Nhanh
          </div>
          <div className="grid grid-cols-2 gap-1">
            {QUICK_TIME_PRESETS.map((preset) => (
              <button
                key={preset.time}
                type="button"
                onClick={() => handleSelectPreset(preset.time)}
                className={cn(
                  'text-left px-2 py-1 rounded-md text-[11px] flex items-center justify-between transition-colors cursor-pointer',
                  selectedTime === preset.time
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="truncate">{preset.label.split(' ')[0]}</span>
                {selectedTime === preset.time && <Check className="w-3 h-3 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const now = new Date()
              const h = String(now.getHours()).padStart(2, '0')
              const m = String(now.getMinutes()).padStart(2, '0')
              handleSelectTime(h, m)
            }}
            className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
          >
            Hiện tại
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
          >
            Xong
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ====================================================
// 3. COMBINED DATETIMEPICKER COMPONENT
// ====================================================
export interface DateTimePickerProps {
  dateValue?: string
  timeValue?: string
  onDateChange?: (date: string) => void
  onTimeChange?: (time: string) => void
  disabled?: boolean
  error?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled,
  error,
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      <div className="flex-1">
        <DatePicker
          value={dateValue}
          onChange={onDateChange}
          disabled={disabled}
          error={error}
        />
      </div>
      <div className="w-32 sm:w-40">
        <TimePicker
          value={timeValue}
          onChange={onTimeChange}
          disabled={disabled}
          error={error}
          size={size}
        />
      </div>
    </div>
  )
}
