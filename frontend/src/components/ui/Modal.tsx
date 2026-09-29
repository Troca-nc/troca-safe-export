'use client'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeCallback = useRef(onClose)
  closeCallback.current = onClose
  const titleId = useId()
  useEffect(() => {
    const element = dialog.current
    if (!element || !open) return
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const overflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open])
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-modal="true"
      className="k-modal"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const items = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
          ) || [],
        ).filter(
          (item) => item.tabIndex >= 0 && item.getClientRects().length > 0,
        )
        const first = items[0],
          last = items[items.length - 1]
        if (!first) {
          event.preventDefault()
          return
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        closeCallback.current()
      }}
      onClose={() => {
        if (open) closeCallback.current()
      }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-sand p-6">
        <h2 id={titleId} className="font-display text-h3 font-normal text-ink">
          {title}
        </h2>
        <Button
          variant="tertiary"
          compact
          className="w-11 px-0"
          loadingLabel=""
          aria-label="Fermer la fenêtre"
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
      <div className="min-w-0 p-6 text-body-sm text-ink">{children}</div>
      {footer && (
        <div className="flex flex-wrap items-center gap-3 border-t border-sand p-6">
          {footer}
        </div>
      )}
    </dialog>
  )
}
