import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { registerDraftSaveHandler } from '@/lib/draftEvents'

type DraftEnvelope<T> = {
  data: T
  savedAt: string
}

type UseAutosaveResult<T> = {
  pendingDraft: DraftEnvelope<T> | null
  hasPendingDraft: boolean
  draftAgeLabel: string | null
  isDirty: boolean
  saveNow: () => Promise<void>
  acceptDraft: (draft?: DraftEnvelope<T> | null) => void
  discardDraft: () => Promise<void>
  clearDraft: () => Promise<void>
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
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    currentDataRef.current = data
  }, [data])

  useEffect(() => {
    let active = true

    const loadDraft = async () => {
      initialSignatureRef.current = stableSerialize(currentDataRef.current)
      lastSavedSignatureRef.current = initialSignatureRef.current

      try {
        const raw = await AsyncStorage.getItem(formKey)
        if (!active) return

        if (!raw) {
          setPendingDraft(null)
          setPromptResolved(true)
          setLoaded(true)
          return
        }

        const parsed = JSON.parse(raw) as DraftEnvelope<T>
        if (!parsed || typeof parsed !== 'object' || !('data' in parsed) || !('savedAt' in parsed)) {
          setPendingDraft(null)
          setPromptResolved(true)
          setLoaded(true)
          return
        }

        setPendingDraft(parsed)
        lastSavedSignatureRef.current = stableSerialize(parsed.data)
        setPromptResolved(false)
        setLoaded(true)
      } catch {
        if (!active) return
        setPendingDraft(null)
        setPromptResolved(true)
        setLoaded(true)
      }
    }

    void loadDraft()

    return () => {
      active = false
    }
  }, [formKey])

  const saveNow = useCallback(async () => {
    const nextData = currentDataRef.current
    const nextSignature = stableSerialize(nextData)
    const baseline = promptResolved ? lastSavedSignatureRef.current : initialSignatureRef.current
    if (nextSignature === baseline) return

    const envelope: DraftEnvelope<T> = {
      data: nextData,
      savedAt: new Date().toISOString(),
    }

    await AsyncStorage.setItem(formKey, JSON.stringify(envelope))
    lastSavedSignatureRef.current = nextSignature
    setPendingDraft(envelope)
  }, [formKey, promptResolved])

  useEffect(() => {
    const unsubscribe = registerDraftSaveHandler(() => {
      void saveNow()
    })

    return unsubscribe
  }, [saveNow])

  useEffect(() => {
    if (!loaded || !promptResolved) return

    const nextSignature = currentSignature
    if (nextSignature === lastSavedSignatureRef.current) return

    const debounce = setTimeout(() => {
      void saveNow()
    }, 2_000)

    return () => clearTimeout(debounce)
  }, [currentSignature, loaded, promptResolved, saveNow])

  useEffect(() => {
    if (!loaded || !promptResolved) return

    const ticker = setInterval(() => {
      void saveNow()
    }, interval)

    return () => clearInterval(ticker)
  }, [interval, loaded, promptResolved, saveNow])

  const acceptDraft = useCallback((draft?: DraftEnvelope<T> | null) => {
    const nextDraft = draft ?? pendingDraft
    if (nextDraft) {
      lastSavedSignatureRef.current = stableSerialize(nextDraft.data)
    }
    setPendingDraft(null)
    setPromptResolved(true)
  }, [pendingDraft])

  const discardDraft = useCallback(async () => {
    await AsyncStorage.removeItem(formKey)
    setPendingDraft(null)
    lastSavedSignatureRef.current = initialSignatureRef.current
    setPromptResolved(true)
  }, [formKey])

  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(formKey)
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
