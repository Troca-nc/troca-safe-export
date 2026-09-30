import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { Button } from './Button'
import FeedbackAlert from './FeedbackAlert'
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={clsx(
        'h-5 animate-pulse rounded-control bg-cream-sunken motion-reduce:animate-none',
        className,
      )}
    />
  )
}
export function LoadingState({
  label = 'Chargement…',
  children,
}: {
  label?: string
  children?: ReactNode
}) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {children || (
        <>
          <Skeleton className="h-40" />
          <Skeleton />
          <Skeleton className="w-2/3" />
        </>
      )}
    </div>
  )
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <FeedbackAlert tone="error" title="Une erreur est survenue">
      <div className="flex flex-col items-start gap-4">
        <p>{message}</p>
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    </FeedbackAlert>
  )
}
