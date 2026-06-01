function escapePdfText(value: string) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?')
}

function buildContentLines(lines: string[]) {
  let y = 800
  const commands: string[] = []
  commands.push('BT')
  commands.push('/F1 12 Tf')
  for (const line of lines) {
    commands.push(`1 0 0 1 50 ${y} Tm`)
    commands.push(`(${escapePdfText(line)}) Tj`)
    y -= 16
  }
  commands.push('ET')
  return commands.join('\n')
}

export function buildSimplePdf(lines: string[]) {
  const content = buildContentLines(lines)
  const objects: string[] = []

  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj')
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj')
  objects.push(
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj',
  )
  objects.push(`4 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj`)
  objects.push('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj')

  const header = '%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n'
  let body = header
  const offsets: number[] = [0]

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'))
    body += `${obj}\n`
  }

  const xrefStart = Buffer.byteLength(body, 'utf8')
  const xrefLines = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f ']
  for (let i = 1; i < offsets.length; i += 1) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n `)
  }
  const trailer = [
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefStart),
    '%%EOF',
  ].join('\n')

  return Buffer.from(`${body}${xrefLines.join('\n')}\n${trailer}\n`, 'utf8')
}
