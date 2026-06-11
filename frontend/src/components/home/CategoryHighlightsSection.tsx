'use client'

import Link from 'next/link'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

import ListingCard from '@/components/listings/ListingCard'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'

type CategoryHighlightsSectionProps = {
  eyebrow: string
  title: string
  description: string
  href: string
  items: any[]
  loading?: boolean
  count?: number
}

function useRevealOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function FeedRail({
  visible,
  children,
}: {
  visible: boolean
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 max-w-full overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] md:overflow-visible md:pb-0">
      <div className="grid w-full min-w-0 max-w-full auto-cols-[minmax(78vw,1fr)] grid-flow-col gap-3 snap-x snap-mandatory md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:gap-4">
        {children}
      </div>
      <style jsx>{`
        .home-feed-card {
          opacity: ${visible ? 1 : 0};
          transform: ${visible ? 'translateY(0)' : 'translateY(12px)'};
          transition: opacity 300ms ease-out, transform 300ms ease-out;
        }
      `}</style>
    </div>
  )
}

function FeedCardShell({
  index,
  visible,
  children,
}: {
  index: number
  visible: boolean
  children: React.ReactNode
}) {
  const shouldAnimate = index < 6
  const delay = shouldAnimate ? `${index * 50}ms` : '0ms'

  return (
    <div
      className={`home-feed-card snap-start ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      style={{
        transitionDelay: visible ? delay : '0ms',
        transitionProperty: 'opacity, transform',
        transitionDuration: '300ms',
        transitionTimingFunction: 'ease-out',
      } as CSSProperties}
    >
      {children}
    </div>
  )
}

export default function CategoryHighlightsSection({
  eyebrow,
  title,
  description,
  href,
  items,
  loading = false,
  count = 3,
}: CategoryHighlightsSectionProps) {
  const { ref, visible } = useRevealOnce<HTMLElement>()
  const visibleItems = items.slice(0, count)

  return (
    <section ref={ref} className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">{eyebrow}</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-night/55">{description}</p>
        </div>
        <Link href={href} className="hidden items-center gap-1 text-sm font-semibold text-coral hover:underline md:inline-flex">
          Voir tout <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <ListingSkeletonGrid count={count} className="grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" />
      ) : visibleItems.length > 0 ? (
        <FeedRail visible={visible}>
          {visibleItems.map((listing, index) => (
            <FeedCardShell key={listing.id} index={index} visible={visible}>
              <ListingCard listing={listing} />
            </FeedCardShell>
          ))}
        </FeedRail>
      ) : (
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-center text-night/45">
          <p className="text-sm">Aucune annonce pour le moment.</p>
          <Link href="/annonces/nouvelle" className="btn-primary mt-4 inline-block">
            Publier la première annonce
          </Link>
        </div>
      )}
    </section>
  )
}
