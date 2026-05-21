// src/components/annonces/ShareFloating.tsx
// ── Bouton flottant WhatsApp sur mobile (fixé en bas à droite) ───────────────
// Visible uniquement sur mobile — disparaît au scroll vers le haut

'use client'

import { useState, useEffect } from 'react'
import ShareButton from './ShareButton'

interface ShareFloatingProps {
  annonce: {
    id:      number
    titre:   string
    prix:    number | null
    commune: string | null
  }
}

export default function ShareFloating({ annonce }: ShareFloatingProps) {
  const [visible, setVisible] = useState(false)
  const [lastY,   setLastY]   = useState(0)

  // Apparaît après 300px de scroll, disparaît quand on remonte
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      if (y > 300 && y > lastY) setVisible(true)
      if (y < lastY - 50)       setVisible(false)
      setLastY(y)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [lastY])

  return (
    // Visible seulement sur mobile (md:hidden)
    <div
      className={`md:hidden fixed bottom-6 right-4 z-40 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
      }`}
    >
      <ShareButton
        annonce={annonce}
        variant="minimal"
        className="shadow-lg"
      />
    </div>
  )
}
