'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Image as ImageIcon, TrendingUp, X, Loader2, Mic, Square, Paperclip, FileText, Trash2 } from 'lucide-react'
import { uploadApi } from '@/lib/api'

interface ChatInputProps {
  onSendText: (text: string) => Promise<void>
  onSendPhoto: (url: string) => Promise<void>
  onSendDocument: (payload: {
    url: string
    name: string
    mimeType: string
    sizeBytes?: number | null
  }) => Promise<void>
  onSendAudio: (url: string) => Promise<void>
  onMakeOffer: (amount: number) => Promise<void>
  onTyping: () => void
  isBuyer: boolean
  annoncePrix?: number | null
  disabled?: boolean
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Impossible de lire le fichier audio'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(blob)
  })
}

function formatBytes(value?: number | null) {
  if (!value || value <= 0) return null
  const units = ['o', 'Ko', 'Mo', 'Go']
  let current = value
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  const rounded = current >= 10 || index === 0 ? Math.round(current) : current.toFixed(1)
  return `${rounded} ${units[index]}`
}

function snapTo10(value: number) {
  return Math.max(0, Math.round(value / 10) * 10)
}

export default function ChatInput({
  onSendText,
  onSendPhoto,
  onSendDocument,
  onSendAudio,
  onMakeOffer,
  onTyping,
  isBuyer,
  annoncePrix,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [offerAmt, setOfferAmt] = useState(annoncePrix ? String(Math.round(annoncePrix * 0.9)) : '')
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingMs, setRecordingMs] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [pendingDocument, setPendingDocument] = useState<{
    file: File
    name: string
    mimeType: string
    sizeBytes: number
  } | null>(null)
  const [pendingDocumentPreviewUrl, setPendingDocumentPreviewUrl] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)
  const recorderTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (recorderTimerRef.current) window.clearInterval(recorderTimerRef.current)
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop())
      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (pendingDocumentPreviewUrl) URL.revokeObjectURL(pendingDocumentPreviewUrl)
    }
  }, [pendingDocumentPreviewUrl])

  useEffect(() => {
    if (!pendingDocument) {
      if (pendingDocumentPreviewUrl) {
        URL.revokeObjectURL(pendingDocumentPreviewUrl)
        setPendingDocumentPreviewUrl(null)
      }
      return
    }

    const url = URL.createObjectURL(pendingDocument.file)
    setPendingDocumentPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingDocument])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    onTyping()
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleSend = useCallback(async () => {
    if (pendingDocument) {
      if (uploading) return
      setUploading(true)
      try {
        const res = await uploadApi.uploadChatDocument(pendingDocument.file)
        const payload = res.data?.data
        const url = payload?.url
        if (url) {
          await onSendDocument({
            url,
            name: payload?.filename || pendingDocument.name,
            mimeType: payload?.mime_type || pendingDocument.mimeType || pendingDocument.file.type || 'application/octet-stream',
            sizeBytes: payload?.size_bytes ?? pendingDocument.sizeBytes ?? null,
          })
          setPendingDocument(null)
        }
      } catch (err) {
        console.error('[chat-document]', err)
      } finally {
        setUploading(false)
        if (documentInputRef.current) documentInputRef.current.value = ''
      }
      return
    }

    if (!text.trim() || sending) return
    setSending(true)
    const msg = text.trim()
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await onSendText(msg)
    setSending(false)
    textareaRef.current?.focus()
  }, [pendingDocument, uploading, text, sending, onSendText, onSendDocument])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingDocument({
      file,
      name: file.name || 'document',
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size || 0,
    })
    if (documentInputRef.current) documentInputRef.current.value = ''
  }

  const handleCancelDocument = () => {
    setPendingDocument(null)
    if (documentInputRef.current) documentInputRef.current.value = ''
  }

  const stopAudioRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    await new Promise<void>((resolve) => {
      recorder.addEventListener('stop', async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          audioChunksRef.current = []
          const dataUrl = await blobToDataUrl(blob)
          const res = await uploadApi.uploadChatAudio(dataUrl, blob.type || 'audio/webm')
          const url = res.data?.data?.url
          if (url) {
            await onSendAudio(url)
          }
        } catch (error) {
          console.error('[chat-audio]', error)
          setAudioError('Impossible d’envoyer le message vocal')
        } finally {
          setRecording(false)
          setRecordingMs(0)
          if (recorderTimerRef.current) window.clearInterval(recorderTimerRef.current)
          recorderTimerRef.current = null
          mediaRecorderRef.current = null
          audioStreamRef.current?.getTracks().forEach((track) => track.stop())
          audioStreamRef.current = null
          resolve()
        }
      }, { once: true })
      recorder.stop()
    })
  }, [onSendAudio])

  const startAudioRecording = useCallback(async () => {
    if (recording || disabled || uploading) return
    setAudioError(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setAudioError('L’enregistrement audio n’est pas disponible sur ce navigateur')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const supportedMime =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg'
        : ''
      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined)
      mediaRecorderRef.current = recorder
      audioStreamRef.current = stream
      audioChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.start()
      setRecording(true)
      setRecordingMs(0)
      recorderTimerRef.current = window.setInterval(() => {
        setRecordingMs((value) => value + 1000)
      }, 1000)
    } catch (error) {
      console.error('[chat-audio]', error)
      setAudioError('Impossible d’accéder au micro')
    }
  }, [recording, disabled, uploading])

  const handleAudioPressStart = () => {
    void startAudioRecording()
  }

  const handleAudioPressEnd = () => {
    void stopAudioRecording()
  }

  const handleOffer = async () => {
    const amount = snapTo10(parseInt(offerAmt.replace(/\s/g, '')))
    if (!amount || amount <= 0) return
    setOfferOpen(false)
    await onMakeOffer(amount)
  }

  const recordingLabel = recording
    ? `Enregistrement ${Math.max(1, Math.ceil(recordingMs / 1000))}s`
    : 'Maintenir pour enregistrer'
  const pendingDocumentLabel = pendingDocument
    ? `${pendingDocument.mimeType || 'Document'}${formatBytes(pendingDocument.sizeBytes) ? ` · ${formatBytes(pendingDocument.sizeBytes)}` : ''}`
    : null
  const pendingDocumentKind = pendingDocument?.mimeType?.startsWith('image/')
    ? 'image'
    : pendingDocument?.mimeType === 'application/pdf'
      ? 'pdf'
      : 'file'

  return (
    <div className="border-t border-night/8 bg-white">
      {offerOpen && (
        <div className="px-4 py-3 border-b border-night/8 bg-sand/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-night flex items-center gap-1">
              <TrendingUp size={13} className="text-coral" />
              Faire une offre
            </p>
            <button type="button" onClick={() => setOfferOpen(false)}>
              <X size={14} className="text-night/40" />
            </button>
          </div>
          {annoncePrix != null && (
            <p className="text-[10px] text-night/40 mb-2">
              Prix affiché : {annoncePrix.toLocaleString('fr-FR')} XPF
            </p>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min={0}
                step={10}
                value={offerAmt}
                onChange={(e) => setOfferAmt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleOffer() }}
                placeholder="Montant en XPF"
                className="input w-full pr-12 text-sm"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-night/40">XPF</span>
            </div>
            <button
              type="button"
              onClick={handleOffer}
              disabled={!offerAmt}
              className="btn-primary text-sm px-4 disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
          {annoncePrix != null && (
            <div className="flex gap-1.5 mt-2">
              {[0.7, 0.8, 0.9].map((ratio) => {
                const amount = snapTo10(Math.round(annoncePrix * ratio))
                return (
                  <button
                    key={ratio}
                    type="button"
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

      <div className="px-3 pt-2 text-[11px] text-center text-night/40 min-h-[18px]">
        {audioError ?? (recording ? recordingLabel : '')}
      </div>

      {pendingDocument && (
        <div className="mx-3 mb-2 rounded-2xl border border-nc-emeraudeBorder bg-nc-emeraudeLight px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-nc-emeraudeText">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-night">{pendingDocument.name}</p>
              <p className="truncate text-xs text-night/55">{pendingDocumentLabel}</p>
              <p className="mt-1 text-[11px] text-night/45">Prévisualisation avant envoi</p>
            </div>
            <button
              type="button"
              onClick={handleCancelDocument}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/45 transition-colors hover:text-coral"
              aria-label="Annuler le document"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-white/70 bg-white/80">
            {pendingDocumentKind === 'image' && pendingDocumentPreviewUrl ? (
              <img
                src={pendingDocumentPreviewUrl}
                alt={pendingDocument.name}
                className="h-40 w-full object-cover"
              />
            ) : pendingDocumentKind === 'pdf' && pendingDocumentPreviewUrl ? (
              <iframe
                title={`Aperçu ${pendingDocument.name}`}
                src={pendingDocumentPreviewUrl}
                className="h-48 w-full border-0 bg-sand"
              />
            ) : (
              <div className="flex h-24 items-center gap-3 px-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nc-emeraudeLight text-nc-emeraudeText">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-night">Aperçu du document</p>
                  <p className="text-xs text-night/50">Le fichier sera transmis après validation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || recording || Boolean(pendingDocument)}
          className="p-2 text-night/40 hover:text-coral hover:bg-coral/8 rounded-xl transition-all shrink-0 disabled:opacity-40"
          aria-label="Envoyer une photo"
        >
          {uploading
            ? <Loader2 size={18} className="animate-spin" />
            : <ImageIcon size={18} />
          }
        </button>

        <button
          type="button"
          onClick={() => documentInputRef.current?.click()}
          disabled={disabled || uploading || recording || Boolean(pendingDocument)}
          className="p-2 text-night/40 hover:text-coral hover:bg-coral/8 rounded-xl transition-all shrink-0 disabled:opacity-40"
          aria-label="Envoyer un document"
        >
          <Paperclip size={18} />
        </button>

        {isBuyer && (
          <button
            type="button"
            onClick={() => setOfferOpen(!offerOpen)}
            disabled={disabled || recording || Boolean(pendingDocument)}
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

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={pendingDocument ? 'Envoyez ou annulez le document en attente…' : recording ? 'Enregistrement audio en cours…' : 'Votre message…'}
            disabled={disabled || sending || recording || Boolean(pendingDocument)}
            rows={1}
            className="flex-1 resize-none bg-sand rounded-2xl px-3.5 py-2.5 text-sm text-night outline-none placeholder:text-night/35 disabled:opacity-50 max-h-[120px] leading-relaxed"
            style={{ minHeight: '42px' }}
          />

        <button
          type="button"
          onPointerDown={handleAudioPressStart}
          onPointerUp={handleAudioPressEnd}
          onPointerCancel={handleAudioPressEnd}
          onPointerLeave={recording ? handleAudioPressEnd : undefined}
          disabled={disabled || uploading || sending || Boolean(pendingDocument)}
          className={`p-2.5 rounded-xl transition-all shrink-0 disabled:opacity-30 ${
            recording ? 'bg-rose-500 text-white' : 'bg-night text-white hover:bg-ocean'
          }`}
          aria-label={recording ? 'Arrêter l’enregistrement' : 'Maintenir pour enregistrer un message vocal'}
        >
          {recording ? <Square size={16} /> : <Mic size={16} />}
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={(pendingDocument ? false : !text.trim()) || sending || disabled || recording || uploading}
          className="p-2.5 bg-coral text-white rounded-xl hover:bg-coral-dark transition-all shrink-0 disabled:opacity-30"
          aria-label={pendingDocument ? 'Envoyer le document' : 'Envoyer le message'}
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

      <input
        ref={documentInputRef}
        type="file"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleDocumentUpload}
        aria-hidden="true"
      />
    </div>
  )
}
