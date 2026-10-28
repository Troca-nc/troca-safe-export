'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Facebook, Link2, Mail, MessageCircle, Share2, Smartphone, X } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { buildShareTrackPayload, buildShareUrls, type ShareContent } from '@/lib/share'

type ShareSheetProps = {
  content: ShareContent
  variant?: 'full' | 'icon' | 'compact' | 'minimal'
  label?: string
  className?: string
}

function useClipboard() {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }

    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2200)
  }

  return { copied, copy }
}

export default function ShareSheet({ content, variant = 'full', label = 'Partager', className = '' }: ShareSheetProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { copied, copy } = useClipboard()
  const share = useMemo(() => buildShareUrls(content), [content])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    if (open) {
      document.addEventListener('mousedown', onClickOutside)
      document.addEventListener('keydown', onKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onToggleMenu = () => {
    setOpen((value) => !value)
  }

  const onCopy = async () => {
    void trackEvent('share_click', buildShareTrackPayload(content, 'copy'))
    await copy(share.url)
  }

  const openExternal = (url: string, channel: string) => {
    void trackEvent('share_click', buildShareTrackPayload(content, channel))
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const buttonClass =
    variant === 'icon'
      ? 'rounded-xl p-2 text-night/55 hover:bg-kalico-blue/8 hover:text-kalico-blue transition-colors'
      : variant === 'compact' || variant === 'minimal'
        ? 'inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-cream-surface px-3 py-2 text-sm font-medium text-night/70 hover:border-kalico-blue/30 hover:text-kalico-blue hover:bg-kalico-blue/5 transition-all'
        : 'inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-cream-surface px-4 py-2 text-sm font-medium text-night/70 hover:border-kalico-blue/30 hover:text-kalico-blue hover:bg-kalico-blue/5 transition-all'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={onToggleMenu}
        className={buttonClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        <Share2 size={variant === 'icon' ? 18 : 16} />
        {variant !== 'icon' && <span>{label}</span>}
        {variant === 'full' && <ChevronDown size={12} className="text-night/35" />}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-[1.25rem] border border-warm-border bg-cream-surface shadow-panel"
          role="menu"
          aria-label="Menu de partage"
        >
          <div className="flex items-center justify-between border-b border-night/6 px-4 py-3">
            <div className="min-w-0 pr-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-kalico-blue/80">Partager</p>
              <p className="truncate text-sm font-medium text-night">{content.title}</p>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-night/45 hover:bg-sand hover:text-night"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu de partage"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <button
              type="button"
              role="menuitem"
              onClick={() => openExternal(share.email, 'email')}
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-night/8 bg-sand/35 px-3 py-3 text-center transition-colors hover:border-kalico-blue/25 hover:bg-kalico-blue/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-kalico-blue/10 text-kalico-blue">
                <Mail size={17} />
              </span>
              <span className="text-sm font-semibold text-night">E-mail</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => openExternal(share.sms, 'sms')}
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-night/8 bg-sand/35 px-3 py-3 text-center transition-colors hover:border-kalico-blue/25 hover:bg-kalico-blue/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-night/10 text-night">
                <Smartphone size={17} />
              </span>
              <span className="text-sm font-semibold text-night">SMS</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => openExternal(share.messenger, 'messenger')}
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-night/8 bg-sand/35 px-3 py-3 text-center transition-colors hover:border-kalico-blue/25 hover:bg-kalico-blue/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-kalico-blue text-cream-surface">
                <Facebook size={17} />
              </span>
              <span className="text-sm font-semibold text-night">Messenger</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => openExternal(share.whatsapp, 'whatsapp')}
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-night/8 bg-sand/35 px-3 py-3 text-center transition-colors hover:border-jungle/25 hover:bg-jungle/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-jungle text-cream-surface">
                <MessageCircle size={17} />
              </span>
              <span className="text-sm font-semibold text-night">WhatsApp</span>
            </button>
          </div>

          <div className="border-t border-night/6 p-3">
            <button
              type="button"
              role="menuitem"
              onClick={onCopy}
              className="flex w-full items-center gap-3 rounded-2xl border border-night/8 bg-cream-surface px-3 py-3 text-left hover:border-kalico-blue/25 hover:bg-kalico-blue/5"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${copied ? 'bg-jungle/10 text-jungle' : 'bg-night/10 text-night'}`}>
                {copied ? <Check size={16} /> : <Link2 size={16} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-night">{copied ? 'Lien copié' : 'Copier le lien'}</p>
                <p className="truncate text-[11px] text-night/45">{share.url}</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
