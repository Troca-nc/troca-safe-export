'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, Copy, Gift, Share2, Sparkles, Users2, BadgeCheck } from 'lucide-react'

import { proApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type ReferralInfo = {
  referral_code: string
  referral_link: string
}

function buildReferralLink(referralCode: string | undefined) {
  const ref = String(referralCode ?? '').trim()
  if (!ref) return '/inscription'
  return `/inscription?ref=${encodeURIComponent(ref)}`
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/55">
      {children}
    </span>
  )
}

export default function ProDashboardReferralPage() {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')
  const [loading, setLoading] = useState(true)
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)

  const displayCode = useMemo(() => {
    const raw = String(referralInfo?.referral_code || '').trim()
    if (!raw) return 'KALICO-PRO'
    return raw.toUpperCase()
  }, [referralInfo?.referral_code])

  const referralLink = useMemo(() => {
    if (referralInfo?.referral_link) return referralInfo.referral_link
    return buildReferralLink(referralInfo?.referral_code || String(user?.id ?? ''))
  }, [referralInfo, user?.id])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    let alive = true

    const loadReferral = async () => {
      setLoading(true)
      try {
        const response = await proApi.getReferral()
        if (!alive) return
        const payload = response.data?.data || null
        setReferralInfo(payload && typeof payload === 'object' ? payload : null)
      } catch {
        if (!alive) return
        setReferralInfo(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void loadReferral()
    return () => {
      alive = false
    }
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${origin}${referralLink}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const shareLink = async () => {
    const url = `${origin}${referralLink}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kalico - Parrainage Pro',
          text: 'Rejoignez Kalico et developpez votre activite avec une vitrine Pro.',
          url,
        })
        return
      } catch {
        // ignore cancellation
      }
    }
    await copyLink()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Parrainage</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Invitez d&apos;autres pros et developpez votre reseau</h1>
            <p className="mt-3 text-sm leading-relaxed text-night/60 sm:text-base">
              Partagez votre lien de parrainage pour faire decouvrir Kalico a d&apos;autres professionnels. Le code est maintenant genere et conserve cote serveur.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              <p className="text-sm font-semibold">Partage simple</p>
            </div>
            <p className="mt-1 text-xs text-emerald-700/80">Copiez votre lien et envoyez-le en un clic.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Votre code</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">{displayCode}</h2>
              <p className="mt-2 text-sm text-night/60">
                Ce code est genere par le serveur et reste identique pour votre compte Pro.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Votre lien de parrainage</p>
            <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-3 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-xl bg-sand px-3 py-2 text-sm text-night/80">
                {`${origin}${referralLink}`}
              </code>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Lien copie' : 'Copier'}
                </button>
                <button
                  type="button"
                  onClick={shareLink}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                >
                  <Share2 className="h-4 w-4" />
                  Partager
                </button>
              </div>
            </div>
            {loading ? (
              <div className="mt-4 h-10 animate-pulse rounded-2xl bg-white/70" />
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill><BadgeCheck className="h-3.5 w-3.5" /> Pro</Pill>
              <Pill><Sparkles className="h-3.5 w-3.5" /> Suivi a venir</Pill>
              <Pill><Gift className="h-3.5 w-3.5" /> Partage rapide</Pill>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">A quoi ca sert ?</p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-night/65">
              <p>
                1. Partagez votre lien a un autre professionnel ou partenaire local.
              </p>
              <p>
                2. Facilitez sa creation de compte et son inscription dans l&apos;ecosysteme Kalico.
              </p>
              <p>
                3. Gardez un espace dedie pour suivre les benefices du parrainage quand le suivi automatise sera active.
              </p>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Etape suivante</p>
            <h2 className="mt-1 font-display text-xl font-bold text-night">Reliez ce lien a vos contacts</h2>
            <p className="mt-2 text-sm text-night/60">
              Vous pouvez deja copier le lien et le coller dans un message, un devis ou un email d&apos;invitation.
            </p>
            <Link
              href="/pro/dashboard"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
            >
              Retour au dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </aside>
      </section>
    </div>
  )
}
