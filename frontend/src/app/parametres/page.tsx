'use client'
// src/app/parametres/page.tsx
// â”€â”€ Page paramÃ¨tres RGPD â€” Suppression compte + Export donnÃ©es â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield, Download, Trash2, AlertTriangle, ChevronRight,
  Eye, Bell, Lock, LogOut, CheckCircle2, Cookie, ToggleLeft, ToggleRight, Mail,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import { useEffect } from 'react'
import { Star, Receipt, CreditCard, Calendar, AlertCircle, ExternalLink } from 'lucide-react'
import { API_ORIGIN } from '@/lib/api'
import { newsletterApi } from '@/lib/api'
import { getStoredAccessToken } from '@/lib/tokenStorage'
const COOKIE_STORAGE_KEY = 'troca-cookie-consent'
const COOKIE_BANNER_EVENT = 'troca-cookie-banner-open'

type CookieConsentState = {
  analytics?: boolean
  marketing?: boolean
  decidedAt?: string
}

// â”€â”€ Section gÃ©nÃ©rique â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Section({ icon: Icon, title, children, id }: {
  icon: React.ElementType; title: string; children: React.ReactNode; id?: string
}) {
  return (
    <div className="card p-6" id={id}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-coral" />
        </div>
        <h2 className="font-semibold text-night text-base">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// â”€â”€ Export donnÃ©es (Art. 20) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Section Abonnement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AbonnementSection() {
  const { user } = useAuthStore()
  const [sub,        setSub]        = useState<any>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled,  setCancelled]  = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    axios.get(`${API_ORIGIN}/api/payment/my-subscription`, {
      headers: { Authorization: `Bearer ${getStoredAccessToken()}` },
    })
      .then(({ data }) => setSub(data.data))
      .catch(() => {})
  }, [])

  const handleCancel = async () => {
    if (!confirm('Voulez-vous vraiment annuler votre abonnement ? Il restera actif jusqu\'Ã  la fin de la pÃ©riode en cours.')) return
    setCancelling(true)
    setError('')
    try {
      const { data } = await axios.post(`${API_ORIGIN}/api/payment/cancel`, {}, {
        headers: { Authorization: `Bearer ${getStoredAccessToken()}` },
      })
      setCancelled(true)
      setSub((prev: any) => ({ ...prev, cancel_at_period_end: true, cancel_at: data.cancel_at }))
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Erreur lors de l\'annulation')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Section icon={Star} title="Abonnement Pro">
      {!user?.is_pro ? (
        <div className="text-center py-4">
          <p className="text-night/60 text-sm mb-4">Vous n\'avez pas encore d\'abonnement Pro.</p>
          <Link href="/pro" className="btn-primary inline-flex items-center gap-2 py-2 px-6 text-sm">
            <Star className="w-4 h-4" />
            DÃ©couvrir les offres Pro
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Statut */}
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-amber-800">
                Compte Pro actif
              </span>
            </div>
            {sub?.status === 'trialing' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                PÃ©riode d\'essai
              </span>
            )}
          </div>

          {/* DÃ©tails abonnement */}
          {sub && (
            <div className="space-y-2 text-sm">
              {sub.current_period_end && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-night/60">
                    <Calendar className="w-4 h-4" />
                    {sub.cancel_at_period_end ? 'Actif jusqu\'au' : 'Renouvellement le'}
                  </span>
                  <span className="font-medium text-night">{formatDate(sub.current_period_end)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-night/60">
                  <CreditCard className="w-4 h-4" />
                  Prestataire
                </span>
                <span className="font-medium text-night capitalize">
                  {sub.provider === 'payplug' ? 'PayPlug (carte locale)' : 'Stripe (carte internationale)'}
                </span>
              </div>
            </div>
          )}

          {/* Messages Ã©tat */}
          {cancelled && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Abonnement annulÃ©. Vous conservez vos avantages jusqu\'Ã  la fin de la pÃ©riode.</span>
            </div>
          )}
          {sub?.cancel_at_period_end && !cancelled && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Votre abonnement ne sera pas renouvelÃ©.
                {sub.cancel_at && ` Il reste actif jusqu\'au ${formatDate(sub.cancel_at)}.`}
              </span>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Actions */}
          {!sub?.cancel_at_period_end && !cancelled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Annulation en coursâ€¦' : 'Annuler mon abonnement'}
            </button>
          )}
        </div>
      )}
    </Section>
  )
}

// â”€â”€ Section Factures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function NewsletterSection() {
  const { user } = useAuthStore()
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    newsletterApi.getSubscription()
      .then(({ data }) => {
        const subscription = data?.data || null
        setEnabled(Boolean(subscription?.enabled ?? true))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleNewsletter = async () => {
    setSaving(true)
    setError('')
    try {
      await newsletterApi.subscribe({
        enabled: !enabled,
        communes: user?.commune_name ? [user.commune_name] : [],
        categories: [],
        frequency: !enabled ? 'weekly' : 'off',
      })
      setEnabled((value) => !value)
    } catch {
      setError('Impossible de mettre à jour vos préférences.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Section icon={Mail} title="Newsletter" id="newsletter">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-night">Recevoir la newsletter</p>
            <p className="text-xs text-night/55">Recevez les meilleures annonces de votre secteur chaque semaine.</p>
          </div>
          <button
            type="button"
            onClick={toggleNewsletter}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-sand text-night/55'
            }`}
          >
            {enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {enabled ? 'Activée' : 'Désactivée'}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link href="/newsletter/preferences" className="text-sm font-semibold text-coral hover:underline">
            Gérer mes préférences
          </Link>
          <Link href="/newsletter/unsubscribe" className="text-xs text-night/45 hover:text-night/65">
            Se désabonner
          </Link>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Section>
  )
}
function FacturesSection() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    axios.get(`${API_ORIGIN}/api/payment/billing-documents`, {
      headers: { Authorization: `Bearer ${getStoredAccessToken()}` },
    })
      .then(({ data }) => setInvoices(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!invoices.length) return null

  const labelFor = (inv: any) => {
    if (inv.document_type === 'refund' || inv.status === 'refunded') return 'RemboursÃ©e'
    if (inv.status === 'succeeded' || inv.status === 'paid') return 'PayÃ©e'
    return 'Ã‰chouÃ©e'
  }

  return (
    <Section icon={Receipt} title="Mes factures" id="factures">
      <div className="space-y-2">
        {invoices.slice(0, 12).map((inv: any) => (
          <div key={inv.id} className="flex items-center justify-between py-2 border-b border-night/5 last:border-0">
            <div>
              <p className="text-sm font-medium text-night">
                {new Date(inv.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-night/50">
                {inv.amount_xpf != null ? `${Number(inv.amount_xpf).toLocaleString('fr-FR')} XPF` : 'Montant indisponible'}
                {inv.amount_eur ? ` Â· ${inv.amount_eur} â‚¬` : ''}
                {inv.provider ? ` Â· ${inv.provider}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                (inv.status === 'succeeded' || inv.status === 'paid') ? 'bg-green-100 text-green-700' : inv.status === 'refunded' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
              }`}>
                {labelFor(inv)}
              </span>
              {(inv.pdf_url || inv.hosted_url) && (
                <a
                  href={inv.pdf_url || inv.hosted_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-coral hover:underline"
                >
                  PDF <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function CookiesSection() {
  const [consent, setConsent] = useState<CookieConsentState | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY)
      if (stored) {
        setConsent(JSON.parse(stored) as CookieConsentState)
      }
    } catch {
      setConsent(null)
    }
  }, [])

  const openCookieBanner = () => {
    window.dispatchEvent(new CustomEvent(COOKIE_BANNER_EVENT))
  }

  const resetCookieChoice = () => {
    localStorage.removeItem(COOKIE_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(COOKIE_BANNER_EVENT))
    setConsent(null)
  }

  return (
    <Section icon={Cookie} title="Cookies et mesure dâ€™audience" id="cookies">
      <p className="text-sm text-night/60 leading-relaxed">
        Vous pouvez Ã  tout moment consulter, modifier ou retirer votre consentement aux cookies
        non essentiels. La mesure dâ€™audience first-party nâ€™est activÃ©e quâ€™avec votre accord.
      </p>

      <div className="rounded-xl border border-night/10 bg-sand/40 p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-night/60">Mesure dâ€™audience</span>
          <span className={`font-medium ${consent?.analytics ? 'text-jungle' : 'text-night/45'}`}>
            {consent?.analytics ? 'ActivÃ©e' : 'DÃ©sactivÃ©e'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-night/60">PrÃ©fÃ©rences marketing</span>
          <span className={`font-medium ${consent?.marketing ? 'text-jungle' : 'text-night/45'}`}>
            {consent?.marketing ? 'AutorisÃ©' : 'Non autorisÃ©'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-night/60">Dernier choix</span>
          <span className="font-medium text-night">
            {consent?.decidedAt
              ? new Date(consent.decidedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Non dÃ©fini'}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={openCookieBanner} className="btn-primary flex-1 justify-center text-sm py-2">
          Modifier mon consentement
        </button>
        <button onClick={resetCookieChoice} className="btn-ghost flex-1 justify-center text-sm py-2">
          RÃ©initialiser la banniÃ¨re
        </button>
      </div>
    </Section>
  )
}

function ExportSection() {
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  const handleExport = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_ORIGIN}/api/rgpd/exporter-donnees`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${getStoredAccessToken()}` },
      })
      const url  = URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href  = url
      link.download = `troca-mes-donnees-${Date.now()}.zip`
      link.click()
      URL.revokeObjectURL(url)
      setDone(true)
      setTimeout(() => setDone(false), 5000)
    } catch {
      setError('Impossible de gÃ©nÃ©rer lâ€™export pour le moment. RÃ©essayez dans quelques minutes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section icon={Download} title="Mes donnÃ©es (Art. 20 RGPD)">
      <p className="text-sm text-night/60 mb-4 leading-relaxed">
        TÃ©lÃ©chargez une copie complÃ¨te de toutes vos donnÃ©es : profil, annonces, messages, favoris et historique de paiements. Le fichier ZIP est gÃ©nÃ©rÃ© immÃ©diatement.
      </p>
      <div className="bg-sand rounded-xl p-3 mb-4 text-xs text-night/50 space-y-1">
        <p>ðŸ“‹ Profil et informations personnelles</p>
        <p>ðŸ“¦ Toutes vos annonces (actives et archivÃ©es)</p>
        <p>ðŸ’¬ Vos conversations et messages</p>
        <p>ðŸ¤ Vos annonces sauvegardÃ©es</p>
        <p>ðŸ’³ Historique des paiements</p>
      </div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="btn-secondary w-full justify-center gap-2"
      >
        {loading ? (
          <><span className="w-4 h-4 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />PrÃ©parationâ€¦</>
        ) : done ? (
          <><CheckCircle2 className="w-4 h-4 text-jungle" />TÃ©lÃ©chargement lancÃ©</>
        ) : (
          <><Download className="w-4 h-4" />TÃ©lÃ©charger mes donnÃ©es</>
        )}
      </button>
      {error ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Export lance. Verifiez le telechargement de votre navigateur.
        </p>
      ) : null}
    </Section>
  )
}

// â”€â”€ Suppression compte (Art. 17) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SuppressionSection() {
  const router  = useRouter()
  const { logout, user } = useAuthStore()

  const [open,         setOpen]         = useState(false)
  const [step,         setStep]         = useState<1 | 2>(1)
  const [confirmation, setConfirmation] = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const EXPECTED = 'SUPPRIMER MON COMPTE'

  const handleSupprimer = async () => {
    setError('')
    setLoading(true)
    try {
      await axios.post(
        `${API_ORIGIN}/api/rgpd/supprimer-compte`,
        { confirmation, password },
        { headers: { Authorization: `Bearer ${getStoredAccessToken()}` } }
      )
      // DÃ©connecter et rediriger
      await logout()
      router.push('/?compte=supprime')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section icon={Trash2} title="Supprimer mon compte (Art. 17 RGPD)">
      <p className="text-sm text-night/60 mb-4 leading-relaxed">
        Vous pouvez demander la suppression de votre compte et de vos donnÃ©es personnelles. Vos annonces seront dÃ©publiÃ©es et vos informations anonymisÃ©es sous 30 jours.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer mon compte dÃ©finitivement
        </button>
      ) : (
        <div className="border border-red-200 rounded-xl p-4 space-y-4 bg-red-50/50 animate-fade-in">

          {/* Avertissements */}
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 space-y-1">
              <p className="font-semibold">Cette action est irrÃ©versible.</p>
              <p>â€¢ Vos annonces seront dÃ©publiÃ©es immÃ©diatement</p>
              <p>â€¢ Vos donnÃ©es personnelles seront anonymisÃ©es sous 30 jours</p>
              <p>â€¢ Vous perdrez l'accÃ¨s Ã  votre compte et vos messages</p>
              {user?.is_pro && <p className="font-medium">â€¢ Votre abonnement Pro sera rÃ©siliÃ©</p>}
            </div>
          </div>

          {/* Ã‰tape 1 : info */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-night/50">
                Avant de supprimer votre compte, pensez Ã {' '}
                <button onClick={() => {}} className="text-coral underline">tÃ©lÃ©charger vos donnÃ©es</button>.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="btn-ghost flex-1 justify-center text-sm">
                  Annuler
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Ã‰tape 2 : confirmation */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-red-700 mb-1">
                  Tapez exactement : <span className="font-mono bg-red-100 px-1 rounded">{EXPECTED}</span>
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  placeholder={EXPECTED}
                  className="input text-sm border-red-200 focus:border-red-400 focus:ring-red-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-red-700 mb-1">
                  Confirmez avec votre mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  className="input text-sm border-red-200 focus:border-red-400 focus:ring-red-100"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 font-medium">{error}</p>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setOpen(false); setStep(1) }} className="btn-ghost flex-1 justify-center text-sm">
                  Annuler
                </button>
                <button
                  onClick={handleSupprimer}
                  disabled={confirmation !== EXPECTED || !password || loading}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Suppressionâ€¦</span>
                    : 'Supprimer dÃ©finitivement'
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  )
}

// â”€â”€ Page principale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ParametresPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-night">ParamÃ¨tres</h1>
          <p className="text-night/50 text-sm mt-1">GÃ©rez votre compte et vos donnÃ©es personnelles</p>
        </div>

        <div className="space-y-4">

          {/* Navigation rapide */}
          <div className="card divide-y divide-night/8">
          {[
            { icon: Shield,   label: 'SÃ©curitÃ© et connexion',    href: '/profil?tab=securite' },
            { icon: Bell,     label: 'Notifications',             href: '/parametres/notifications' },
            { icon: Eye,      label: 'ConfidentialitÃ©',           href: '#confidentialite' },
            { icon: Cookie,   label: 'Cookies',                   href: '#cookies' },
            { icon: Lock,     label: 'Mes donnÃ©es (RGPD)',        href: '#donnees' },
          ].map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-sand transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-night/50" />
                  <span className="text-sm font-medium text-night">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-night/30" />
              </Link>
            ))}
          </div>

          {/* Export donnÃ©es */}
          <div id="donnees">
            <AbonnementSection />
            <NewsletterSection />
            <FacturesSection />
            <CookiesSection />
            <ExportSection />
          </div>

          {/* Suppression compte */}
          <SuppressionSection />

          {/* DÃ©connexion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-night/50 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se dÃ©connecter
          </button>

          {/* Liens lÃ©gaux */}
          <div className="flex items-center justify-center gap-4 text-xs text-night/35">
            <Link href="/cgu" className="hover:text-night/60">CGU</Link>
            <span>Â·</span>
            <Link href="/politique-de-confidentialite" className="hover:text-night/60">Politique de confidentialitÃ©</Link>
            <span>Â·</span>
            <a href="mailto:privacy@troca.nc" className="hover:text-night/60">Contact DPO</a>
          </div>
        </div>
      </div>
    </>
  )
}
