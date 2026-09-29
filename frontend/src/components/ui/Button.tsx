'use client'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

const variants = {
  primary: 'k-button-primary',
  secondary: 'k-button-secondary',
  tertiary: 'k-button-tertiary',
  ghost: 'k-button-ghost',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
  compact?: boolean
  loading?: boolean
  loadingLabel?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      compact = false,
      loading = false,
      loadingLabel = 'Envoi…',
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        className={clsx(
          'k-button',
          variants[variant],
          compact && 'k-button-compact',
          className,
        )}
      >
        <span
          className={clsx(
            'col-start-1 row-start-1 flex items-center justify-center gap-2',
            loading && 'invisible',
          )}
          aria-hidden={loading || undefined}
        >
          {children}
        </span>
        {
          <span
            aria-hidden={!loading || undefined}
            className={clsx(
              'col-start-1 row-start-1 flex items-center justify-center gap-2',
              !loading && 'invisible',
            )}
          >
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {loadingLabel}
          </span>
        }
      </button>
    )
  },
)
