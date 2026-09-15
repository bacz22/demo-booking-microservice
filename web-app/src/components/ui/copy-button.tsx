import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CopyButtonProps {
  /** Văn bản cần sao chép */
  text: string
  /** Tooltip khi chưa sao chép */
  title?: string
  /** Tooltip sau khi sao chép thành công */
  successTitle?: string
  /** Kích thước nút */
  size?: 'sm' | 'default' | 'lg'
  className?: string
  /** Callback sau khi sao chép */
  onCopy?: () => void
}

export function CopyButton({
  text,
  title = 'Sao chép',
  successTitle = 'Đã sao chép!',
  size = 'default',
  className,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback nếu clipboard API bị chặn
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sizeClasses = {
    sm: 'h-7 w-7 rounded-md p-1.5',
    default: 'h-8 w-8 rounded-lg p-2',
    lg: 'h-10 w-10 rounded-xl p-2.5',
  }[size]

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size]

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? successTitle : title}
      aria-label={copied ? successTitle : title}
      className={cn(
        'inline-flex items-center justify-center border border-border/50 bg-background/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs active:scale-95',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary',
        copied && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
        sizeClasses,
        className
      )}
    >
      {copied ? (
        <Check className={cn(iconSizes, 'text-emerald-500 animate-in zoom-in-75')} aria-hidden="true" />
      ) : (
        <Copy className={iconSizes} aria-hidden="true" />
      )}
    </button>
  )
}

export default CopyButton
