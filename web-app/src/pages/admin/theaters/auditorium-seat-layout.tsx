import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  Crown,
  Heart,
  Accessibility,
  Ban,
  Tv,
  MoveHorizontal,
  X,
  Columns,
  Minus,
  Sparkles,
} from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import type {
  AdminSeatRow,
  AdminSeatItem,
  AdminSeatType,
  AuditoriumSeatLayout,
  SeatLayoutSummary,
} from '@/types/admin-seat'
import type { AdminAuditorium, AdminTheater } from '@/types/admin-theater'
import {
  theaterApiService,
  mapBackendSeatsToAdminRows,
  type SeatGeneratePayload,
} from '@/services/theater-api.service'
import { calculateLayoutSummary } from '@/lib/seat-layout'
import { AdminSeatLegend } from '@/components/admin/seats/admin-seat-legend'
import { AdminSeatItemComponent } from '@/components/admin/seats/admin-seat-item'
import { SeatGeneratorModal } from '@/components/admin/seats/seat-generator-modal'
import { CinemaScreen } from '@/components/booking/cinema-screen'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminAuditoriumSeatLayout() {
  const { auditoriumId } = useParams<{ auditoriumId: string }>()
  const navigate = useNavigate()

  const [auditorium, setAuditorium] = useState<AdminAuditorium | null>(null)
  const [theater, setTheater] = useState<AdminTheater | null>(null)
  const [layout, setLayout] = useState<AuditoriumSeatLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Selection state: array of selected seat IDs
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])

  // Undo / Redo history stack
  const [history, setHistory] = useState<AdminSeatRow[][]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  // Zoom level (0.8x to 1.3x)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  // Confirmation dialogs
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<string | null>(null)

  // Initial layout for dirty checking
  const [initialRowsJson, setInitialRowsJson] = useState<string>('')

  // Load auditorium, theater, and seat layout from API
  useEffect(() => {
    if (!auditoriumId) return
    let isCancelled = false
    setIsLoading(true)

    const fetchData = async () => {
      try {
        // 1. Load auditorium details
        const aud = await theaterApiService.getAuditoriumById(auditoriumId)
        if (!aud) {
          toast.error('Không tìm thấy thông tin phòng chiếu')
          navigate('/admin/theaters')
          return
        }

        // 2. Load theater details & seats in parallel
        const [th, seatLayoutRes] = await Promise.all([
          theaterApiService.getAdminTheaterById(aud.theaterId),
          theaterApiService.getAuditoriumSeats(auditoriumId),
        ])

        const rows = mapBackendSeatsToAdminRows(seatLayoutRes?.seats || [])

        const seatLayout: AuditoriumSeatLayout = {
          auditoriumId: aud.id,
          theaterId: aud.theaterId,
          rows,
          updatedAt: aud.updatedAt,
        }

        if (!isCancelled) {
          setAuditorium(aud)
          setTheater(th)
          setLayout(seatLayout)
          setHistory([rows])
          setHistoryIndex(0)
          setInitialRowsJson(JSON.stringify(rows))
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error(err)
        if (!isCancelled) {
          toast.error(err?.message || 'Lỗi khi tải sơ đồ ghế phòng chiếu')
          navigate('/admin/theaters')
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [auditoriumId, navigate])

  // Current rows derived from history
  const currentRows = useMemo(() => {
    if (historyIndex >= 0 && historyIndex < history.length) {
      return history[historyIndex]
    }
    return layout?.rows || []
  }, [history, historyIndex, layout])

  // Calculate live summary
  const summary: SeatLayoutSummary = useMemo(() => {
    return calculateLayoutSummary(currentRows)
  }, [currentRows])

  // Dirty state checking
  const isDirty = useMemo(() => {
    if (!initialRowsJson) return false
    return JSON.stringify(currentRows) !== initialRowsJson
  }, [currentRows, initialRowsJson])

  // Warn on page reload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Push new state into history stack
  const pushNewState = useCallback(
    (newRows: AdminSeatRow[]) => {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newRows)
      // Limit history to 30 steps
      if (newHistory.length > 30) newHistory.shift()
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [history, historyIndex]
  )

  // Undo / Redo handlers
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex((prev) => prev - 1)
      setSelectedSeatIds([])
    }
  }, [canUndo])

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex((prev) => prev + 1)
      setSelectedSeatIds([])
    }
  }, [canRedo])

  // Keyboard shortcut for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Toggle individual seat selection
  const handleToggleSeat = (seatId: string) => {
    setSelectedSeatIds((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    )
  }

  // Toggle entire row selection
  const handleToggleRowSelect = (rowLabel: string) => {
    const row = currentRows.find((r) => r.rowLabel === rowLabel)
    if (!row) return

    const rowSeatIds = row.seats.map((s) => s.id)
    const isAllRowSelected = rowSeatIds.every((id) => selectedSeatIds.includes(id))

    if (isAllRowSelected) {
      setSelectedSeatIds((prev) => prev.filter((id) => !rowSeatIds.includes(id)))
    } else {
      setSelectedSeatIds((prev) => Array.from(new Set([...prev, ...rowSeatIds])))
    }
  }

  // Select all / Deselect all
  const allSeatIds = useMemo(() => {
    const ids: string[] = []
    currentRows.forEach((r) => r.seats.forEach((s) => ids.push(s.id)))
    return ids
  }, [currentRows])

  const isAllSelected = allSeatIds.length > 0 && allSeatIds.every((id) => selectedSeatIds.includes(id))

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedSeatIds([])
    } else {
      setSelectedSeatIds(allSeatIds)
    }
  }

  // Bulk Actions on Selected Seats
  const handleBulkChangeType = (newType: AdminSeatType) => {
    if (selectedSeatIds.length === 0) return

    const updatedRows: AdminSeatRow[] = currentRows.map((row) => ({
      ...row,
      seats: row.seats.map((seat) => {
        if (!selectedSeatIds.includes(seat.id)) return seat

        // Update type and seatNumber if switching to couple or from couple
        let seatNumber = seat.seatNumber
        if (newType === 'couple' && seat.type !== 'couple') {
          // Make it a dual label if possible
          seatNumber = `${seat.row}${seat.col * 2 - 1}-${seat.row}${seat.col * 2}`
        } else if (newType !== 'couple' && seat.type === 'couple') {
          seatNumber = `${seat.row}${seat.col}`
        }

        return {
          ...seat,
          type: newType,
          seatNumber,
        }
      }),
    }))

    pushNewState(updatedRows)
    toast.success(`Đã đổi loại ${selectedSeatIds.length} ghế thành "${newType.toUpperCase()}"!`)
  }

  const handleBulkToggleDisabled = () => {
    if (selectedSeatIds.length === 0) return

    // If all selected are disabled, enable them. Otherwise disable them.
    const allDisabled = selectedSeatIds.every((id) => {
      for (const r of currentRows) {
        const s = r.seats.find((item) => item.id === id)
        if (s) return s.status === 'disabled'
      }
      return false
    })

    const targetStatus = allDisabled ? 'available' : 'disabled'

    const updatedRows: AdminSeatRow[] = currentRows.map((row) => ({
      ...row,
      seats: row.seats.map((seat) => {
        if (!selectedSeatIds.includes(seat.id)) return seat
        return {
          ...seat,
          status: targetStatus,
        }
      }),
    }))

    pushNewState(updatedRows)
    toast.success(
      targetStatus === 'disabled'
        ? `Đã khóa ${selectedSeatIds.length} ghế (không mở bán vé)!`
        : `Đã mở khóa hoạt động cho ${selectedSeatIds.length} ghế!`
    )
  }

  const handleBulkToggleAisle = () => {
    if (selectedSeatIds.length === 0) return

    const updatedRows: AdminSeatRow[] = currentRows.map((row) => ({
      ...row,
      seats: row.seats.map((seat) => {
        if (!selectedSeatIds.includes(seat.id)) return seat
        return {
          ...seat,
          isAisleAfter: !seat.isAisleAfter,
        }
      }),
    }))

    pushNewState(updatedRows)
    toast.success(`Đã cập nhật lối đi cạnh các ghế đã chọn!`)
  }

  // Default seat count derived from typical standard rows (e.g. 16 seats)
  const defaultSeatCount = useMemo(() => {
    const standardRow = currentRows.find((r) => r.seats.some((s) => s.type === 'standard'))
    return standardRow ? standardRow.seats.length : 16
  }, [currentRows])

  // Row and Column structure modifiers
  const handleAddNewRow = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const usedLabels = currentRows.map((r) => r.rowLabel)
    const nextLabel = letters.find((l) => !usedLabels.includes(l)) || `R${currentRows.length + 1}`

    // Use standard row width or defaultSeatCount (e.g. 16 seats)
    const standardRow = currentRows.find((r) => r.seats.some((s) => s.type === 'standard'))
    const seatCount = standardRow ? standardRow.seats.length : (defaultSeatCount || 16)

    const newSeats: AdminSeatItem[] = []
    for (let c = 1; c <= seatCount; c++) {
      const isAisle = standardRow?.seats[c - 1]?.isAisleAfter ?? (c === 4 || c === seatCount - 4)
      newSeats.push({
        id: `seat-${auditoriumId}-${nextLabel}${c}`.toLowerCase(),
        seatNumber: `${nextLabel}${c}`,
        row: nextLabel,
        col: c,
        type: 'standard',
        status: 'available',
        isAisleAfter: isAisle,
      })
    }

    const updatedRows = [...currentRows, { rowLabel: nextLabel, seats: newSeats }]
    pushNewState(updatedRows)
    toast.success(`Đã thêm hàng ghế mới "${nextLabel}" với ${seatCount} ghế!`)
  }

  // Add 1 seat to a specific row
  const handleAddSeatToRow = (rowLabel: string) => {
    const rowIndex = currentRows.findIndex((r) => r.rowLabel === rowLabel)
    if (rowIndex === -1) return

    const row = currentRows[rowIndex]
    const nextCol = row.seats.length + 1
    const isCouple = row.seats.length > 0 && row.seats.every((s) => s.type === 'couple')

    const newSeat: AdminSeatItem = {
      id: `seat-${auditoriumId}-${rowLabel}${nextCol}`.toLowerCase(),
      seatNumber: isCouple
        ? `${rowLabel}${nextCol * 2 - 1}-${rowLabel}${nextCol * 2}`
        : `${rowLabel}${nextCol}`,
      row: rowLabel,
      col: nextCol,
      type: isCouple ? 'couple' : 'standard',
      status: 'available',
      isAisleAfter: false,
    }

    const updatedRows = currentRows.map((r, idx) =>
      idx === rowIndex ? { ...r, seats: [...r.seats, newSeat] } : r
    )

    pushNewState(updatedRows)
    toast.success(`Đã thêm ghế ${newSeat.seatNumber} vào hàng ${rowLabel}!`)
  }

  // Remove 1 seat from a specific row
  const handleRemoveSeatFromRow = (rowLabel: string) => {
    const rowIndex = currentRows.findIndex((r) => r.rowLabel === rowLabel)
    if (rowIndex === -1) return

    const row = currentRows[rowIndex]
    if (row.seats.length <= 1) {
      toast.error(`Hàng ${rowLabel} phải có ít nhất 1 ghế`)
      return
    }

    const removedSeat = row.seats[row.seats.length - 1]
    const updatedRows = currentRows.map((r, idx) =>
      idx === rowIndex ? { ...r, seats: r.seats.slice(0, -1) } : r
    )

    setSelectedSeatIds((prev) => prev.filter((id) => id !== removedSeat.id))
    pushNewState(updatedRows)
    toast.success(`Đã bớt ghế ${removedSeat.seatNumber} khỏi hàng ${rowLabel}!`)
  }

  // Set custom seat count for a specific row
  const handleSetRowSeatCount = (rowLabel: string, targetCount: number) => {
    if (targetCount < 1 || targetCount > 35) {
      toast.error('Số lượng ghế mỗi hàng phải từ 1 đến 35')
      return
    }

    const rowIndex = currentRows.findIndex((r) => r.rowLabel === rowLabel)
    if (rowIndex === -1) return

    const row = currentRows[rowIndex]
    const currentCount = row.seats.length
    if (currentCount === targetCount) return

    const standardRow = currentRows.find((r) => r.seats.some((s) => s.type === 'standard'))
    let updatedSeats: AdminSeatItem[] = []

    if (targetCount > currentCount) {
      const isCouple = row.seats.length > 0 && row.seats.every((s) => s.type === 'couple')
      const addedSeats: AdminSeatItem[] = []

      for (let c = currentCount + 1; c <= targetCount; c++) {
        const isAisle = standardRow?.seats[c - 1]?.isAisleAfter ?? (c === 4 || c === targetCount - 4)
        addedSeats.push({
          id: `seat-${auditoriumId}-${rowLabel}${c}`.toLowerCase(),
          seatNumber: isCouple
            ? `${rowLabel}${c * 2 - 1}-${rowLabel}${c * 2}`
            : `${rowLabel}${c}`,
          row: rowLabel,
          col: c,
          type: isCouple ? 'couple' : 'standard',
          status: 'available',
          isAisleAfter: isAisle,
        })
      }
      updatedSeats = [...row.seats, ...addedSeats]
    } else {
      updatedSeats = row.seats.slice(0, targetCount)
      const removedIds = row.seats.slice(targetCount).map((s) => s.id)
      setSelectedSeatIds((prev) => prev.filter((id) => !removedIds.includes(id)))
    }

    const updatedRows = currentRows.map((r, idx) =>
      idx === rowIndex ? { ...r, seats: updatedSeats } : r
    )

    pushNewState(updatedRows)
    toast.success(`Hàng ${rowLabel} đã được cập nhật thành ${targetCount} ghế!`)
  }

  // Delete a specific row
  const handleConfirmDeleteRow = () => {
    if (!rowToDelete) return
    if (currentRows.length <= 1) {
      toast.error('Phòng chiếu phải có ít nhất 1 hàng ghế')
      setRowToDelete(null)
      return
    }

    const targetRow = currentRows.find((r) => r.rowLabel === rowToDelete)
    const targetIds = targetRow ? targetRow.seats.map((s) => s.id) : []
    const updatedRows = currentRows.filter((r) => r.rowLabel !== rowToDelete)

    setSelectedSeatIds((prev) => prev.filter((id) => !targetIds.includes(id)))
    pushNewState(updatedRows)
    toast.success(`Đã xóa hàng ghế "${rowToDelete}"!`)
    setRowToDelete(null)
  }

  // Sync all standard rows to standard seat count (defaultSeatCount)
  const handleSyncRowsToStandardCount = () => {
    const standardRow = currentRows.find((r) => r.seats.some((s) => s.type === 'standard'))
    const targetCount = standardRow ? standardRow.seats.length : 16

    let changed = false
    const updatedRows = currentRows.map((row) => {
      const isCoupleRow = row.seats.length > 0 && row.seats.every((s) => s.type === 'couple')
      if (isCoupleRow || row.seats.length === targetCount) return row

      changed = true
      if (row.seats.length < targetCount) {
        const added: AdminSeatItem[] = []
        for (let c = row.seats.length + 1; c <= targetCount; c++) {
          const isAisle = standardRow?.seats[c - 1]?.isAisleAfter ?? (c === 4 || c === targetCount - 4)
          added.push({
            id: `seat-${auditoriumId}-${row.rowLabel}${c}`.toLowerCase(),
            seatNumber: `${row.rowLabel}${c}`,
            row: row.rowLabel,
            col: c,
            type: 'standard',
            status: 'available',
            isAisleAfter: isAisle,
          })
        }
        return {
          ...row,
          seats: [...row.seats, ...added],
        }
      } else {
        return {
          ...row,
          seats: row.seats.slice(0, targetCount),
        }
      }
    })

    if (!changed) {
      toast.info(`Tất cả các hàng tiêu chuẩn đã có ${targetCount} ghế`)
      return
    }

    pushNewState(updatedRows)
    toast.success(`Đã đồng bộ các hàng tiêu chuẩn về ${targetCount} ghế!`)
  }

  const handleDeleteLastRow = () => {
    if (currentRows.length <= 1) {
      toast.error('Phòng chiếu phải có ít nhất 1 hàng ghế')
      return
    }

    const removedRow = currentRows[currentRows.length - 1]
    const updatedRows = currentRows.slice(0, -1)
    pushNewState(updatedRows)
    setSelectedSeatIds((prev) => prev.filter((id) => !removedRow.seats.some((s) => s.id === id)))
    toast.success(`Đã xóa hàng ghế cuối cùng "${removedRow.rowLabel}"!`)
  }

  const handleAddColumnToAllRows = () => {
    const updatedRows = currentRows.map((row) => {
      const nextCol = row.seats.length + 1
      const isCouple = row.seats.some((s) => s.type === 'couple')

      const newSeat: AdminSeatItem = {
        id: `seat-${auditoriumId}-${row.rowLabel}${nextCol}`.toLowerCase(),
        seatNumber: isCouple
          ? `${row.rowLabel}${nextCol * 2 - 1}-${row.rowLabel}${nextCol * 2}`
          : `${row.rowLabel}${nextCol}`,
        row: row.rowLabel,
        col: nextCol,
        type: isCouple ? 'couple' : 'standard',
        status: 'available',
      }

      return {
        ...row,
        seats: [...row.seats, newSeat],
      }
    })

    pushNewState(updatedRows)
    toast.success('Đã thêm 1 ghế vào cuối mỗi hàng!')
  }

  const handleRemoveColumnFromAllRows = () => {
    const canRemove = currentRows.every((r) => r.seats.length > 2)
    if (!canRemove) {
      toast.error('Mỗi hàng cần duy trì tối thiểu 2 ghế')
      return
    }

    const updatedRows = currentRows.map((row) => ({
      ...row,
      seats: row.seats.slice(0, -1),
    }))

    pushNewState(updatedRows)
    toast.success('Đã bớt 1 ghế ở cuối mỗi hàng!')
  }

  // Save layout confirmation
  const handleConfirmSave = async () => {
    if (!auditorium) return

    try {
      setIsSaving(true)
      const payload: SeatGeneratePayload = {
        rows: currentRows.map((r) => {
          const coupleCount = r.seats.filter((s) => s.type === 'couple').length
          const vipCount = r.seats.filter((s) => s.type === 'vip').length
          let seatType: 'STANDARD' | 'VIP' | 'COUPLE' = 'STANDARD'
          if (coupleCount > r.seats.length / 2) seatType = 'COUPLE'
          else if (vipCount > r.seats.length / 2) seatType = 'VIP'

          return {
            label: r.rowLabel,
            seatCount: r.seats.length,
            seatType,
          }
        }),
      }

      const res = await theaterApiService.generateSeatLayout(auditorium.id, payload)
      const newRows = mapBackendSeatsToAdminRows(res.seats || [])

      setAuditorium((prev) => (prev ? { ...prev, totalSeats: res.totalSeats } : null))
      setLayout((prev) => (prev ? { ...prev, rows: newRows } : null))
      setHistory([newRows])
      setHistoryIndex(0)
      setInitialRowsJson(JSON.stringify(newRows))
      setSelectedSeatIds([])
      toast.success(
        `Đã lưu sơ đồ ghế thành công! Tổng công suất phòng đã được đồng bộ lại là ${res.totalSeats} ghế.`
      )
      setShowSaveDialog(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Không thể lưu sơ đồ ghế. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle auto-generator submission
  const handleGenerateLayout = async (payload: SeatGeneratePayload) => {
    if (!auditorium) return
    try {
      setIsGenerating(true)
      const res = await theaterApiService.generateSeatLayout(auditorium.id, payload)
      const newRows = mapBackendSeatsToAdminRows(res.seats || [])

      setAuditorium((prev) => (prev ? { ...prev, totalSeats: res.totalSeats } : null))
      setLayout((prev) => (prev ? { ...prev, rows: newRows } : null))
      setHistory([newRows])
      setHistoryIndex(0)
      setInitialRowsJson(JSON.stringify(newRows))
      setSelectedSeatIds([])
      toast.success(
        `Đã khởi tạo sơ đồ ghế thành công! Tổng số ghế mới: ${res.totalSeats} ghế.`
      )
      setIsGeneratorOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Không thể sinh sơ đồ ghế. Vui lòng kiểm tra lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle Cancel / Leave
  const handleLeavePage = () => {
    if (isDirty) {
      setShowLeaveDialog(true)
    } else {
      navigate(theater ? `/admin/theaters/${theater.id}` : '/admin/theaters')
    }
  }

  if (isLoading || !auditorium || !theater) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* 1. Header & Navigation */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLeavePage}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại chi tiết rạp {theater.name}</span>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Tv className="w-6 h-6 text-primary" />
                <span>Sơ Đồ Ghế: {auditorium.name}</span>
              </h1>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 text-xs font-bold"
              >
                {auditorium.format}
              </Badge>
              {isDirty && (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold animate-pulse"
                >
                  Có thay đổi chưa lưu
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {theater.name} • {theater.city} • Cấu hình phân loại và vị trí từng ghế ngồi thực tế
            </p>
          </div>

          {/* Top Control Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Undo / Redo */}
            <div className="flex items-center rounded-xl border border-border/70 bg-card p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer disabled:opacity-35"
                title="Hoàn tác (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hoàn tác</span>
              </Button>
              <div className="w-px h-4 bg-border/60" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer disabled:opacity-35"
                title="Làm lại (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Làm lại</span>
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center rounded-xl border border-border/70 bg-card p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
                disabled={zoomLevel <= 0.7}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] font-mono px-1.5 text-muted-foreground">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                disabled={zoomLevel >= 1.4}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              {zoomLevel !== 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(1)}
                  className="h-8 px-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Đặt lại 100%"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Auto Generate Seats Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGeneratorOpen(true)}
              disabled={isSaving || isGenerating}
              className="rounded-xl text-xs gap-1.5 cursor-pointer font-bold border-primary/40 text-primary hover:bg-primary/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Khởi tạo / Sinh lại ghế</span>
            </Button>

            {/* Save Layout CTA */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={isSaving || isGenerating}
              className="rounded-xl text-xs gap-1.5 shadow-sm shadow-primary/30 cursor-pointer font-bold px-4"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu sơ đồ ghế</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs space-y-0.5 text-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Tổng hàng ghế
          </span>
          <span className="font-mono text-base font-black text-foreground">
            {summary.totalRows} hàng
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs space-y-0.5 text-center bg-primary/5 border-primary/30">
          <span className="text-[10px] uppercase font-bold text-primary block">
            Công suất ghế
          </span>
          <span className="font-mono text-base font-black text-primary">
            {summary.totalSeats} vé
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs space-y-0.5 text-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Ghế Thường
          </span>
          <span className="font-mono text-base font-bold text-foreground">
            {summary.standardCount}
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs space-y-0.5 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
            Ghế VIP
          </span>
          <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">
            {summary.vipCount}
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs space-y-0.5 text-center">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
            Ghế Couple
          </span>
          <span className="font-mono text-base font-bold text-rose-600 dark:text-rose-400">
            {summary.coupleCount} ({summary.coupleCount * 2} chỗ)
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs space-y-0.5 text-center">
          <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block">
            Ghế Ưu Tiên
          </span>
          <span className="font-mono text-base font-bold text-sky-600 dark:text-sky-400">
            {summary.accessibilityCount}
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs space-y-0.5 text-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground/60 block">
            Đang Khóa
          </span>
          <span className="font-mono text-base font-bold text-muted-foreground">
            {summary.disabledCount}
          </span>
        </div>
      </div>

      {/* 3. Seat Legend */}
      <AdminSeatLegend />

      {/* 4. Canvas Toolbar for Structure Controls */}
      <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <Columns className="w-3.5 h-3.5 text-primary" />
            <span>Kết cấu phòng:</span>
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddNewRow}
            className="h-7 text-[11px] rounded-lg gap-1 bg-secondary/40 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm hàng mới</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeleteLastRow}
            disabled={currentRows.length <= 1}
            className="h-7 text-[11px] rounded-lg gap-1 bg-secondary/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa hàng cuối</span>
          </Button>

          <div className="w-px h-4 bg-border/60 hidden sm:block" />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddColumnToAllRows}
            className="h-7 text-[11px] rounded-lg gap-1 bg-secondary/40 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm 1 ghế/hàng</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveColumnFromAllRows}
            className="h-7 text-[11px] rounded-lg gap-1 bg-secondary/40 cursor-pointer"
          >
            <span>Bớt 1 ghế/hàng</span>
          </Button>

          <div className="w-px h-4 bg-border/60 hidden sm:block" />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncRowsToStandardCount}
            className="h-7 text-[11px] rounded-lg gap-1 bg-secondary/40 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
            title={`Đồng bộ các hàng thường về chuẩn ${defaultSeatCount} ghế`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Khớp chuẩn {defaultSeatCount} ghế</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectAllToggle}
            className="h-7 text-[11px] rounded-lg cursor-pointer"
          >
            <span>{isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn toàn bộ sơ đồ'}</span>
          </Button>
        </div>
      </div>

      {/* 5. Main Seat Map Interactive Canvas */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm relative overflow-hidden">
        {currentRows.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/80 border border-border/80 flex items-center justify-center mx-auto text-muted-foreground">
              <Tv className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Phòng chiếu chưa có sơ đồ ghế</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Phòng chiếu "{auditorium.name}" hiện chưa được cấu hình sơ đồ ghế. Hãy sử dụng nút "Khởi tạo / Sinh lại ghế" ở thanh công cụ phía trên để khởi tạo.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Swipe Guide Banner */}
            <div className="flex items-center justify-center gap-1.5 pb-4 text-[11px] text-muted-foreground sm:hidden">
              <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
              <span>Vuốt ngang để xem và điều chỉnh toàn bộ sơ đồ ghế</span>
            </div>

            {/* Scrollable Map Container */}
            <div className="overflow-x-auto scrollbar-thin py-4 flex flex-col items-center">
              <div
                className="transition-transform duration-150 origin-top flex flex-col items-center min-w-max px-8"
                style={{ transform: `scale(${zoomLevel})` }}
              >
            {/* Cinema Curved Screen */}
            <div className="w-full max-w-2xl mb-12">
              <CinemaScreen />
            </div>

            {/* Rows Grid */}
            <div className="space-y-3">
              {currentRows.map((row) => {
                const rowSeatIds = row.seats.map((s) => s.id)
                const isRowAllSelected = rowSeatIds.every((id) => selectedSeatIds.includes(id))

                return (
                  <div key={row.rowLabel} className="flex items-center gap-3 group">
                    {/* Left Row Label (Clickable to select whole row) */}
                    <button
                      type="button"
                      onClick={() => handleToggleRowSelect(row.rowLabel)}
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold transition-colors cursor-pointer shrink-0',
                        isRowAllSelected
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                      )}
                      title={`Nhấp để ${isRowAllSelected ? 'bỏ chọn' : 'chọn'} cả hàng ${row.rowLabel}`}
                    >
                      {row.rowLabel}
                    </button>

                    {/* Seats in this row */}
                    <div className="flex items-center gap-1.5">
                      {row.seats.map((seat) => (
                        <AdminSeatItemComponent
                          key={seat.id}
                          seat={seat}
                          isSelected={selectedSeatIds.includes(seat.id)}
                          onToggleSelect={handleToggleSeat}
                        />
                      ))}
                    </div>

                    {/* Right Row Label */}
                    <button
                      type="button"
                      onClick={() => handleToggleRowSelect(row.rowLabel)}
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold transition-colors cursor-pointer shrink-0',
                        isRowAllSelected
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                      )}
                      title={`Nhấp để ${isRowAllSelected ? 'bỏ chọn' : 'chọn'} cả hàng ${row.rowLabel}`}
                    >
                      {row.rowLabel}
                    </button>

                    {/* Row-Level Seat Controls (Add / Remove / Custom Count / Delete) */}
                    <div className="flex items-center gap-1 pl-1 shrink-0">
                      {/* Minus 1 seat button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSeatFromRow(row.rowLabel)}
                        disabled={row.seats.length <= 1}
                        className="w-6 h-6 rounded-md bg-secondary/80 hover:bg-rose-500/20 hover:text-rose-500 text-muted-foreground flex items-center justify-center text-xs transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title={`Bớt 1 ghế ở cuối hàng ${row.rowLabel} (ghế ${row.seats[row.seats.length - 1]?.seatNumber})`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      {/* Popover trigger showing current seat count */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="h-6 px-1.5 min-w-[30px] rounded-md bg-secondary/80 hover:bg-secondary text-foreground font-mono text-[11px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                            title={`Hàng ${row.rowLabel}: ${row.seats.length} ghế. Nhấp để tùy chỉnh số lượng.`}
                          >
                            <span>{row.seats.length}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="center" side="right" className="w-64 p-3.5 space-y-3">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <span className="text-xs font-bold text-foreground">
                              Hàng <span className="font-mono text-primary font-extrabold">{row.rowLabel}</span>
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {row.seats.length} ghế hiện tại
                            </Badge>
                          </div>

                          {/* Set custom seat count */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-muted-foreground block">
                              Số lượng ghế của hàng:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={35}
                                defaultValue={row.seats.length}
                                id={`seat-count-${row.rowLabel}`}
                                className="h-8 w-20 rounded-lg border border-border bg-background px-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                              />
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 text-[11px] flex-1 cursor-pointer"
                                onClick={() => {
                                  const input = document.getElementById(`seat-count-${row.rowLabel}`) as HTMLInputElement
                                  if (input) {
                                    const count = parseInt(input.value, 10)
                                    if (!isNaN(count)) handleSetRowSeatCount(row.rowLabel, count)
                                  }
                                }}
                              >
                                Áp dụng
                              </Button>
                            </div>
                          </div>

                          {/* Quick actions inside popover */}
                          <div className="pt-1 flex flex-col gap-1.5 border-t border-border/40">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetRowSeatCount(row.rowLabel, defaultSeatCount)}
                              className="h-7 text-[11px] justify-start text-left bg-secondary/30 hover:bg-secondary cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-primary mr-1.5" />
                              <span>Khớp chuẩn {defaultSeatCount} ghế (theo phòng)</span>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setRowToDelete(row.rowLabel)}
                              disabled={currentRows.length <= 1}
                              className="h-7 text-[11px] justify-start text-left text-rose-500 hover:bg-rose-500/10 cursor-pointer disabled:opacity-40"
                            >
                              <Trash2 className="w-3 h-3 mr-1.5" />
                              <span>Xóa toàn bộ hàng {row.rowLabel}</span>
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Plus 1 seat button */}
                      <button
                        type="button"
                        onClick={() => handleAddSeatToRow(row.rowLabel)}
                        className="w-6 h-6 rounded-md bg-secondary/80 hover:bg-primary/20 hover:text-primary text-muted-foreground flex items-center justify-center text-xs transition-colors cursor-pointer"
                        title={`Thêm 1 ghế vào cuối hàng ${row.rowLabel}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Delete row button */}
                      <button
                        type="button"
                        onClick={() => setRowToDelete(row.rowLabel)}
                        disabled={currentRows.length <= 1}
                        className="w-6 h-6 rounded-md bg-transparent hover:bg-rose-500/20 hover:text-rose-500 text-muted-foreground/40 hover:text-rose-500 flex items-center justify-center text-xs transition-colors cursor-pointer disabled:opacity-10 ml-0.5"
                        title={`Xóa hàng ${row.rowLabel}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>

      {/* 6. Sticky Floating Bulk Actions Bar (Appears when >= 1 seat selected) */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="rounded-2xl border border-primary/50 bg-card/95 p-3.5 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-foreground">
                Đã chọn <strong className="font-mono text-primary">{selectedSeatIds.length}</strong> ghế
              </span>
            </div>

            {/* Quick Type Modifiers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Đổi sang:
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkChangeType('standard')}
                className="h-7 px-2 text-[11px] rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer"
              >
                <span>Thường</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkChangeType('vip')}
                className="h-7 px-2 text-[11px] rounded-lg text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer font-semibold gap-1"
              >
                <Crown className="w-3 h-3" />
                <span>VIP</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkChangeType('couple')}
                className="h-7 px-2 text-[11px] rounded-lg text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer font-semibold gap-1"
              >
                <Heart className="w-3 h-3" />
                <span>Couple</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkChangeType('accessibility')}
                className="h-7 px-2 text-[11px] rounded-lg text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/10 cursor-pointer font-semibold gap-1"
              >
                <Accessibility className="w-3 h-3" />
                <span>Ưu tiên</span>
              </Button>

              <div className="w-px h-4 bg-border/60 mx-0.5" />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBulkToggleDisabled}
                className="h-7 px-2 text-[11px] rounded-lg text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                title="Khóa hoặc mở khóa ghế"
              >
                <Ban className="w-3 h-3" />
                <span>Khóa/Mở</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBulkToggleAisle}
                className="h-7 px-2 text-[11px] rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="Tạo khoảng trống lối đi bên cạnh ghế"
              >
                <span>Lối đi</span>
              </Button>

              {/* Clear Selection */}
              <button
                type="button"
                onClick={() => setSelectedSeatIds([])}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="Bỏ chọn"
                aria-label="Bỏ chọn các ghế"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Save Confirmation Modal */}
      <AdminConfirmDialog
        isOpen={showSaveDialog}
        title="Xác nhận lưu sơ đồ ghế"
        description={`Hệ thống sẽ đồng bộ lại tổng công suất bán vé (${summary.totalSeats} ghế) cho phòng chiếu "${auditorium.name}" thuộc rạp "${theater.name}". Mọi thay đổi về vị trí ghế sẽ có hiệu lực ngay lập tức cho các suất chiếu tiếp theo.`}
        confirmText={isSaving ? 'Đang lưu...' : 'Lưu và đồng bộ'}
        cancelText="Xem lại"
        variant="warning"
        isLoading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowSaveDialog(false)}
      />

      {/* 8. Dirty Leave Confirmation Modal */}
      <AdminConfirmDialog
        isOpen={showLeaveDialog}
        title="Bạn có thay đổi chưa lưu"
        description="Bạn đã chỉnh sửa sơ đồ ghế của phòng chiếu này. Nếu rời trang bây giờ, mọi thiết lập chưa lưu sẽ bị mất."
        confirmText="Rời trang không lưu"
        cancelText="Ở lại tiếp tục sửa"
        variant="destructive"
        onConfirm={() => {
          setShowLeaveDialog(false)
          navigate(theater ? `/admin/theaters/${theater.id}` : '/admin/theaters')
        }}
        onCancel={() => setShowLeaveDialog(false)}
      />

      {/* 9. Delete Specific Row Confirmation Modal */}
      <AdminConfirmDialog
        isOpen={!!rowToDelete}
        title={`Xác nhận xóa hàng ghế "${rowToDelete}"`}
        description={`Bạn có chắc chắn muốn xóa toàn bộ hàng ghế "${rowToDelete}" gồm ${
          currentRows.find((r) => r.rowLabel === rowToDelete)?.seats.length || 0
        } ghế? Hành động này sẽ thay đổi tổng số ghế và sức chứa bán vé của phòng chiếu.`}
        confirmText="Xóa hàng ghế"
        cancelText="Hủy bỏ"
        variant="destructive"
        onConfirm={handleConfirmDeleteRow}
        onCancel={() => setRowToDelete(null)}
      />

      {/* 10. Seat Generator Modal */}
      <SeatGeneratorModal
        isOpen={isGeneratorOpen}
        auditoriumName={auditorium.name}
        auditoriumFormat={auditorium.format}
        currentTotalSeats={auditorium.totalSeats}
        isGenerating={isGenerating}
        onGenerate={handleGenerateLayout}
        onClose={() => setIsGeneratorOpen(false)}
      />
    </div>
  )
}
