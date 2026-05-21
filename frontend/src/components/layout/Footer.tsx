import Link from 'next/link'
import Image from 'next/image'
import { Mail, Shield, FileText, Lock, MessageCircle } from 'lucide-react'

const links = [
  { href: '/mentions-legales', label: 'Mentions legales', icon: FileText },
  { href: '/cgu', label: 'CGU', icon: FileText },
  { href: '/confidentialite', label: 'Confidentialite', icon: Lock },
  { href: '/securite', label: 'Securite', icon: Shield },
  { href: '/contact', label: 'Contact', icon: MessageCircle },
]

export default function Footer() {
  return (
    <footer className="border-t border-night/10 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="relative h-12 w-12 overflow-hidden rounded-full border border-night/10 bg-white shadow-[0_8px_24px_rgba(8,32,50,0.12)]">
                <Image
                  src="/brand/troca-logo.png"
                  alt="Troca"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <div>
                <span className="block font-display text-lg font-bold text-night">Troca</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-coral/80">
                  Nouvelle-Caledonie
                </span>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-night/60">
              Petites annonces en Nouvelle-Caledonie. Achetez, vendez, echangez et contactez des
              vendeurs locaux depuis le web ou le mobile.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-night">Informations</p>
            <div className="grid gap-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-2 text-sm text-night/60 transition-colors hover:text-coral"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <a
                href="mailto:contact@troca.nc"
                className="inline-flex items-center gap-2 text-sm text-night/60 transition-colors hover:text-coral"
              >
                <Mail className="h-4 w-4" />
                contact@troca.nc
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-night/10 pt-4 text-xs text-night/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Troca. Tous droits reserves.</p>
          <p>Nouvelle-Caledonie.</p>
        </div>
      </div>
    </footer>
  )
}
