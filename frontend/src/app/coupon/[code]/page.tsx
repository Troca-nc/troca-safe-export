'use client'

import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, QrCode, ShieldCheck, XCircle } from 'lucide-react'

import { couponsApi } from '@/lib/api'

type CouponData = {
  valid: boolean
  reason?: string
  code?: string
  label?: string
  description?: string | null
  discount_type?: string
  discount_value?: number | null
  pro_name?: string
  pro_logo_url?: string | null
  qr_code_url?: string | null
  valid_until?: string | null
  uses_per_user?: number | null
}

export default function CouponPublicPage() {
  const params = useParams<{ code: string }>()
  const [coupon, setCoupon] = useState<CouponData | null>(null)
  const [loading, setLoading] = useState(true)
  const code = params.code

  useEffect(() => {
    let alive = true
    couponsApi.getByCode(code)
      .then((response) => {
        if (!alive) return
        setCoupon(response.data as CouponData)
      })
      .catch(() => {
        if (!alive) return
        setCoupon({ valid: false, reason: 'Coupon introuvable.' })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [code])

  return (
    <main className="min-h-screen bg-white text-night">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-10">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#0A7EA4]" />
            <p className="text-sm text-night/55">Chargement du coupon…</p>
          </div>
        ) : coupon?.valid ? (
          <section className="w-full rounded-[2rem] border border-night/10 bg-white p-6 shadow-[0_18px_70px_rgba(8,32,50,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-night/10 bg-sand">
                {coupon.pro_logo_url ? (
                  <Image src={coupon.pro_logo_url} alt={coupon.pro_name || 'Professionnel'} width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  <ShieldCheck className="h-8 w-8 text-[#0A7EA4]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-nc-emeraude">Coupon valide</p>
                <h1 className="mt-1 text-2xl font-bold text-night">{coupon.pro_name || 'Professionnel Kalico'}</h1>
                <p className="mt-1 text-sm text-night/55">{coupon.label}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-night/10 bg-[linear-gradient(180deg,_#ffffff,_#f8fbfd)] p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/40">Code</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-[0.18em] text-night">{coupon.code}</p>
              <p className="mt-3 text-lg font-semibold text-[#0A7EA4]">
                {coupon.discount_type === 'percent'
                  ? `-${coupon.discount_value || 0}%`
                  : coupon.discount_type === 'fixed_xpf'
                    ? `-${Number(coupon.discount_value || 0).toLocaleString('fr-FR')} XPF`
                    : coupon.label}
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              {coupon.qr_code_url ? (
                <img src={coupon.qr_code_url} alt={`QR code ${coupon.code}`} className="h-56 w-56 rounded-[1.5rem] border border-night/10 bg-white p-3" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-[1.5rem] border border-dashed border-night/10 bg-sand/30">
                  <QrCode className="h-12 w-12 text-night/30" />
                </div>
              )}
              <p className="max-w-md text-center text-sm text-night/60">Présentez ce QR à la caisse. L’écran reste volontairement blanc pour garantir une bonne lisibilité.</p>
              {coupon.valid_until ? (
                <p className="text-xs font-semibold text-emerald-700">Valable jusqu’au {new Intl.DateTimeFormat('fr-FR').format(new Date(coupon.valid_until))}</p>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="w-full rounded-[2rem] border border-night/10 bg-white p-8 text-center shadow-[0_18px_70px_rgba(8,32,50,0.08)]">
            <XCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h1 className="mt-4 text-2xl font-bold text-night">Coupon indisponible</h1>
            <p className="mt-2 text-sm text-night/60">{coupon?.reason || 'Ce coupon n’est pas valide.'}</p>
          </section>
        )}
      </div>
    </main>
  )
}
