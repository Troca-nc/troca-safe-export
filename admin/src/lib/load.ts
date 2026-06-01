import { adminBackendJson } from './backend'

export async function loadAdminJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return await adminBackendJson<T>(path)
  } catch {
    return fallback
  }
}
