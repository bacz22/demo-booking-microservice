import { useState, useEffect } from 'react'
import {
  RotateCcw,
  Database,
  CheckCircle2,
} from 'lucide-react'
import type { AdminPeriod, AdminDashboardData } from '@/types/admin'
import { getDashboardData } from '@/mocks/admin/dashboard'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminStatCard } from '@/components/admin/common/admin-stat-card'
import { RevenueTrendChart } from '@/components/admin/dashboard/revenue-trend-chart'
import { BookingStatusBreakdownCard } from '@/components/admin/dashboard/booking-status-breakdown'
import { UpcomingShowtimesTable } from '@/components/admin/dashboard/upcoming-showtimes-table'
import { ActionRequiredCard } from '@/components/admin/dashboard/action-required-card'
import { RecentActivityCard } from '@/components/admin/dashboard/recent-activity-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<AdminPeriod>('7d')
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let isCancelled = false

    getDashboardData(period)
      .then((res) => {
        if (!isCancelled) {
          setData(res)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          toast.error('Không thể tải dữ liệu dashboard. Vui lòng thử lại.')
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [period])

  const handlePeriodChange = (newPeriod: AdminPeriod) => {
    if (newPeriod === period || isLoading || isRefreshing) return
    setIsLoading(true)
    setPeriod(newPeriod)
  }

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true)
      const res = await getDashboardData(period)
      setData(res)
      toast.success('Đã cập nhật số liệu mới nhất!')
    } catch {
      toast.error('Không thể làm mới dữ liệu.')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Period Selector & Actions */}
      <AdminPageHeader
        title="Tổng quan Vận hành"
        description="Giám sát thời gian thực các chỉ số doanh thu, tỷ lệ lấp đầy ghế và các cảnh báo hệ thống Microservices"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Tổng quan' },
        ]}
        lastUpdated={data?.lastUpdated}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period Selector */}
            <div className="inline-flex rounded-xl bg-card border border-border/70 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => handlePeriodChange('7d')}
                disabled={isLoading || isRefreshing}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  period === '7d'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('30d')}
                disabled={isLoading || isRefreshing}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  period === '30d'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                30 ngày qua
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('month')}
                disabled={isLoading || isRefreshing}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  period === 'month'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Tháng này
              </button>
            </div>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading || isRefreshing}
              className="h-9 rounded-xl text-xs gap-1.5 cursor-pointer"
              title="Làm mới dữ liệu từ server"
            >
              <RotateCcw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-primary')} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
        }
      />

      {/* 2. Mock Data Notice Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold mr-1.5">Chế độ Dữ liệu mẫu (Mock Data):</span>
            <span>Số liệu doanh thu, sự kiện Kafka và lịch chiếu đang chạy mô phỏng chuẩn kiến trúc microservices.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-amber-700 dark:text-amber-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Phiên bản: v1.0.0-rc</span>
        </div>
      </div>

      {/* 3. Skeleton Loading State or Render Dashboard Modules */}
      {isLoading || !data ? (
        <div className="space-y-6 animate-pulse">
          {/* 4 Stat cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-card/60 border border-border/60 p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>

          {/* Trend & Breakdown skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-96 rounded-2xl bg-card/60 border border-border/60 p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-4 h-96 rounded-2xl bg-card/60 border border-border/60 p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="h-72 rounded-2xl bg-card/60 border border-border/60 p-6 space-y-4">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-48 w-full" />
          </div>

          {/* Action items & Activity skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 rounded-2xl bg-card/60 border border-border/60 p-6 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-56 w-full" />
            </div>
            <div className="h-80 rounded-2xl bg-card/60 border border-border/60 p-6 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-56 w-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <AdminStatCard kpi={data.kpis.revenue} />
            <AdminStatCard kpi={data.kpis.bookings} />
            <AdminStatCard kpi={data.kpis.occupancyRate} />
            <AdminStatCard kpi={data.kpis.paymentSuccessRate} />
          </div>

          {/* Revenue Trend Chart & Booking Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
              <RevenueTrendChart data={data.trendPoints} className="h-full" />
            </div>
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
              <BookingStatusBreakdownCard data={data.statusBreakdown} className="h-full" />
            </div>
          </div>

          {/* Upcoming Showtimes Table */}
          <UpcomingShowtimesTable data={data.upcomingShowtimes} />

          {/* Action Required & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ActionRequiredCard items={data.actionItems} className="h-full" />
            <RecentActivityCard activities={data.activities} className="h-full" />
          </div>
        </div>
      )}
    </div>
  )
}
