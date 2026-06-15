'use client'
// ============================================================
//  Kalico — Gestion du thème (clair / sombre)
// ============================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (t: Theme) => void
}

const THEME_KEY = 'theme'
const LEGACY_THEME_KEY = 'kalico-theme'

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  resolved: 'light',
  setTheme: () => {},
})

function applyThemeToDocument(nextTheme: Theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.toggle('dark', nextTheme === 'dark')
  root.dataset.theme = nextTheme
  root.style.colorScheme = nextTheme
}

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY)
  if (saved === 'dark' || saved === 'light') {
    return saved
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const initialTheme = getPreferredTheme()
    setThemeState(initialTheme)
    setResolved(initialTheme)
    applyThemeToDocument(initialTheme)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemTheme = () => {
      const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY)
      if (saved === 'dark' || saved === 'light') return

      const systemTheme: Theme = media.matches ? 'dark' : 'light'
      setThemeState(systemTheme)
      setResolved(systemTheme)
      applyThemeToDocument(systemTheme)
    }

    media.addEventListener('change', handleSystemTheme)

    return () => media.removeEventListener('change', handleSystemTheme)
  }, [])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    setResolved(nextTheme)
    applyThemeToDocument(nextTheme)
    localStorage.setItem(THEME_KEY, nextTheme)
    localStorage.setItem(LEGACY_THEME_KEY, nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
