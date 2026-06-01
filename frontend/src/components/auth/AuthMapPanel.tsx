'use client'

import PlatformStats from '@/components/PlatformStats'

const cityPoints = [
  { name: 'Nouméa', x: 112, y: 126, delay: '0s', labelX: 132, labelY: 112 },
  { name: 'Bourail', x: 86, y: 92, delay: '0.4s', labelX: 52, labelY: 82 },
  { name: 'Koné', x: 78, y: 66, delay: '0.8s', labelX: 42, labelY: 56 },
  { name: 'Poindimié', x: 122, y: 58, delay: '1.2s', labelX: 130, labelY: 48 },
] as const

const loyalties = [
  { cx: 220, cy: 72, rx: 12, ry: 7, delay: '0s' },
  { cx: 232, cy: 92, rx: 11, ry: 6, delay: '0.4s' },
  { cx: 221, cy: 112, rx: 10, ry: 6, delay: '0.8s' },
] as const

export default function AuthMapPanel() {
  return (
    <aside className="hidden min-h-screen overflow-hidden bg-ocean lg:flex">
      <div className="relative flex w-full items-center justify-center px-10 py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(72,202,228,0.18),transparent_28%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(180deg,rgba(8,50,79,0.98),rgba(8,32,50,0.98))]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative z-10 flex w-full max-w-[480px] flex-col items-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55">Rejoindre la communauté</p>
          <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight text-white md:text-[1.9rem]">
            Toute la <span className="text-nc-lagon">Calédonie</span> sur une seule plateforme
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/58">Acheter, vendre, troquer, entre Calédoniens.</p>

          <div className="mt-8 w-full max-w-[360px]">
            <svg viewBox="0 0 280 190" className="h-auto w-full drop-shadow-[0_24px_80px_rgba(0,0,0,0.24)]" aria-hidden="true" role="img">
              <defs>
                <filter id="nc-map-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 0.55 0"
                  />
                </filter>
              </defs>

              <g filter="url(#nc-map-glow)">
                <path
                  d="M78 33C104 20 162 25 192 50C214 68 225 96 219 121C213 146 188 161 161 166C135 171 105 166 84 153C62 140 50 120 49 98C48 72 57 45 78 33Z"
                  fill="rgba(72,202,228,0.74)"
                  stroke="#48cae4"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M79 42C100 31 151 35 177 55C196 71 205 93 200 114C195 133 176 146 154 151C128 157 101 152 83 141C66 130 58 114 58 97C57 74 63 50 79 42Z"
                  fill="rgba(255,255,255,0.06)"
                />
              </g>

              {cityPoints.map((city) => (
                <g key={city.name} className="nc-map-pulse" style={{ animationDelay: city.delay }}>
                  <circle cx={city.x} cy={city.y} r="10" fill="rgba(72,202,228,0.14)" />
                  <circle cx={city.x} cy={city.y} r="4.5" fill="#ffffff" />
                  <circle cx={city.x} cy={city.y} r="2.2" fill="#48cae4" />
                  <text
                    x={city.labelX}
                    y={city.labelY}
                    fill="rgba(255,255,255,0.92)"
                    fontSize="10"
                    fontWeight="600"
                    letterSpacing="0.01em"
                  >
                    {city.name}
                  </text>
                </g>
              ))}

              {loyalties.map((island, index) => (
                <g key={index} className={`nc-map-float nc-map-delay-${index + 1}`} style={{ animationDelay: island.delay }}>
                  <ellipse cx={island.cx} cy={island.cy} rx={island.rx} ry={island.ry} fill="rgba(72,202,228,0.82)" stroke="#48cae4" strokeWidth="1.4" />
                </g>
              ))}

              <g className="nc-map-float nc-map-delay-4" style={{ animationDelay: '1.2s' }}>
                <ellipse cx="201" cy="158" rx="12" ry="7" fill="rgba(72,202,228,0.82)" stroke="#48cae4" strokeWidth="1.4" />
              </g>
            </svg>
          </div>

          <div className="mt-8 w-full max-w-[420px]">
            <PlatformStats variant="dark" />
          </div>
        </div>
      </div>
    </aside>
  )
}
