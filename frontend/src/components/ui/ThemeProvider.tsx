'use client'
// ============================================================
//  Troca — Gestion du thème (clair / sombre / système)
// ============================================================

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeCtx {
  theme:     Theme
  resolved:  'light' | 'dark'
  setTheme:  (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme:    'system',
  resolved: 'light',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme,    setThemeState] = useState<Theme>('system')
  const [resolved, setResolved]   = useState<'light' | 'dark'>('light')

  // Lire le thème sauvegardé
  useEffect(() => {
    const saved = localStorage.getItem('troca-theme') as Theme | null
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeState(saved)
    }
  }, [])

  // Appliquer la classe sur <html>
  useEffect(() => {
    const root = document.documentElement
    const mq   = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mq.matches)
      root.classList.toggle('dark', isDark)
      setResolved(isDark ? 'dark' : 'light')
    }

    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('troca-theme', t)
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

// ── Bouton toggle compact ─────────────────────────────────────

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolved } = useTheme()

  const cycles: Theme[] = ['light', 'dark', 'system']
  const next = () => {
    const idx = cycles.indexOf(theme)
    setTheme(cycles[(idx + 1) % cycles.length])
  }

  const icons: Record<Theme, string> = { light: '☀️', dark: '🌙', system: '💻' }
  const labels: Record<Theme, string> = { light: 'Clair', dark: 'Sombre', system: 'Système' }

  return (
    <button
      onClick={next}
      className={`flex items-center gap-1.5 text-sm text-night/60 hover:text-night dark:text-white/60 dark:hover:text-white transition-colors ${className}`}
      title={`Thème : ${labels[theme]} — Cliquer pour changer`}
      aria-label={`Thème actuel : ${labels[theme]}`}
    >
      <span className="text-base">{icons[theme]}</span>
      <span className="text-xs hidden sm:inline">{labels[theme]}</span>
    </button>
  )
}
