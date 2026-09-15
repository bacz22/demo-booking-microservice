import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdminPaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  itemLabel?: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function AdminPagination({
  page,
  pageSize,
  total,
  totalPages,
  itemLabel = 'mục',
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  if (total === 0) return null

  const fromRecord = (page - 1) * pageSize + 1
  const toRecord = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-muted-foreground">
      {/* Record info & Page Size Selector */}
      <div className="flex items-center gap-3">
        <span>
          Hiển thị{' '}
          <strong className="text-foreground font-mono font-bold">
            {fromRecord} - {toRecord}
          </strong>{' '}
          trên tổng số <strong className="text-foreground font-mono font-bold">{total}</strong> {itemLabel}
        </span>

        <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
          <span className="hidden sm:inline">Số dòng:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger
              className="h-7 w-[70px] rounded-lg border-border/60 bg-secondary/50 px-2 text-xs font-mono"
              aria-label="Chọn số dòng trên mỗi trang"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-2.5 rounded-lg text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </Button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1]
              const showEllipsis = prev && p - prev > 1

              return (
                <div key={p} className="flex items-center gap-1">
                  {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    aria-current={p === page ? 'page' : undefined}
                    className={`h-7 w-7 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      p === page
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {p}
                  </button>
                </div>
              )
            })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-2.5 rounded-lg text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Trang sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default AdminPagination
