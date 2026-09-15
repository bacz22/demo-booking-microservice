import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ThemeToggleProps {
  className?: string
  variant?: 'ghost' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function ThemeToggle({
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className={cn(
        'relative text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-45 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 hover:-rotate-12 text-slate-700" aria-hidden="true" />
      )}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {isDark ? 'Giao diện sáng' : 'Giao diện tối'}
        </span>
      )}
    </Button>
  )
}

export default ThemeToggle
