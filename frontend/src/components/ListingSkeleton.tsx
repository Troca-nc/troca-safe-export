'use client'

import type { CSSProperties } from 'react'

type ListingSkeletonProps = {
  className?: string
}

type ListingSkeletonListProps = {
  count?: number
  className?: string
}

function SkeletonLine({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
}

export function ListingSkeleton({ className = '' }: ListingSkeletonProps) {
  return (
    <article className={`card overflow-hidden ${className}`}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <SkeletonLine className="absolute inset-0 rounded-none" />
      </div>

      <div className="space-y-3 p-4">
        <SkeletonLine className="h-4 w-11/12" />
        <SkeletonLine className="h-7 w-32" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <SkeletonLine className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
              <SkeletonLine className="h-3.5 w-24" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          </div>
          <SkeletonLine className="h-3 w-16" />
        </div>
      </div>
    </article>
  )
}

export function ListingSkeletonList({ count = 6, className = '' }: ListingSkeletonListProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ListingSkeleton key={index} />
      ))}
    </div>
  )
}

export function ListingSkeletonRail({ count = 2, className = '' }: ListingSkeletonListProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ListingSkeleton key={index} />
      ))}
    </div>
  )
}

export { ListingSkeletonList as ListingSkeletonGrid }
