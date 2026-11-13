import { cn } from '@/lib/utils'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
}

export function UserInitialsAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-primary shrink-0',
        className
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
