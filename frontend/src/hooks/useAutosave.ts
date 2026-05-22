'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SAVE_DRAFT_EVENT_NAME } from '@/lib/draftEvents'

type DraftEnvelope<T> = {
  data: T
  savedAt: string
}

type UseAutosaveResult<T> = {
  pendingDraft: DraftEnvelope<T> | null
  hasPendingDraft: boolean
  draftAgeLabel: string | null
  isDirty: boolean
  saveNow: () => void
  acceptDraft: (draft?: DraftEnvelope<T> | null) => void
  discardDraft: () => void
  clearDraft: () => void
}

function stableSerialize(value: unknown): string {
  if (value == null) return ''
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${key}:${stableSerialize(item)}`)

  return `{${entries.join(',')}}`
}

function formatDraftAge(savedAt: string | null): string | null {
  if (!savedAt) return null

  const savedDate = new Date(savedAt)
  if (Number.isNaN(savedDate.getTime())) return null

  const ageMinutes = Math.max(0, Math.floor((Date.now() - savedDate.getTime()) / 60_000))
  if (ageMinutes < 1) return 'il y a moins d\'une minute'
  return `il y a ${ageMinutes} minute${ageMinutes > 1 ? 's' : ''}`
}

export function useAutosave<T extends Record<string, unknown>>(formKey: string, data: T, interval = 30_000): UseAutosaveResult<T> {
  const initialSignatureRef = useRef(stableSerialize(data))
  const lastSavedSignatureRef = useRef(initialSignatureRef.current)
  const currentDataRef = useRef(data)
  const currentSignature = useMemo(() => stableSerialize(data), [data])
  const [pendingDraft, setPendingDraft] = useState<DraftEnvelope<T> | null>(null)
  const [promptResolved, setPromptResolved] = useState(true)

  useEffect(() => {
    currentDataRef.current = data
  }, [data])

  useEffect(() => {
    if (typeof window === 'undefined') return

    initialSignatureRef.current = stableSerialize(currentDataRef.current)
    lastSavedSignatureRef.current = initialSignatureRef.current

    try {
      const raw = window.localStorage.getItem(formKey)
      if (!raw) {
        setPendingDraft(null)
        setPromptResolved(true)
        return
      }

      const parsed = JSON.parse(raw) as DraftEnvelope<T>
      if (!parsed || typeof parsed !== 'object' || !('data' in parsed) || !('savedAt' in parsed)) {
        setPendingDraft(null)
        setPromptResolved(true)
        return
      }

      setPendingDraft(parsed)
      lastSavedSignatureRef.current = stableSerialize(parsed.data)
      setPromptResolved(false)
    } catch {
      setPendingDraft(null)
      setPromptResolved(true)
    }
  }, [formKey])

  const saveNow = useCallback(() => {
    if (typeof window === 'undefined') return

    const nextData = currentDataRef.current
    const nextSignature = stableSerialize(nextData)
    const baseline = promptResolved ? lastSavedSignatureRef.current : initialSignatureRef.current
    if (nextSignature === baseline) return

    const envelope: DraftEnvelope<T> = {
      data: nextData,
      savedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(formKey, JSON.stringify(envelope))
    lastSavedSignatureRef.current = nextSignature
    setPendingDraft(envelope)
  }, [formKey, promptResolved])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onSaveDraft = () => {
      saveNow()
    }

    window.addEventListener(SAVE_DRAFT_EVENT_NAME, onSaveDraft)
    return () => window.removeEventListener(SAVE_DRAFT_EVENT_NAME, onSaveDraft)
  }, [saveNow])

  useEffect(() => {
    if (!promptResolved) return

    const nextSignature = currentSignature
    if (nextSignature === lastSavedSignatureRef.current) return

    const debounce = window.setTimeout(() => {
      saveNow()
    }, 2_000)

    return () => window.clearTimeout(debounce)
  }, [currentSignature, promptResolved, saveNow])

  useEffect(() => {
    if (!promptResolved) return

    const ticker = window.setInterval(() => {
      saveNow()
    }, interval)

    return () => window.clearInterval(ticker)
  }, [interval, promptResolved, saveNow])

  const acceptDraft = useCallback((draft?: DraftEnvelope<T> | null) => {
    const nextDraft = draft ?? pendingDraft
    if (nextDraft) {
      lastSavedSignatureRef.current = stableSerialize(nextDraft.data)
    }
    setPendingDraft(null)
    setPromptResolved(true)
  }, [pendingDraft])

  const discardDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(formKey)
    }
    setPendingDraft(null)
    lastSavedSignatureRef.current = initialSignatureRef.current
    setPromptResolved(true)
  }, [formKey])

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(formKey)
    }
    setPendingDraft(null)
    lastSavedSignatureRef.current = initialSignatureRef.current
    setPromptResolved(true)
  }, [formKey])

  const isDirty = promptResolved
    ? currentSignature !== lastSavedSignatureRef.current
    : currentSignature !== initialSignatureRef.current

  return {
    pendingDraft,
    hasPendingDraft: pendingDraft !== null,
    draftAgeLabel: formatDraftAge(pendingDraft?.savedAt ?? null),
    isDirty,
    saveNow,
    acceptDraft,
    discardDraft,
    clearDraft,
  }
}

export function useBeforeUnload(enabled: boolean, message = 'Vous avez un brouillon non enregistre. Voulez-vous quitter cette page ?') {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, message])
}
