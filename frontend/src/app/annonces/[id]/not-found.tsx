import Link from 'next/link'
import Header from '@/components/layout/Header'

export default function ListingNotFound() {
  return <><Header /><main className="mx-auto flex min-h-[60vh] max-w-container items-center justify-center px-4 py-20"><div className="max-w-xl text-center"><p className="text-eyebrow uppercase text-info-text">Annonce introuvable</p><h1 className="mt-3 font-display text-h1-form text-ink">Cette annonce n’est plus disponible.</h1><p className="mt-5 text-body text-ink/65">Elle a peut-être été retirée ou le lien est incorrect.</p><Link href="/annonces" className="k-button k-button-primary mt-8 inline-grid">Voir les annonces</Link></div></main></>
}
