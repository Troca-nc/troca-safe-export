const draftSaveHandlers = new Set<() => void>()

export function registerDraftSaveHandler(handler: () => void) {
  draftSaveHandlers.add(handler)
  return () => {
    draftSaveHandlers.delete(handler)
  }
}

export function requestDraftSave() {
  draftSaveHandlers.forEach((handler) => handler())
}
