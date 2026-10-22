'use client'

import { Moon, SunMedium } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolved, setTheme } = useTheme()
  const isDark = resolved === 'dark'
  const Icon = isDark ? SunMedium : Moon

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-pressed={isDark}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-warm-border bg-cream-surface text-ink transition-colors hover:border-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${className}`}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
