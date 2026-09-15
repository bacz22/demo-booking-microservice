import React from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface MovieSearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
}

export function MovieSearchInput({
  value,
  onChange,
  onClear,
  loading = false,
  disabled = false,
  placeholder = 'Tìm kiếm theo tên phim, đạo diễn, diễn viên...',
  className,
  id = 'movie-search-input',
}: MovieSearchInputProps) {
  const handleClear = () => {
    if (onClear) {
      onClear()
    } else {
      onChange('')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div
      role="search"
      className={cn('relative flex w-full items-center', className)}
    >
      {/* 1. Search Icon (Left) */}
      <Search
        className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground/70"
        aria-hidden="true"
      />

      {/* 2. Input Field */}
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Tìm kiếm phim"
        className={cn(
          'pl-10 pr-10 bg-card/60 shadow-sm focus:bg-card/90',
          loading && 'pr-10'
        )}
      />

      {/* 3. Right Side: Loading Indicator hoặc Clear Button */}
      <div className="absolute right-3 flex items-center">
        {loading ? (
          <Loader2
            className="h-4 w-4 animate-spin text-primary"
            aria-label="Đang tìm kiếm..."
            role="status"
          />
        ) : (
          Boolean(value) &&
          !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xóa từ khóa tìm kiếm"
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )
        )}
      </div>
    </div>
  )
}

export default MovieSearchInput
