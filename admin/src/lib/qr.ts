import crypto from 'node:crypto'

function escapeXml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hashBits(text: string) {
  const hash = crypto.createHash('sha256').update(text).digest()
  const bits: boolean[] = []
  for (const byte of hash) {
    for (let i = 7; i >= 0; i -= 1) {
      bits.push(Boolean((byte >> i) & 1))
    }
  }
  return bits
}

export function buildQrLikeDataUrl(text: string) {
  const size = 21
  const cell = 12
  const padding = 20
  const bits = hashBits(text)

  const squares: string[] = []
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (x + y * size) % bits.length
      const on = bits[index] || x < 3 || y < 3 || x > size - 4 || y > size - 4 || (x > 13 && y > 13 && x < 18 && y < 18)
      if (on) {
        squares.push(`<rect x="${padding + x * cell}" y="${padding + y * cell}" width="${cell}" height="${cell}" rx="2" ry="2" fill="#0f172a"/>`)
      }
    }
  }

  const width = padding * 2 + size * cell
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width + 84}" viewBox="0 0 ${width} ${width + 84}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect x="0" y="0" width="${width}" height="${width}" rx="24" fill="#ffffff"/>
      ${squares.join('')}
      <rect x="${padding - 2}" y="${width + 8}" width="${width - (padding - 2) * 2}" height="56" rx="14" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="${width / 2}" y="${width + 34}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#0f172a">Configuration TOTP</text>
      <text x="${width / 2}" y="${width + 50}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#475569">${escapeXml(text.slice(0, 64))}${text.length > 64 ? '...' : ''}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

