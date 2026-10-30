'use client'

import type { ElementType, ReactNode } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { Check, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Controls'

export function PreferencesSection({
  id,
  title,
  description,
  icon: Icon,
  count,
  children,
}: {
  id: string
  title: string
  description: string
  icon: ElementType
  count: number
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-card border border-sand bg-cream-card shadow-card">
      <header className="flex items-start gap-4 border-b border-sand px-5 py-5 sm:px-7">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-papaya/15 text-papaya">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-title-sm text-ink">{title}</h2>
            <span className="rounded-full bg-cream-sunken px-2.5 py-1 text-meta font-semibold text-ink/65">{count}</span>
          </div>
          <p className="mt-1 text-body-sm text-ink/65">{description}</p>
        </div>
      </header>
      <div>{children}</div>
    </section>
  )
}

export function PreferenceRow({
  title,
  description,
  email,
  push,
  onEmailChange,
  onPushChange,
}: {
  title: string
  description: string
  email?: boolean
  push?: boolean
  onEmailChange?: (checked: boolean) => void
  onPushChange?: (checked: boolean) => void
}) {
  return (
    <div className="grid gap-4 border-b border-sand px-5 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_72px_72px] sm:items-center sm:px-7">
      <div>
        <h3 className="text-body-sm font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-body-sm text-ink/60">{description}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:block">
        <span className="text-label-sm font-semibold text-ink/55 sm:sr-only">Email</span>
        {email === undefined ? (
          <span className="hidden text-center text-ink/25 sm:block" aria-hidden="true">—</span>
        ) : (
          <Switch label={`Email — ${title}`} checked={email} onChange={(event) => onEmailChange?.(event.target.checked)} className="justify-end [&>span]:sr-only" />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 sm:block">
        <span className="text-label-sm font-semibold text-ink/55 sm:sr-only">Push</span>
        {push === undefined ? (
          <span className="hidden text-center text-ink/25 sm:block" aria-hidden="true">—</span>
        ) : (
          <Switch label={`Push — ${title}`} checked={push} onChange={(event) => onPushChange?.(event.target.checked)} className="justify-end [&>span]:sr-only" />
        )}
      </div>
    </div>
  )
}

export function ChannelHeadings() {
  return (
    <div className="hidden grid-cols-[minmax(0,1fr)_72px_72px] gap-4 border-b border-sand bg-cream-sunken px-7 py-3 text-center text-meta font-semibold uppercase tracking-[0.14em] text-ink/50 sm:grid">
      <span className="text-left">Notification</span><span>Email</span><span>Push</span>
    </div>
  )
}

export function PreferencesNav({ items, activeCount }: { items: Array<{ href: string; label: string; count: number }>; activeCount: number }) {
  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <nav aria-label="Sections des préférences" className="rounded-card border border-sand bg-cream-card p-3 shadow-card">
        <p className="px-3 pb-2 pt-1 text-meta font-semibold uppercase tracking-[0.16em] text-ink/45">Préférences</p>
        <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
          {items.map((item) => (
            <li key={item.href}>
              <a className="flex items-center justify-between rounded-control px-3 py-2.5 text-body-sm font-semibold text-ink/70 transition hover:bg-cream-sunken hover:text-ink" href={item.href}>
                {item.label}<span className="rounded-full bg-cream-sunken px-2 py-0.5 text-meta text-ink/55">{item.count}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-control bg-petrol px-4 py-4 text-white">
          <p className="text-meta uppercase tracking-[0.14em] text-white/60">Canaux actifs</p>
          <p className="mt-1 font-display text-title-md">{activeCount}</p>
          <p className="text-body-sm text-white/65">préférences activées</p>
        </div>
      </nav>
    </aside>
  )
}

export function SaveBar({ dirty, saving, status, onCancel, onSave }: {
  dirty: boolean
  saving: boolean
  status: { tone: 'success' | 'error'; text: string } | null
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-cream-card/95 shadow-modal backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div aria-live="polite" className="min-h-5 text-body-sm">
          {status ? (
            <span className={clsx('inline-flex items-center gap-2 font-semibold', status.tone === 'success' ? 'text-alert-success' : 'text-alert-error')}>
              {status.tone === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{status.text}
            </span>
          ) : dirty ? <span className="text-ink/65">Vous avez des modifications non enregistrées.</span> : <span className="text-ink/50">Vos préférences sont à jour.</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={!dirty || saving}>Annuler</Button>
          <Button onClick={onSave} disabled={!dirty} loading={saving} loadingLabel="Enregistrement…">
            <Save className="h-4 w-4" aria-hidden="true" />Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SafeLink({ href, dirty, children, className }: { href: string; dirty: boolean; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={className} onClick={(event) => {
      if (dirty && !window.confirm('Quitter sans enregistrer vos modifications ?')) event.preventDefault()
    }}>
      {children}
    </Link>
  )
}
