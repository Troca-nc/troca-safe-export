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
      <div className="relative aspect-[4/3] overflow-hidden">
        <SkeletonLine className="absolute inset-0 rounded-none" />
      </div>

      <div className="space-y-2 p-3">
        <SkeletonLine className="h-4 w-11/12" />
        <SkeletonLine className="h-4 w-7/12" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <SkeletonLine className="h-5 w-24" />
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
