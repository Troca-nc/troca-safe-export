'use client'
// ============================================================
//  Troca — Carte des annonces (Leaflet)
//  Affiche les annonces sur une carte avec clustering
//  Filtre "près de moi" par rayon kilométrique
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Loader2, X } from 'lucide-react'

interface Listing {
  id:         string
  titre:      string
  prix:       number | null
  cover_url?: string
  lat:        number
  lng:        number
  commune:    string
}

interface Props {
  listings: Listing[]
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
}

const NOUMEA_CENTER: [number, number] = [-22.2758, 166.4580]

export default function AnnoncesMap({ listings, onBoundsChange }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef  = useRef<any[]>([])

  const [locating,    setLocating]    = useState(false)
  const [userPos,     setUserPos]     = useState<[number, number] | null>(null)
  const [radius,      setRadius]      = useState(10) // km
  const [radiusLayer, setRadiusLayer] = useState<any>(null)

  // ── Init Leaflet (import dynamique pour éviter SSR) ───────
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return

    // Import dynamique pour Next.js SSR
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css' as any).catch(() => {}), // CSS via global
    ]).then(([L]) => {
      // Fix icônes Leaflet avec Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center:  NOUMEA_CENTER,
        zoom:    11,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstance.current = map

      // Écouter les changements de bounds pour filtrer les annonces
      map.on('moveend', () => {
        if (!onBoundsChange) return
        const b = map.getBounds()
        onBoundsChange({
          north: b.getNorth(),
          south: b.getSouth(),
          east:  b.getEast(),
          west:  b.getWest(),
        })
      })
    })

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // ── Mise à jour des marqueurs quand les annonces changent ─
  useEffect(() => {
    if (!mapInstance.current) return

    import('leaflet').then((L) => {
      // Supprimer anciens marqueurs
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      // Créer icône custom Troca
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background: #ef4444; color: white; border-radius: 50% 50% 50% 0;
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; font-size: 14px; font-weight: bold;
          transform: rotate(-45deg); border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <span style="transform: rotate(45deg)">🏷</span>
        </div>`,
        iconSize:   [32, 32],
        iconAnchor: [16, 32],
      })

      listings.forEach(l => {
        if (!l.lat || !l.lng) return

        const popup = L.popup({ maxWidth: 220, className: 'troca-popup' }).setContent(`
          <a href="/annonces/${l.id}" style="text-decoration:none;color:inherit;">
            ${l.cover_url ? `<img src="${l.cover_url}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;display:block;">` : ''}
            <div style="padding: 10px 12px;">
              <p style="font-size:13px;font-weight:600;margin:0 0 4px;color:#111;">${l.titre}</p>
              <p style="font-size:15px;font-weight:700;color:#e74c3c;margin:0 0 4px;">
                ${l.prix != null ? l.prix.toLocaleString('fr-FR') + ' XPF' : 'Prix libre'}
              </p>
              <p style="font-size:11px;color:#9ca3af;margin:0;">📍 ${l.commune}</p>
            </div>
          </a>
        `)

        const marker = L.marker([l.lat, l.lng], { icon })
          .addTo(mapInstance.current)
          .bindPopup(popup)

        markersRef.current.push(marker)
      })

      // Auto-zoom sur les marqueurs si présents
      if (listings.length > 0 && listings.some(l => l.lat && l.lng)) {
        const group = L.featureGroup(markersRef.current)
        mapInstance.current.fitBounds(group.getBounds().pad(0.1), { maxZoom: 14 })
      }
    })
  }, [listings])

  // ── Géolocalisation "près de moi" ─────────────────────────
  const locateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos: [number, number] = [coords.latitude, coords.longitude]
        setUserPos(pos)
        setLocating(false)

        import('leaflet').then((L) => {
          if (!mapInstance.current) return
          mapInstance.current.setView(pos, 13)

          // Supprimer le cercle précédent
          radiusLayer?.remove()

          // Cercle de rayon
          const circle = L.circle(pos, {
            radius:      radius * 1000, // km → m
            color:       '#2563eb',
            fillColor:   '#2563eb',
            fillOpacity: 0.08,
            weight:      2,
            dashArray:   '6 4',
          }).addTo(mapInstance.current)

          // Marqueur position utilisateur
          const userIcon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;background:#2563eb;border-radius:50%;
                   border:3px solid white;box-shadow:0 0 0 3px rgba(37,99,235,0.3)"></div>`,
            iconSize:   [14, 14],
            iconAnchor: [7, 7],
          })
          L.marker(pos, { icon: userIcon }).addTo(mapInstance.current)
            .bindPopup('📍 Votre position').openPopup()

          setRadiusLayer(circle)
        })
      },
      () => {
        setLocating(false)
        alert('Impossible d\'accéder à votre position. Vérifiez les permissions.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-night/8">
      {/* Contrôles */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Bouton "Près de moi" */}
        <button
          onClick={locateMe}
          disabled={locating}
          className="flex items-center gap-2 bg-white text-night text-xs font-medium px-3 py-2 rounded-xl shadow-md border border-night/10 hover:border-coral/40 hover:text-coral transition-all disabled:opacity-60"
        >
          {locating
            ? <Loader2 size={13} className="animate-spin" />
            : <Navigation size={13} />
          }
          {locating ? 'Localisation…' : 'Près de moi'}
        </button>

        {/* Slider rayon */}
        {userPos && (
          <div className="bg-white rounded-xl shadow-md border border-night/10 px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-night/50">Rayon</span>
              <span className="text-[11px] font-semibold text-coral">{radius} km</span>
            </div>
            <input
              type="range"
              min={2} max={50} step={2}
              value={radius}
              onChange={e => {
                const r = Number(e.target.value)
                setRadius(r)
                if (radiusLayer) {
                  import('leaflet').then((L) => {
                    radiusLayer.setRadius(r * 1000)
                  })
                }
              }}
              className="w-24 accent-coral h-1"
            />
          </div>
        )}
      </div>

      {/* Compteur annonces */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-night px-3 py-1.5 rounded-full shadow-sm border border-night/8">
          <MapPin size={11} className="inline mr-1 text-coral" />
          {listings.length} annonce{listings.length > 1 ? 's' : ''} sur la carte
        </span>
      </div>

      {/* Carte */}
      <div ref={mapRef} className="w-full h-[420px]" />
    </div>
  )
}
