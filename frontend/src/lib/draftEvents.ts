'use client'

export const SAVE_DRAFT_EVENT_NAME = 'app:save-draft'

export function requestDraftSave() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(SAVE_DRAFT_EVENT_NAME))
}
