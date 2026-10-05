import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import AuthMapPanel from './AuthMapPanel'
import { Skeleton } from '@/components/ui/Skeleton'

export function AuthPageShell({ children, active = 'login' }: { children: React.ReactNode; active?: 'login' | 'signup' }) {
  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-2">
      <AuthMapPanel />
      <main className="flex min-h-screen flex-col px-4 py-6 sm:px-8 lg:px-12 lg:py-11 xl:px-[72px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Accès au compte" className="flex rounded-control border border-warm-border bg-cream-sunken p-1">
            <Link href="/connexion" aria-current={active === 'login' ? 'page' : undefined} className={`flex min-h-11 items-center rounded-[9px] px-5 text-label ${active === 'login' ? 'bg-cream-surface text-ink shadow-card' : 'text-ink/60'}`}>Se connecter</Link>
            <Link href="/inscription" aria-current={active === 'signup' ? 'page' : undefined} className={`flex min-h-11 items-center rounded-[9px] px-5 text-label ${active === 'signup' ? 'bg-cream-surface text-ink shadow-card' : 'text-ink/60'}`}>Créer un compte</Link>
          </nav>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-body-sm font-medium text-ink/60 hover:text-ink"><ArrowLeft className="h-4 w-4" />Retour au site</Link>
        </div>
        <div className="flex flex-1 items-center py-10"><div className="w-full max-w-[520px]">{children}</div></div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-warm-border pt-6 text-meta text-ink/55">
          {['Connexion sécurisée', 'Données protégées', 'Support local'].map((label) => <span key={label} className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-reef-text" />{label}</span>)}
        </div>
      </main>
    </div>
  )
}

export function AuthFormSkeleton() {
  return <div role="status" aria-busy="true" className="space-y-5"><span className="sr-only">Chargement…</span><Skeleton className="h-12 w-3/4" /><Skeleton className="h-6 w-full" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-[50px]" /></div><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-[50px]" /></div><Skeleton className="h-12" /></div>
}
