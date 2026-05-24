import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from './auth'

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  return verifyAdminSession(token)
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session?.email) {
    return null
  }
  return session
}
