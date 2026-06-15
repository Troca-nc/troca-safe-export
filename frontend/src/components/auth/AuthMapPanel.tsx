'use client'

import PlatformStats from '@/components/PlatformStats'

const cityPoints = [
  { name: 'Nouméa', x: 142, y: 245, labelX: 170, labelY: 238, delay: '0s' },
  { name: 'Dumbéa', x: 156, y: 228, labelX: 184, labelY: 221, delay: '0.25s' },
  { name: 'Païta', x: 132, y: 208, labelX: 88, labelY: 202, delay: '0.5s' },
  { name: 'Bourail', x: 122, y: 171, labelX: 78, labelY: 165, delay: '0.75s' },
  { name: 'Koné', x: 156, y: 132, labelX: 184, labelY: 126, delay: '1s' },
  { name: 'Poindimié', x: 273, y: 108, labelX: 294, labelY: 102, delay: '1.25s' },
  { name: 'Lifou', x: 388, y: 206, labelX: 413, labelY: 200, delay: '1.5s' },
  { name: 'Maré', x: 438, y: 254, labelX: 458, labelY: 248, delay: '1.75s' },
  { name: 'Ouvéa', x: 452, y: 168, labelX: 376, labelY: 160, delay: '2s' },
] as const

const buoyMarkers = [
  { cx: 213, cy: 72, rx: 13, ry: 8, delay: '0s' },
  { cx: 233, cy: 96, rx: 11, ry: 7, delay: '0.35s' },
  { cx: 220, cy: 121, rx: 10, ry: 6, delay: '0.7s' },
  { cx: 198, cy: 150, rx: 12, ry: 7, delay: '1.05s' },
] as const

const contourBands = [
  'M118 74C160 48 213 49 254 72C283 88 292 111 289 135C286 159 273 183 252 201C231 219 204 231 174 236C149 239 129 236 111 228C94 220 83 207 80 190C76 173 80 155 89 137C100 114 92 89 118 74Z',
  'M131 87C168 64 212 66 244 83C266 96 274 113 272 132C270 151 259 170 242 184C223 200 200 210 175 214C154 217 138 215 124 209C111 203 102 193 100 180C97 166 100 152 108 139C119 121 115 98 131 87Z',
] as const

export default function AuthMapPanel() {
  return (
    <aside className="hidden min-h-screen overflow-hidden bg-ocean lg:flex">
      <div className="relative flex w-full items-center justify-center px-10 py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(72,202,228,0.18),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_72%_78%,rgba(10,126,164,0.18),transparent_28%),linear-gradient(180deg,rgba(8,50,79,0.98),rgba(5,24,38,0.98))]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,24,38,0.02),rgba(5,24,38,0.4))]" />

        <div className="relative z-10 flex w-full max-w-[540px] flex-col items-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">Carte marine immersive</p>
          <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight text-white md:text-[1.95rem]">
            Toute la <span className="text-nc-lagon">Nouvelle-Calédonie</span> sur une seule carte
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Une lecture simple, élégante et légèrement animée, inspirée des cartes marines pour retrouver vos repères en un clin d’œil.
          </p>

          <div className="mt-8 w-full max-w-[430px]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(2,16,27,0.58)] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(72,202,228,0.12),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_80%_82%,rgba(10,126,164,0.16),transparent_26%)]" />
              <div className="pointer-events-none absolute inset-x-6 top-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <svg
                viewBox="0 0 520 360"
                className="relative h-auto w-full drop-shadow-[0_30px_90px_rgba(0,0,0,0.32)]"
                aria-hidden="true"
                role="img"
              >
                <defs>
                  <linearGradient id="nc-water" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06263b" />
                    <stop offset="58%" stopColor="#083552" />
                    <stop offset="100%" stopColor="#0a5774" />
                  </linearGradient>
                  <linearGradient id="nc-land" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7ff2ff" />
                    <stop offset="100%" stopColor="#48cae4" />
                  </linearGradient>
                  <linearGradient id="nc-shore" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.26)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
                  </linearGradient>
                  <filter id="nc-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feColorMatrix
                      in="blur"
                      type="matrix"
                      values="1 0 0 0 0
                              0 1 0 0 0
                              0 0 1 0 0
                              0 0 0 0.65 0"
                    />
                  </filter>
                </defs>

                <rect x="0" y="0" width="520" height="360" rx="28" fill="url(#nc-water)" />

                <g opacity="0.33">
                  <path d="M56 52H464" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="6 10" />
                  <path d="M56 96H464" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <path d="M56 140H464" stroke="rgba(255,255,255,0.16)" strokeWidth="1" strokeDasharray="4 8" />
                  <path d="M56 184H464" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
                  <path d="M56 228H464" stroke="rgba(255,255,255,0.16)" strokeWidth="1" strokeDasharray="4 8" />
                  <path d="M56 272H464" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <path d="M92 40V314" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                  <path d="M170 40V314" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <path d="M248 40V314" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                  <path d="M326 40V314" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <path d="M404 40V314" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                </g>

                <g opacity="0.46" className="nc-map-float">
                  <text x="62" y="44" fill="rgba(255,255,255,0.45)" fontSize="10" fontWeight="700" letterSpacing="0.18em">
                    CHART 167°E
                  </text>
                  <text x="430" y="44" fill="rgba(255,255,255,0.45)" fontSize="10" fontWeight="700" letterSpacing="0.18em">
                    20°S
                  </text>
                </g>

                <g filter="url(#nc-glow)">
                  <path
                    d="M116 77C158 50 216 50 259 71C287 86 298 111 295 138C292 165 278 190 255 208C233 227 205 239 174 244C147 248 124 245 104 235C85 226 71 210 66 191C61 171 65 150 76 129C88 108 96 86 116 77Z"
                    fill="url(#nc-land)"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M129 89C167 65 214 67 246 83C267 94 277 113 275 132C273 152 262 171 244 185C225 201 201 212 174 216C151 219 133 216 118 209C105 203 95 193 91 179C87 165 90 151 98 138C109 120 111 100 129 89Z"
                    fill="rgba(255,255,255,0.08)"
                  />
                </g>

                {contourBands.map((path, index) => (
                  <path
                    key={path}
                    d={path}
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={index === 0 ? 1.8 : 1.2}
                    strokeDasharray={index === 0 ? '10 8' : '6 10'}
                    className="nc-map-float"
                    style={{ animationDelay: `${index * 0.55}s` }}
                  >
                    <animate attributeName="stroke-dashoffset" values="0;40" dur={index === 0 ? '7s' : '9s'} repeatCount="indefinite" />
                  </path>
                ))}

                <path
                  d="M94 226C120 210 129 206 149 202C171 198 184 194 198 183C219 167 229 146 246 141C262 136 282 138 301 145C320 152 344 165 366 177C384 187 409 196 440 201"
                  fill="none"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="2"
                  strokeDasharray="6 10"
                >
                  <animate attributeName="stroke-dashoffset" values="0;32" dur="5s" repeatCount="indefinite" />
                </path>

                <path
                  d="M392 196C406 184 420 177 434 171C448 165 461 160 475 158"
                  fill="none"
                  stroke="rgba(72,202,228,0.7)"
                  strokeWidth="2"
                  strokeDasharray="4 8"
                >
                  <animate attributeName="stroke-dashoffset" values="0;24" dur="4.2s" repeatCount="indefinite" />
                </path>

                <g>
                  <ellipse cx="395" cy="198" rx="16" ry="9" fill="rgba(72,202,228,0.28)" />
                  <ellipse cx="438" cy="250" rx="12" ry="7" fill="rgba(72,202,228,0.82)" stroke="#48cae4" strokeWidth="1.5" className="nc-map-float" />
                  <ellipse cx="457" cy="166" rx="13" ry="8" fill="rgba(72,202,228,0.78)" stroke="#48cae4" strokeWidth="1.5" className="nc-map-float" style={{ animationDelay: '0.4s' }} />
                  <ellipse cx="390" cy="206" rx="13" ry="8" fill="rgba(72,202,228,0.76)" stroke="#48cae4" strokeWidth="1.5" className="nc-map-float" style={{ animationDelay: '0.8s' }} />
                </g>

                {buoyMarkers.map((marker, index) => (
                  <g key={`${marker.cx}-${marker.cy}`} className={`nc-map-float nc-map-delay-${index + 1}`} style={{ animationDelay: marker.delay }}>
                    <ellipse
                      cx={marker.cx}
                      cy={marker.cy}
                      rx={marker.rx}
                      ry={marker.ry}
                      fill="rgba(72,202,228,0.45)"
                      stroke="rgba(255,255,255,0.36)"
                      strokeWidth="1.2"
                    />
                    <circle cx={marker.cx} cy={marker.cy} r="2.2" fill="#ffffff" />
                  </g>
                ))}

                {cityPoints.map((city) => (
                  <g key={city.name} className="nc-map-pulse" style={{ animationDelay: city.delay }}>
                    <circle cx={city.x} cy={city.y} r="12" fill="rgba(72,202,228,0.14)" />
                    <circle cx={city.x} cy={city.y} r="5" fill="#ffffff" />
                    <circle cx={city.x} cy={city.y} r="2.4" fill="#48cae4" />
                    <path
                      d={`M${city.x} ${city.y} L${city.labelX - (city.labelX > city.x ? 6 : -6)} ${city.labelY + 3}`}
                      stroke="rgba(255,255,255,0.32)"
                      strokeWidth="1"
                    />
                    <text
                      x={city.labelX}
                      y={city.labelY}
                      fill="rgba(255,255,255,0.95)"
                      fontSize="10.5"
                      fontWeight="600"
                      letterSpacing="0.01em"
                    >
                      {city.name}
                    </text>
                  </g>
                ))}

                <g className="nc-map-float" style={{ animationDelay: '1.1s' }}>
                  <circle cx="88" cy="290" r="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
                  <path d="M88 278L91 288L101 291L91 294L88 304L85 294L75 291L85 288Z" fill="#48cae4" />
                  <circle cx="88" cy="291" r="2" fill="#ffffff" />
                </g>

                <g opacity="0.68">
                  <text x="64" y="314" fill="rgba(255,255,255,0.54)" fontSize="10" fontWeight="600" letterSpacing="0.16em">
                    NOUVELLE-CALÉDONIE
                  </text>
                  <text x="356" y="314" fill="rgba(255,255,255,0.42)" fontSize="10" fontWeight="600" letterSpacing="0.12em">
                    NOUMÉA · KONÉ · LIFOU
                  </text>
                </g>
              </svg>

              <div className="mt-4 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/48">
                <span>Carte marine stylisée</span>
                <span>Animation légère</span>
              </div>
            </div>
          </div>

          <div className="mt-8 w-full max-w-[420px]">
            <PlatformStats variant="dark" />
          </div>
        </div>
      </div>
    </aside>
  )
}
