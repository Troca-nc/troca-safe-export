'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Copy, Facebook, Instagram, Link2, Mail, MessageCircle, Send, Share2, Smartphone, X } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { buildShareMessage, buildShareTrackPayload, buildShareUrls, type ShareContent } from '@/lib/share'

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
  const [loadingNative, setLoadingNative] = useState(false)
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

  const onShareAttempt = async () => {
    void trackEvent('share_click', buildShareTrackPayload(content, 'native'))

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        setLoadingNative(true)
        await navigator.share({
          title: content.title,
          text: buildShareMessage(content),
          url: share.url,
        })
        setLoadingNative(false)
        return
      } catch {
        setLoadingNative(false)
      }
    }

    setOpen((value) => !value)
  }

  const onCopy = async () => {
    void trackEvent('share_click', buildShareTrackPayload(content, 'copy'))
    await copy(share.url)
    setOpen(false)
  }

  const onCopyInstagram = async () => {
    void trackEvent('share_click', buildShareTrackPayload(content, 'instagram'))
    await copy(share.instagramCaption)
    setOpen(false)
  }

  const openExternal = (url: string, channel: string) => {
    void trackEvent('share_click', buildShareTrackPayload(content, channel))
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const buttonClass =
    variant === 'icon'
      ? 'rounded-xl p-2 text-night/55 hover:bg-coral/8 hover:text-coral transition-colors'
      : variant === 'compact' || variant === 'minimal'
        ? 'inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-3 py-2 text-sm font-medium text-night/70 hover:border-coral/30 hover:text-coral hover:bg-coral/5 transition-all'
        : 'inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2 text-sm font-medium text-night/70 hover:border-coral/30 hover:text-coral hover:bg-coral/5 transition-all'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={onShareAttempt}
        className={buttonClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        <Share2 size={variant === 'icon' ? 18 : 16} />
        {variant !== 'icon' && <span>{loadingNative ? 'Partage...' : label}</span>}
        {variant === 'full' && <ChevronDown size={12} className="text-night/35" />}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,24rem)] overflow-hidden rounded-[1.5rem] border border-night/10 bg-white shadow-[0_24px_80px_rgba(8,32,50,0.18)]"
          role="menu"
          aria-label="Menu de partage"
        >
          <div className="flex items-center justify-between border-b border-night/6 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral/80">Partager</p>
              <p className="text-sm font-medium text-night">{content.title}</p>
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

          <div className="grid gap-2 p-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onShareAttempt}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-coral/25 hover:bg-coral/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral/10 text-coral">
                <Smartphone size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-night">Partage natif</p>
                <p className="truncate text-[11px] text-night/45">Apps installées et fonctions système</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openExternal(share.whatsapp, 'whatsapp')}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-[#25D366]/25 hover:bg-[#25D366]/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white">
                <MessageCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-night">WhatsApp</p>
                <p className="text-[11px] text-night/45">Envoi direct ou fallback web</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openExternal(share.messenger, 'messenger')}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-[#1877F2]/25 hover:bg-[#1877F2]/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] text-white">
                <Facebook size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-night">Messenger</p>
                <p className="text-[11px] text-night/45">Lien partagé à vos contacts</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openExternal(share.telegram, 'telegram')}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-[#2AABEE]/25 hover:bg-[#2AABEE]/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2AABEE] text-white">
                <Send size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-night">Telegram</p>
                <p className="text-[11px] text-night/45">Message vers canal ou DM</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openExternal(share.facebook, 'facebook')}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-[#1877F2]/25 hover:bg-[#1877F2]/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] text-white">
                <Facebook size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-night">Facebook</p>
                <p className="text-[11px] text-night/45">Mur, groupe ou message</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openExternal(share.x, 'x')}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-night/20 hover:bg-night/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-night text-white">
                <span className="text-sm font-bold">X</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-night">X / Twitter</p>
                <p className="text-[11px] text-night/45">Texte + lien</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openExternal(share.email, 'email')}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-night/20 hover:bg-night/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-night/10 text-night">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-night">Email</p>
                <p className="text-[11px] text-night/45">Ouvrir votre messagerie</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openExternal(share.sms, 'sms')}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-night/20 hover:bg-night/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-night/10 text-night">
                <Copy size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-night">SMS</p>
                <p className="text-[11px] text-night/45">Message court avec lien</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onCopyInstagram}
              className="flex items-center gap-3 rounded-2xl border border-night/8 bg-sand/40 px-3 py-3 text-left hover:border-[#C13584]/25 hover:bg-[#C13584]/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white">
                <Instagram size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-night">Instagram</p>
                <p className="text-[11px] text-night/45">Copie un texte compatible Instagram</p>
              </div>
            </button>
          </div>

          <div className="border-t border-night/6 p-3">
            <button
              type="button"
              onClick={onCopy}
              className="flex w-full items-center gap-3 rounded-2xl border border-night/8 bg-white px-3 py-3 text-left hover:border-coral/25 hover:bg-coral/5"
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
