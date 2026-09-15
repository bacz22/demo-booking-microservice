import * as React from 'react'
import { Link } from 'react-router-dom'
import { Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

export interface EmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>
  title: string
  description?: React.ReactNode
  action?: React.ReactNode | EmptyStateAction
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!Icon) {
      return <Film className="h-7 w-7 sm:h-8 sm:w-8 stroke-1" aria-hidden="true" />
    }
    if (React.isValidElement(Icon)) {
      return Icon
    }
    if (typeof Icon === 'function' || typeof Icon === 'object') {
      const Component = Icon as React.ComponentType<{ className?: string }>
      return <Component className="h-7 w-7 sm:h-8 sm:w-8 stroke-1" />
    }
    return Icon as React.ReactNode
  }

  const renderAction = () => {
    if (!action) return null
    if (React.isValidElement(action)) return action

    if (typeof action === 'object' && 'label' in action) {
      const { label, href, onClick, icon: ActionIcon } = action as EmptyStateAction
      if (href) {
        return (
          <Button asChild variant="primary" size="default" className="font-bold shadow-lg shadow-primary/20">
            <Link to={href}>
              {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
              <span>{label}</span>
            </Link>
          </Button>
        )
      }
      if (onClick) {
        return (
          <Button type="button" variant="outline" size="sm" onClick={onClick}>
            {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
            <span>{label}</span>
          </Button>
        )
      }
    }

    return action as React.ReactNode
  }

  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 sm:p-12 text-center backdrop-blur-sm animate-in fade-in-50 duration-200',
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-secondary/80 border border-border/50 text-muted-foreground shadow-xs">
        {renderIcon()}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5 sm:mt-6">{renderAction()}</div>}
    </div>
  )
}

export default EmptyState
