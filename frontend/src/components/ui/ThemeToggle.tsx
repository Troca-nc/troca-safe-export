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
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-background-secondary)] hover:text-[var(--color-text-primary)] dark:bg-[var(--color-surface-raised)] dark:text-[var(--color-text-secondary)] dark:hover:bg-[var(--color-background-secondary)] dark:hover:text-[var(--color-text-primary)] ${className}`}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
