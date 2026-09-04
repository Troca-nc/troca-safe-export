import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE } from './auth'
import { verifyActiveAdminSession } from './session-store'

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  try {
    return await verifyActiveAdminSession(token)
  } catch {
    return null
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session?.email) {
    return null
  }
  return session
}
