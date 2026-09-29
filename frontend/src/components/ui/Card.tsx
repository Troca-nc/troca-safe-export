import type { HTMLAttributes } from 'react'
import clsx from 'clsx'
export function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        'min-w-0 rounded-card border border-sand bg-cream-surface p-6 text-ink shadow-card transition-colors hover:border-ink',
        className,
      )}
    >
      {children}
    </div>
  )
}
export function DeepPanel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        'on-deep motif-tressage relative isolate overflow-hidden rounded-block p-6',
        className,
      )}
    >
      <div className="relative">{children}</div>
    </div>
  )
}
