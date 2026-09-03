import { adminBackendJson } from './backend'

// Second argument retained for existing callers; never substitute it for a failed request.
export async function loadAdminJson<T>(path: string, _fallback: T): Promise<T> {
  try {
    const data = await adminBackendJson<T>(path)
    if (data === null || data === undefined) {
      throw new Error('Empty backend response')
    }
    return data
  } catch {
    // Do not expose backend messages, credentials or response bodies to the client.
    throw new Error('Impossible de charger les données administratives.')
  }
}
