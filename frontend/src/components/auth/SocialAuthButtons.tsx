'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { API_ORIGIN } from '@/lib/api'
import { consumeRedirectAfterLogin } from '@/lib/authRedirect'
import { saveStoredTokens } from '@/lib/tokenStorage'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? ''
const showGoogleButton =
  GOOGLE_CLIENT_ID.trim() !== '' && !GOOGLE_CLIENT_ID.toLowerCase().includes('changeme')
const showAppleButton =
  APPLE_CLIENT_ID.trim() !== '' && !APPLE_CLIENT_ID.toLowerCase().includes('changeme')

interface Props {
  redirectTo?: string
  mode?: 'connexion' | 'inscription'
  showLegalFooter?: boolean
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          prompt: () => void
          renderButton: (el: HTMLElement, config: object) => void
          disableAutoSelect: () => void
          cancel: () => void
        }
      }
    }
  }
}

function useGoogleSignIn(onToken: (token: string) => Promise<void>) {
  const [loading, setLoading] = useState(false)
  const googleInitializedRef = useRef(false)
  const isPromptingRef = useRef(false)
  const scriptLoadingRef = useRef(false)

  useEffect(() => {
    return () => {
      isPromptingRef.current = false
    }
  }, [])

  const initGoogle = () => {
    if (!window.google?.accounts?.id || googleInitializedRef.current) {
      return false
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async ({ credential }: { credential: string }) => {
        isPromptingRef.current = false
        setLoading(true)
        try {
          await onToken(credential)
        } finally {
          setLoading(false)
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })
    googleInitializedRef.current = true
    return true
  }

  const promptGoogle = () => {
    if (!window.google?.accounts?.id || isPromptingRef.current) {
      return
    }

    isPromptingRef.current = true
    try {
      window.google.accounts.id.prompt()
    } catch {
      isPromptingRef.current = false
    }
  }

  const trigger = () => {
    if (isPromptingRef.current) {
      return
    }

    if (!window.google) {
      if (scriptLoadingRef.current) {
        return
      }

      scriptLoadingRef.current = true
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        scriptLoadingRef.current = false
        initGoogle()
        promptGoogle()
      }
      script.onerror = () => {
        scriptLoadingRef.current = false
      }
      document.head.appendChild(script)
      return
    }

    initGoogle()
    promptGoogle()
  }

  return { trigger, loading }
}

export default function SocialAuthButtons({ redirectTo = '/', mode = 'connexion', showLegalFooter = true }: Props) {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [error, setError] = useState('')
  const [appleLoading, setAppleLoading] = useState(false)

  const handleSocialSuccess = (data: {
    access_token: string
    refresh_token: string
    user: {
      phone_verified?: boolean
      telephone?: string | null
      [key: string]: unknown
    }
  }) => {
    const target = consumeRedirectAfterLogin(redirectTo)
    saveStoredTokens(data.access_token, data.refresh_token)
    setUser(data.user as any)
    if (!data.user.phone_verified || !data.user.telephone) {
      router.push(`/inscription/telephone?next=${encodeURIComponent(target)}`)
      return
    }

    router.push(target)
  }

  const { trigger: triggerGoogle, loading: googleLoading } = useGoogleSignIn(async (id_token) => {
    setError('')
    try {
      const { data } = await axios.post(`${API_ORIGIN}/api/auth/google`, { id_token })
      handleSocialSuccess(data.data)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'La connexion Google a ï¿½chouï¿½.')
    }
  })

  const handleApple = async () => {
    setError('')
    setAppleLoading(true)
    try {
      const appleResponse = await (window as any).AppleID?.auth.signIn()
      if (!appleResponse?.authorization?.id_token) {
        throw new Error('Token Apple manquant')
      }

      const { data } = await axios.post(`${API_ORIGIN}/api/auth/apple`, {
        id_token: appleResponse.authorization.id_token,
        user: appleResponse.user
          ? {
              firstName: appleResponse.user.name?.firstName,
              lastName: appleResponse.user.name?.lastName,
            }
          : undefined,
      })
      handleSocialSuccess(data.data)
    } catch (err: any) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err?.response?.data?.error || 'La connexion Apple a ï¿½chouï¿½.')
      }
    } finally {
      setAppleLoading(false)
    }
  }

  const isLoading = googleLoading || appleLoading

  const handleGoogleClick = () => {
    triggerGoogle()
  }

  const handleAppleClick = () => {
    handleApple()
  }

  return (
    <div className="space-y-4">
      {showGoogleButton || showAppleButton ? (
        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-night/10" />
          <span className="shrink-0 text-xs font-medium text-night/45">ou continuer avec</span>
          <div className="h-px flex-1 bg-night/10" />
        </div>
      ) : null}

      <div className="space-y-3">
        {showGoogleButton ? (
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="btn-secondary w-full justify-start border-night/15 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="flex-1 text-left">
              {googleLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
            </span>
          </button>
        ) : null}

        {showAppleButton ? (
          <button
            type="button"
            onClick={handleAppleClick}
            disabled={isLoading}
            className="btn-secondary w-full justify-start border-night/15 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <svg className="h-5 w-5 shrink-0 fill-night" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.31.07 2.22.75 2.98.8 1.13-.23 2.21-.93 3.39-.84 1.44.12 2.53.7 3.23 1.79-2.93 1.76-2.4 5.62.24 6.73-.57 1.54-1.32 3.05-1.84 4.4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="flex-1 text-left">
              {appleLoading ? 'Connexion en cours...' : 'Continuer avec Apple'}
            </span>
          </button>
        ) : null}
      </div>

      {error ? <p className="animate-fade-in text-center text-xs text-[var(--color-danger)]">{error}</p> : null}

      {showLegalFooter ? (
        <p className="text-center text-[10px] leading-relaxed text-night/35">
          En continuant, vous acceptez nos{' '}
          <a href="/cgu" className="underline transition hover:text-night/60">
            CGU
          </a>{' '}
          et notre{' '}
          <a href="/politique-de-confidentialite" className="underline transition hover:text-night/60">
            politique de confidentialitï¿½
          </a>
          .
        </p>
      ) : null}
    </div>
  )
}
