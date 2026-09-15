import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20",
        default:
          "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-border/50 hover:bg-secondary/80 hover:text-foreground",
        outline:
          "border border-border bg-transparent hover:bg-secondary hover:text-foreground",
        ghost:
          "bg-transparent hover:bg-secondary/70 hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground font-semibold shadow-sm hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20",
        link: "text-primary underline-offset-4 hover:underline cursor-pointer",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm gap-2",
        sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
        lg: "h-12 px-6 text-base font-semibold gap-2.5 rounded-lg",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot.Root
          ref={ref}
          data-slot="button"
          data-variant={variant}
          data-size={size}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </Slot.Root>
      )
    }

    return (
      <button
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "cursor-wait opacity-80"
        )}
        {...props}
      >
        {loading && (
          <Loader2
            className={cn(
              "size-4 animate-spin",
              size === "sm" && "size-3.5",
              size === "lg" && "size-5"
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
