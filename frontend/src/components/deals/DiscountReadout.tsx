export function DiscountReadout({ discount }: { discount: number | null }) {
  return (
    <div className="flex min-h-16 items-center justify-between rounded-control border border-reef/30 bg-reef/10 px-4 py-3" aria-live="polite">
      <span className="text-label font-semibold text-reef-text">Remise calculée</span>
      <span className="font-display text-h3 text-reef-text">{discount === null ? '–' : `−${discount} %`}</span>
    </div>
  )
}
