import type { ReactNode } from 'react'
import Link from 'next/link'

export type AccountTabItem = {
  id: string
  label: string
  href?: string
  icon?: ReactNode
  count?: number
}

export default function AccountTabs({
  items,
  activeId,
  onSelect,
  label = 'Navigation du compte',
}: {
  items: AccountTabItem[]
  activeId: string
  onSelect?: (id: string) => void
  label?: string
}) {
  const tabClass = (active: boolean) => [
    'relative inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-[15px] transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-strong',
    active
      ? 'border-accent-strong font-semibold text-ink'
      : 'border-transparent font-medium text-ink/60 hover:text-ink',
  ].join(' ')

  return (
    <nav aria-label={label} className="overflow-x-auto border-b border-warm-border">
      <div className="flex min-w-max items-center gap-1">
        {items.map((item) => {
          const active = item.id === activeId
          const content = (
            <>
              {item.icon}
              <span>{item.label}</span>
              {typeof item.count === 'number' ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-caption font-semibold text-ink-deep">
                  {item.count > 99 ? '99+' : item.count}
                </span>
              ) : null}
            </>
          )

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className={tabClass(active)} aria-current={active ? 'page' : undefined}>
                {content}
              </Link>
            )
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={tabClass(active)}
              aria-current={active ? 'page' : undefined}
            >
              {content}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
