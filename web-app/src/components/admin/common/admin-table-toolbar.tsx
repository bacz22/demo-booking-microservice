import { CheckSquare, Trash2, Sparkles, Film, Clock, X } from 'lucide-react'
import type { AdminMovieStatus } from '@/types/admin-movie'
import { Button } from '@/components/ui/button'

interface AdminTableToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkStatusChange: (status: AdminMovieStatus) => void
  onBulkDelete: () => void
}

export function AdminTableToolbar({
  selectedCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkDelete,
}: AdminTableToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150"
      role="toolbar"
      aria-label="Thanh tác vụ hàng loạt"
    >
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-foreground">
          Đã chọn <span className="font-mono text-primary font-black">{selectedCount}</span> phim
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
          Tác vụ hàng loạt:
        </span>

        {/* Quick status change buttons */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onBulkStatusChange('now-showing')}
          className="h-7 text-[11px] rounded-lg gap-1 bg-card hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 cursor-pointer"
        >
          <Film className="w-3 h-3 text-emerald-500" />
          <span>Chiếu ngay</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onBulkStatusChange('coming-soon')}
          className="h-7 text-[11px] rounded-lg gap-1 bg-card hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/30 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-sky-500" />
          <span>Sắp chiếu</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onBulkStatusChange('ended')}
          className="h-7 text-[11px] rounded-lg gap-1 bg-card hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-400 hover:border-slate-500/30 cursor-pointer"
        >
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Ngừng chiếu</span>
        </Button>

        {/* Bulk Delete */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBulkDelete}
          className="h-7 text-[11px] rounded-lg gap-1 bg-card text-rose-600 dark:text-rose-400 border-rose-500/40 hover:bg-rose-500/10 hover:border-rose-500/50 cursor-pointer font-bold"
        >
          <Trash2 className="w-3 h-3" />
          <span>Xóa ({selectedCount})</span>
        </Button>

        {/* Clear selection */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 text-[11px] rounded-lg gap-1 text-muted-foreground hover:text-foreground cursor-pointer px-2"
          title="Bỏ chọn tất cả"
        >
          <X className="w-3 h-3" />
          <span>Bỏ chọn</span>
        </Button>
      </div>
    </div>
  )
}

export default AdminTableToolbar
