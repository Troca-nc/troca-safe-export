import type { TrocListing } from '@/types/troc-page'

type Props = {
  mine: TrocListing | null
  target: TrocListing
  angle: number
  complement: number
}

const formatXpf = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} F`

function PlateauCard({ listing, empty = false }: { listing: TrocListing | null; empty?: boolean }) {
  if (!listing || empty) {
    return <div className="flex h-[92px] items-center justify-center rounded-control border border-dashed border-warm-border bg-cream-surface px-3 text-center text-meta text-ink/60">Votre annonce ici</div>
  }
  return (
    <div className="overflow-hidden rounded-control border border-warm-border bg-cream-surface shadow-card">
      <div className="flex h-9 items-center justify-center bg-cream-sunken font-mono text-mono-xs text-ink/55">{listing.category}</div>
      <div className="p-2">
        <p className="truncate text-label-sm">{listing.title}</p>
        <p className="mt-1 font-display text-[20px] leading-none">{formatXpf(listing.valueXpf)}</p>
      </div>
    </div>
  )
}

export default function TrocBalanceGraphic({ mine, target, angle, complement }: Props) {
  return (
    <div className="relative mx-auto h-[280px] w-full max-w-[520px] overflow-hidden px-2" aria-label="Balance du trocomètre">
      <span className="absolute left-2 top-2 text-eyebrow-sm uppercase text-ink/55">Vous donnez</span>
      <span className="absolute right-2 top-2 text-eyebrow-sm uppercase text-ink/55">Vous recevez</span>
      <div className="absolute left-1/2 top-[58px] h-[204px] w-2 -translate-x-1/2 rounded-control bg-ink" />
      <div className="absolute bottom-3 left-1/2 h-3 w-36 -translate-x-1/2 rounded-pill bg-ink-deep" />
      <div className="absolute left-1/2 top-[56px] z-10 h-4 w-4 -translate-x-1/2 rounded-pill border-[3px] border-ink bg-accent" />
      <div
        className="absolute left-[12%] right-[12%] top-16 z-[5] h-1.5 rounded-pill bg-ink transition-transform duration-slow"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <span className="absolute -left-1 top-[-3px] h-3 w-3 rounded-pill bg-ink" />
        <span className="absolute -right-1 top-[-3px] h-3 w-3 rounded-pill bg-ink" />
      </div>
      <div className="absolute bottom-8 left-[3%] w-[42%] max-w-[170px]">
        {complement > 0 ? <span className="mx-auto mb-1 block w-fit rounded-pill bg-accent px-3 py-1 text-caption font-semibold text-ink-deep">+ {formatXpf(complement)}</span> : null}
        <PlateauCard listing={mine} empty={!mine} />
        <div className="mx-auto h-3 w-full rounded-b-[50%] bg-ink" />
      </div>
      <div className="absolute bottom-8 right-[3%] w-[42%] max-w-[170px]">
        {complement < 0 ? <span className="mx-auto mb-1 block w-fit rounded-pill bg-accent px-3 py-1 text-caption font-semibold text-ink-deep">+ {formatXpf(-complement)}</span> : null}
        <PlateauCard listing={target} />
        <div className="mx-auto h-3 w-full rounded-b-[50%] bg-ink" />
      </div>
    </div>
  )
}
