'use client'

import ShareSheet from './ShareSheet'
import type { ShareContent } from '@/lib/share'

type Props = {
  content: ShareContent
  variant?: 'full' | 'icon' | 'compact'
  label?: string
  className?: string
}

export default function ContentShareButton(props: Props) {
  return <ShareSheet {...props} />
}
