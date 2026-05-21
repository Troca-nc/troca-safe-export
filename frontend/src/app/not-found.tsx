import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import Header from '@/components/layout/Header'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sand-light">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-night/10 bg-white shadow-[0_12px_30px_rgba(8,32,50,0.12)]">
          <Image
            src="/brand/troca-logo.png"
            alt="Troca"
            width={96}
            height={96}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <h1 className="font-display text-3xl font-bold text-night mb-2">Page introuvable</h1>
        <p className="text-night/55 text-sm mb-8">
          L'annonce ou la page que vous cherchez n'existe plus ou a été supprimée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/annonces" className="btn-primary flex items-center justify-center gap-2 py-3 px-5">
            <Search className="w-4 h-4" /> Parcourir les annonces
          </Link>
          <Link href="/" className="btn-secondary flex items-center justify-center py-3 px-5">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
