'use client'

import Image from 'next/image'
import { useState } from 'react'

type ListingImageProps = {
  src?: string | null
  alt: string
  fallbackIcon?: string
  className?: string
  imgClassName?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  onClick?: () => void
}

export default function ListingImage({
  src,
  alt,
  fallbackIcon = '📦',
  className = '',
  imgClassName = '',
  fill = true,
  sizes = '(max-width: 640px) 100vw, 50vw',
  priority = false,
  onClick,
}: ListingImageProps) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-sand ${className}`} onClick={onClick}>
        <span className="text-4xl opacity-30">{fallbackIcon}</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      onError={() => setErrored(true)}
      className={`object-cover ${imgClassName}`}
      onClick={onClick}
    />
  )
}
