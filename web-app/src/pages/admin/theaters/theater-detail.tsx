import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Tv,
  Users,
  Film,
  Pencil,
  Plus,
  Wrench,
  CheckCircle2,
  XCircle,
  MapPin,
  ExternalLink,
  Calendar,
  Sparkles,
  Grid3X3,
  MoreVertical,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react'
import type {
  AdminTheater,
  AdminAuditorium,
  AdminTheaterStatus,
  AuditoriumStatus,
  AuditoriumFormData,
} from '@/types/admin-theater'
import { theaterApiService } from '@/services/theater-api.service'
import { showtimeApiService } from '@/services/showtime-api.service'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AuditoriumModal } from '@/components/admin/theaters/auditorium-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type DetailTab = 'auditoriums' | 'showtimes' | 'info'

function formatDateTime(isoString?: string): string {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    const pad = (n: number) => String(n).padStart(2, '0')
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    const seconds = pad(d.getSeconds())
    const day = pad(d.getDate())
    const month = pad(d.getMonth() + 1)
    const year = d.getFullYear()
    return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`
  } catch {
    return isoString || '-'
  }
}

export default function AdminTheaterDetail() {
  const { theaterId } = useParams<{ theaterId: string }>()
  const navigate = useNavigate()

  const [theater, setTheater] = useState<AdminTheater | null>(null)
  const [auditoriums, setAuditoriums] = useState<AdminAuditorium[]>([])
  const [todayShowtimes, setTodayShowtimes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<DetailTab>('auditoriums')

  // Modal State for Auditoriums
  const [auditoriumModalState, setAuditoriumModalState] = useState<{
    isOpen: boolean
    targetAuditorium?: AdminAuditorium | null
  }>({
    isOpen: false,
    targetAuditorium: null,
  })

  // Loading state when clicking edit auditorium to fetch fresh data from API
  const [loadingAudId, setLoadingAudId] = useState<string | null>(null)

  // Open Edit Auditorium Modal with fresh API data
  const handleOpenEditAuditorium = async (aud: AdminAuditorium) => {
    try {
      setLoadingAudId(aud.id)
      const freshAud = await theaterApiService.getAuditoriumById(aud.id)
      setAuditoriumModalState({
        isOpen: true,
        targetAuditorium: freshAud,
      })
    } catch (err: any) {
      console.error('Lỗi khi tải chi tiết phòng chiếu:', err)
      // Fallback to table data if API error occurs
      setAuditoriumModalState({
        isOpen: true,
        targetAuditorium: aud,
      })
    } finally {
      setLoadingAudId(null)
    }
  }

  // Quick Action menu ID for auditoriums
  const [openAudMenuId, setOpenAudMenuId] = useState<string | null>(null)

  // Load theater detail & auditoriums
  const loadData = useCallback(async () => {
    if (!theaterId) return
    try {
      setIsLoading(true)
      const todayStr = new Date().toISOString().split('T')[0]
      const [t, auds, showtimesResult] = await Promise.all([
        theaterApiService.getAdminTheaterById(theaterId),
        theaterApiService.getAuditoriumsByTheaterId(theaterId),
        showtimeApiService
          .getAdminShowtimes({ theaterId, dateFrom: todayStr })
          .then((res) => res.items)
          .catch(() => []),
      ])

      if (!t) {
        toast.error('Không tìm thấy thông tin cụm rạp yêu cầu')
        navigate('/admin/theaters')
        return
      }

      setTheater(t)
      setAuditoriums(auds)
      setTodayShowtimes(showtimesResult)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Không thể tải dữ liệu chi tiết cụm rạp')
    } finally {
      setIsLoading(false)
    }
  }, [theaterId, navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Quick Theater Status update
  const handleQuickTheaterStatus = async (status: AdminTheaterStatus) => {
    if (!theater) return
    try {
      await theaterApiService.updateTheaterStatus(theater.id, theater, status)
      toast.success(
        status === 'active'
          ? `Đã kích hoạt hoạt động cho rạp "${theater.name}"!`
          : status === 'maintenance'
            ? `Đã chuyển rạp "${theater.name}" sang chế độ bảo trì!`
            : `Đã tạm ngưng vận hành rạp "${theater.name}"!`
      )
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái cụm rạp')
    }
  }

  // Auditorium Save Handler (Create or Update)
  const handleSaveAuditorium = async (data: AuditoriumFormData) => {
    if (!theater) return

    try {
      if (auditoriumModalState.targetAuditorium) {
        // Update
        const updated = await theaterApiService.updateAuditorium(
          auditoriumModalState.targetAuditorium.id,
          data
        )
        if (updated) {
          toast.success(`Đã cập nhật thông tin phòng "${updated.name}" thành công!`)
        }
      } else {
        // Create
        const created = await theaterApiService.createAuditorium(theater.id, data)
        toast.success(`Đã thêm phòng chiếu mới "${created.name}" thành công!`)
      }

      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu thông tin phòng chiếu')
    }
  }

  // Quick Auditorium Status update
  const handleQuickAuditoriumStatus = async (
    aud: AdminAuditorium,
    status: AuditoriumStatus
  ) => {
    setOpenAudMenuId(null)
    try {
      const updated = await theaterApiService.updateAuditorium(aud.id, {
        name: aud.name,
        format: aud.format,
        status,
      })
      toast.success(
        status === 'active'
          ? `Phòng "${updated.name}" đã sẵn sàng hoạt động!`
          : status === 'maintenance'
            ? `Phòng "${updated.name}" chuyển sang bảo trì!`
            : `Đã tạm dừng vận hành phòng "${updated.name}"!`
      )
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái phòng chiếu')
    }
  }

  if (isLoading || !theater) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header & Back button */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/theaters')}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách cụm rạp</span>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {theater.name}
              </h1>
              <AdminStatusBadge status={theater.status} />
              <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-semibold text-muted-foreground border border-border/60">
                {theater.city}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
              <span>{theater.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Status Toggle */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Đổi trạng thái</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1.5 space-y-0.5 rounded-xl">
                {theater.status !== 'active' && (
                  <button
                    type="button"
                    onClick={() => handleQuickTheaterStatus('active')}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Kích hoạt rạp</span>
                  </button>
                )}
                {theater.status !== 'maintenance' && (
                  <button
                    type="button"
                    onClick={() => handleQuickTheaterStatus('maintenance')}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Chuyển sang bảo trì</span>
                  </button>
                )}
                {theater.status !== 'inactive' && (
                  <button
                    type="button"
                    onClick={() => handleQuickTheaterStatus('inactive')}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tạm ngưng hoạt động</span>
                  </button>
                )}
              </PopoverContent>
            </Popover>

            {/* Edit Theater */}
            <Button
              asChild
              variant="primary"
              size="sm"
              className="rounded-xl text-xs gap-1.5 shadow-sm shadow-primary/30 cursor-pointer font-bold"
            >
              <Link to={`/admin/theaters/${theater.id}/edit`}>
                <Pencil className="w-3.5 h-3.5" />
                <span>Chỉnh sửa rạp</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Số phòng chiếu
            </p>
            <p className="text-xl font-mono font-black text-foreground">
              {auditoriums.length} phòng
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng số ghế
            </p>
            <p className="text-xl font-mono font-black text-foreground">
              {auditoriums.reduce((sum, a) => sum + a.totalSeats, 0).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Suất chiếu hôm nay
            </p>
            <p className="text-xl font-mono font-black text-primary">
              {todayShowtimes.length > 0 ? todayShowtimes.length : theater.todayShowtimesCount}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Định dạng cao cấp
            </p>
            <p className="text-xl font-mono font-black text-foreground">
              {auditoriums.filter((a) => a.format !== '2D').length} phòng
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-border/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('auditoriums')}
            className={cn(
              'pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5',
              activeTab === 'auditoriums'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Tv className="w-4 h-4" />
            <span>Phòng Chiếu ({auditoriums.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('showtimes')}
            className={cn(
              'pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5',
              activeTab === 'showtimes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>Suất Chiếu Hôm Nay ({todayShowtimes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={cn(
              'pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5',
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>Thông Tin Cụm Rạp</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content Sections */}

      {/* TAB 1: AUDITORIUMS (Phòng chiếu) */}
      {activeTab === 'auditoriums' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Danh Sách Phòng Chiếu &amp; Sơ Đồ Ghế
              </h2>
              <p className="text-xs text-muted-foreground">
                Mỗi phòng chiếu có sơ đồ ghế độc lập. Số ghế được tính toán tự động từ sơ đồ ghế.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                setAuditoriumModalState({
                  isOpen: true,
                  targetAuditorium: null,
                })
              }
              className="rounded-xl text-xs gap-1.5 cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm phòng chiếu</span>
            </Button>
          </div>

          {auditoriums.length === 0 ? (
            <EmptyState
              icon={Tv}
              title="Chưa có phòng chiếu nào"
              description="Cụm rạp này hiện chưa được cấu hình phòng chiếu. Hãy thêm phòng chiếu đầu tiên."
              className="py-12 bg-card rounded-2xl border border-border/70"
            />
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto scrollbar-thin">
                <table
                  className="w-full text-left text-xs border-collapse min-w-[760px]"
                  aria-label="Danh sách phòng chiếu"
                >
                  <thead>
                    <tr className="border-b border-border/60 bg-secondary/35 text-muted-foreground font-semibold">
                      <th scope="col" className="py-3 px-4 font-bold">
                        Tên phòng chiếu
                      </th>
                      <th scope="col" className="py-3 px-3 font-bold">
                        Định dạng công nghệ
                      </th>
                      <th scope="col" className="py-3 px-3 font-bold text-center">
                        Tổng số ghế (Layout)
                      </th>
                      <th scope="col" className="py-3 px-3 font-bold text-center">
                        Suất hôm nay
                      </th>
                      <th scope="col" className="py-3 px-3.5 font-bold text-center">
                        Trạng thái
                      </th>
                      <th scope="col" className="py-3 px-4 font-bold text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {auditoriums.map((aud) => {
                      const isMenuOpen = openAudMenuId === aud.id

                      return (
                        <tr
                          key={aud.id}
                          className="hover:bg-secondary/35 transition-colors duration-150"
                        >
                          {/* Room Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                              <Tv className="w-4 h-4 text-primary shrink-0" />
                              <span>{aud.name}</span>
                            </div>
                          </td>

                          {/* Technology Format */}
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-md text-[11px] font-bold border',
                                aud.format.includes('IMAX') &&
                                  'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
                                aud.format.includes('Dolby') &&
                                  'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
                                aud.format.includes('4DX') &&
                                  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                                aud.format.includes('ScreenX') &&
                                  'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
                                (aud.format === '2D' || aud.format === '3D') &&
                                  'bg-secondary text-foreground border-border/60'
                              )}
                            >
                              {aud.format}
                            </span>
                          </td>

                          {/* Total Seats (Derived) */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded-md border border-border/60">
                              {aud.totalSeats} ghế
                            </span>
                          </td>

                          {/* Active Showtimes */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {aud.activeShowtimesCount > 0 ? (
                              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                {aud.activeShowtimesCount} suất
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground/60">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <AdminStatusBadge status={aud.status} size="sm" />
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Seat Layout (Section 13) */}
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                                title="Mở sơ đồ ghế phòng chiếu này"
                              >
                                <Link to={`/admin/auditoriums/${aud.id}/seats`}>
                                  <Grid3X3 className="w-3.5 h-3.5" />
                                  <span>Sơ đồ ghế</span>
                                </Link>
                              </Button>

                              {/* Edit Room Modal */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={loadingAudId === aud.id}
                                onClick={() => handleOpenEditAuditorium(aud)}
                                className="h-7 text-xs rounded-lg text-muted-foreground hover:text-foreground cursor-pointer px-2"
                                title="Sửa tên hoặc định dạng phòng chiếu"
                              >
                                {loadingAudId === aud.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                ) : (
                                  <Pencil className="w-3.5 h-3.5" />
                                )}
                              </Button>

                              {/* Quick Action Popover */}
                              <Popover
                                open={isMenuOpen}
                                onOpenChange={(open) => setOpenAudMenuId(open ? aud.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                                    aria-label="Thao tác thêm"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="end"
                                  className="w-44 p-1.5 space-y-0.5 rounded-xl text-left"
                                >
                                  {aud.status !== 'active' && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickAuditoriumStatus(aud, 'active')}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Mở hoạt động</span>
                                    </button>
                                  )}
                                  {aud.status !== 'maintenance' && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickAuditoriumStatus(aud, 'maintenance')}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                                    >
                                      <Wrench className="w-3.5 h-3.5" />
                                      <span>Bảo trì thiết bị</span>
                                    </button>
                                  )}
                                  {aud.status !== 'inactive' && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickAuditoriumStatus(aud, 'inactive')}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Tạm ngưng</span>
                                    </button>
                                  )}
                                </PopoverContent>
                              </Popover>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TODAY SHOWTIMES (Suất chiếu hôm nay) */}
      {activeTab === 'showtimes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Suất Chiếu Đang Chạy Hôm Nay Tại Rạp
              </h2>
              <p className="text-xs text-muted-foreground">
                Lịch chiếu theo thời gian thực và tình trạng lấp đầy ghế
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 cursor-pointer font-semibold"
            >
              <Link to={`/admin/showtimes?theaterId=${theater.id}`}>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Quản lý lịch chiếu (Phần 14)</span>
              </Link>
            </Button>
          </div>

          {todayShowtimes.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Hôm nay không có suất chiếu nào"
              description="Cụm rạp hiện chưa được lên lịch suất chiếu cho ngày hôm nay."
              className="py-12 bg-card rounded-2xl border border-border/70"
            />
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto scrollbar-thin">
                <table
                  className="w-full text-left text-xs border-collapse min-w-[760px]"
                  aria-label="Danh sách suất chiếu hôm nay"
                >
                  <thead>
                    <tr className="border-b border-border/60 bg-secondary/35 text-muted-foreground font-semibold">
                      <th scope="col" className="py-3 px-4 font-bold">
                        Khung giờ
                      </th>
                      <th scope="col" className="py-3 px-4 font-bold">
                        Tên phim
                      </th>
                      <th scope="col" className="py-3 px-3 font-bold">
                        Phòng chiếu
                      </th>
                      <th scope="col" className="py-3 px-3 font-bold">
                        Định dạng
                      </th>
                      <th scope="col" className="py-3 px-3 font-bold text-center">
                        Ghế còn lại
                      </th>
                      <th scope="col" className="py-3 px-3.5 font-bold text-center">
                        Tỷ lệ lấp đầy
                      </th>
                      <th scope="col" className="py-3 px-3.5 font-bold text-center">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {todayShowtimes.map((st) => (
                      <tr
                        key={st.id}
                        className="hover:bg-secondary/35 transition-colors duration-150"
                      >
                        {/* Time */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-foreground text-sm">
                            {st.startTime}
                          </span>
                          <span className="text-muted-foreground text-[11px]"> - {st.endTime}</span>
                        </td>

                        {/* Movie */}
                        <td className="py-3 px-4 font-bold text-foreground">
                          <Link
                            to={`/admin/movies`}
                            className="hover:text-primary transition-colors line-clamp-1"
                          >
                            {st.movieTitle}
                          </Link>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Độ tuổi: {st.ageRating}
                          </span>
                        </td>

                        {/* Room */}
                        <td className="py-3 px-3 text-muted-foreground">
                          {st.roomName}
                        </td>

                        {/* Format */}
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border/60">
                            {st.format}
                          </span>
                        </td>

                        {/* Seats */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-mono text-xs">
                            <strong className="text-foreground">{st.remainingSeats}</strong> /{' '}
                            {st.totalSeats}
                          </span>
                        </td>

                        {/* Occupancy */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-14 h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  st.occupancyRate > 80
                                    ? 'bg-rose-500'
                                    : st.occupancyRate > 50
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                )}
                                style={{ width: `${st.occupancyRate}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold">
                              {st.occupancyRate}%
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {st.soldOut ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              Hết vé
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Đang bán
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: THEATER INFO (Thông tin chi tiết) */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Info card */}
          <div className="md:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Chi Tiết Cơ Sở Vật Chất</span>
              </h3>

              <div className="space-y-3 divide-y divide-border/50 text-xs">
                <div className="pt-2 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">Tên cụm rạp:</span>
                  <span className="font-bold text-foreground text-right">{theater.name}</span>
                </div>

                <div className="pt-3 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">Thành phố:</span>
                  <span className="font-bold text-foreground text-right">{theater.city}</span>
                </div>

                <div className="pt-3 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">Địa chỉ chi tiết:</span>
                  <span className="text-foreground text-right max-w-xs leading-relaxed">
                    {theater.address}
                  </span>
                </div>

                <div className="pt-3 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">Đường dây nóng:</span>
                  <span className="font-mono font-bold text-foreground text-right">
                    {theater.hotline}
                  </span>
                </div>

                <div className="pt-3 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">Giờ mở cửa:</span>
                  <span className="text-foreground text-right">{theater.openingHours}</span>
                </div>

                <div className="pt-3 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">Thời điểm thành lập:</span>
                  <span className="font-mono text-muted-foreground text-right">
                    {formatDateTime(theater.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Tiện Ích Khách Hàng &amp; Dịch Vụ Đi Kèm</span>
              </h3>

              <div className="flex flex-wrap gap-2 pt-1">
                {theater.features.map((feat) => (
                  <span
                    key={feat}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary text-foreground border border-border/60"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Image Preview */}
          <div className="md:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Hình Ảnh Không Gian Cụm Rạp
              </h3>
              <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-border/60 bg-secondary/40 relative">
                <img
                  src={theater.imageUrl}
                  alt={theater.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Auditorium Modal (Add & Edit) */}
      <AuditoriumModal
        isOpen={auditoriumModalState.isOpen}
        auditorium={auditoriumModalState.targetAuditorium}
        theaterName={theater.name}
        onSave={handleSaveAuditorium}
        onClose={() =>
          setAuditoriumModalState({
            isOpen: false,
            targetAuditorium: null,
          })
        }
      />
    </div>
  )
}
