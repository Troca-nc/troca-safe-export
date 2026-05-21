// src/components/messages/ChatInput.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Image as ImageIcon, TrendingUp, X, Loader2 } from 'lucide-react'
import { uploadApi } from '@/lib/api'

interface ChatInputProps {
  onSendText:   (text: string)   => Promise<void>
  onSendPhoto:  (url: string)    => Promise<void>
  onMakeOffer:  (amount: number) => Promise<void>
  onTyping:     () => void
  isBuyer:      boolean           // seul l'acheteur peut faire des offres
  annoncePrix?: number | null     // prix de référence pour l'offre
  disabled?:    boolean
}

export default function ChatInput({
  onSendText, onSendPhoto, onMakeOffer,
  onTyping, isBuyer, annoncePrix, disabled,
}: ChatInputProps) {
  const [text,       setText]       = useState('')
  const [sending,    setSending]    = useState(false)
  const [offerOpen,  setOfferOpen]  = useState(false)
  const [offerAmt,   setOfferAmt]   = useState(annoncePrix ? String(Math.round(annoncePrix * 0.9)) : '')
  const [uploading,  setUploading]  = useState(false)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize du textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    onTyping()
    // Resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // Envoi texte
  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const msg = text.trim()
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await onSendText(msg)
    setSending(false)
    textareaRef.current?.focus()
  }, [text, sending, onSendText])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Upload photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadApi.uploadChatPhoto(file)
      const url = res.data?.data?.url
      if (url) {
        await onSendPhoto(url)
      }
    } catch (err) {
      console.error('[chat-photo]', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Offre de prix
  const handleOffer = async () => {
    const amount = parseInt(offerAmt.replace(/\s/g, ''))
    if (!amount || amount <= 0) return
    setOfferOpen(false)
    await onMakeOffer(amount)
  }

  return (
    <div className="border-t border-night/8 bg-white">

      {/* ── Panneau offre ──────────────────────────────────────────────── */}
      {offerOpen && (
        <div className="px-4 py-3 border-b border-night/8 bg-sand/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-night flex items-center gap-1">
              <TrendingUp size={13} className="text-coral" />
              Faire une offre
            </p>
            <button onClick={() => setOfferOpen(false)}>
              <X size={14} className="text-night/40" />
            </button>
          </div>
          {annoncePrix && (
            <p className="text-[10px] text-night/40 mb-2">
              Prix affiché : {annoncePrix.toLocaleString('fr-FR')} XPF
            </p>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={offerAmt}
                onChange={e => setOfferAmt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleOffer() }}
                placeholder="Montant en XPF"
                className="input w-full pr-12 text-sm"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-night/40">XPF</span>
            </div>
            <button
              onClick={handleOffer}
              disabled={!offerAmt}
              className="btn-primary text-sm px-4 disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
          {/* Suggestions rapides */}
          {annoncePrix && (
            <div className="flex gap-1.5 mt-2">
              {[0.7, 0.8, 0.9].map(ratio => {
                const amount = Math.round(annoncePrix * ratio)
                return (
                  <button
                    key={ratio}
                    onClick={() => setOfferAmt(String(amount))}
                    className="text-[10px] border border-night/10 rounded-full px-2 py-0.5 text-night/50 hover:border-coral hover:text-coral transition-colors"
                  >
                    -{Math.round((1 - ratio) * 100)}% · {amount.toLocaleString('fr-FR')}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Zone de saisie ──────────────────────────────────────────────── */}
      <div className="flex items-end gap-2 px-3 py-2.5">

        {/* Bouton photo */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 text-night/40 hover:text-coral hover:bg-coral/8 rounded-xl transition-all shrink-0 disabled:opacity-40"
          aria-label="Envoyer une photo"
        >
          {uploading
            ? <Loader2 size={18} className="animate-spin" />
            : <ImageIcon size={18} />
          }
        </button>

        {/* Bouton offre — acheteur uniquement */}
        {isBuyer && (
          <button
            type="button"
            onClick={() => setOfferOpen(!offerOpen)}
            disabled={disabled}
            className={`p-2 rounded-xl transition-all shrink-0 disabled:opacity-40 ${
              offerOpen
                ? 'text-coral bg-coral/10'
                : 'text-night/40 hover:text-coral hover:bg-coral/8'
            }`}
            aria-label="Faire une offre de prix"
          >
            <TrendingUp size={18} />
          </button>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Votre message…"
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none bg-sand rounded-2xl px-3.5 py-2.5 text-sm text-night outline-none placeholder:text-night/35 disabled:opacity-50 max-h-[120px] leading-relaxed"
          style={{ minHeight: '42px' }}
        />

        {/* Bouton envoyer */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="p-2.5 bg-coral text-white rounded-xl hover:bg-coral-dark transition-all shrink-0 disabled:opacity-30"
          aria-label="Envoyer le message"
        >
          {sending
            ? <Loader2 size={16} className="animate-spin" />
            : <Send size={16} />
          }
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handlePhotoUpload}
        aria-hidden="true"
      />
    </div>
  )
}
