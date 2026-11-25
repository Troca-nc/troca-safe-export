import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { serverPublicFetch } from '@/lib/serverPublicApi'

const PUBLIC_DETAIL_ROUTES = [
  { pattern: /^\/annonces\/(\d+)$/, apiPath: (id: string) => `/listings/${id}` },
  { pattern: /^\/evenements\/(\d+)$/, apiPath: (id: string) => `/events/${id}` },
  { pattern: /^\/pro\/(\d+)$/, apiPath: (id: string) => `/pros/${id}` },
  { pattern: /^\/profil\/(\d+)$/, apiPath: (id: string) => `/users/${id}` },
] as const

export async function middleware(request: NextRequest) {
  if (request.headers.get('accept')?.includes('text/html')) return NextResponse.next()

  const route = PUBLIC_DETAIL_ROUTES.find(({ pattern }) => pattern.test(request.nextUrl.pathname))
  if (!route) return NextResponse.next()

  const match = request.nextUrl.pathname.match(route.pattern)
  const id = match?.[1]
  if (!id) return NextResponse.next()

  try {
    const response = await serverPublicFetch(route.apiPath(id), {
      cache: 'no-store',
    })
    if (response.status !== 404) {
      const nextResponse = NextResponse.next()
      nextResponse.headers.set('X-Kalico-Public-Preflight', 'hit')
      return nextResponse
    }
  } catch {
    return NextResponse.next()
  }

  const notFoundUrl = request.nextUrl.clone()
  notFoundUrl.pathname = '/__kalico_not_found__'
  return NextResponse.rewrite(notFoundUrl, {
    headers: {
      'X-Kalico-Public-Preflight': 'not-found',
      'X-Robots-Tag': 'noindex',
    },
    status: 404,
  })
}

export const config = {
  matcher: [
    '/annonces/:path*',
    '/evenements/:path*',
    '/pro/:path*',
    '/profil/:path*',
  ],
}
