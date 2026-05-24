import { redirect } from 'next/navigation'
import { getAdminEmail, getAdminTotpSecret, isTotpConfigured } from '@/lib/auth'
import { createOtpAuthUrl } from '@/lib/totp'
import SetupClient from './setup-client'

export default async function SetupPage() {
  if (isTotpConfigured()) {
    redirect('/login')
  }

  const otpAuthUrl = createOtpAuthUrl({
    secret: getAdminTotpSecret(),
    label: `Troca Admin (${getAdminEmail()})`,
    issuer: 'Troca',
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
      <section className="grid w-full gap-8 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="admin-label">Première configuration</p>
          <h1 className="mt-3 text-3xl font-semibold">Activer le TOTP admin</h1>
          <p className="mt-4 max-w-prose text-sm leading-6 text-slate-300">
            La configuration se fait manuellement avec Google Authenticator ou une application équivalente. Copiez le lien TOTP ci-contre dans votre application ou saisissez la clé à la main si nécessaire.
          </p>
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
            Compte prévu : <span className="font-semibold">{getAdminEmail()}</span>
          </div>
          <SetupClient />
        </div>

        <div className="flex flex-col justify-center rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">Configuration manuelle</p>
            <p className="mt-2 text-slate-400">
              Ajoutez ce compte dans votre application d'authentification avec l'URL ci-dessous.
            </p>
            <p className="mt-3 break-all rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-slate-200">
              {otpAuthUrl}
            </p>
          </div>
          <p className="mt-4 text-center text-sm text-slate-400">Une fois le code validé, cette page sera désactivée.</p>
        </div>
      </section>
    </main>
  )
}
