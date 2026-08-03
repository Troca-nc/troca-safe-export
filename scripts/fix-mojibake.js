const fs = require('fs')
const path = require('path')

const ROOT_DIR = process.cwd()
const TARGET_DIR = path.join(ROOT_DIR, 'frontend', 'src')
const MAX_LATIN1_PASSES = 4

const ch = (...codes) => String.fromCodePoint(...codes)

function replaceAll(text, search, replacement) {
  if (!search) return { text, count: 0 }
  const pieces = text.split(search)
  if (pieces.length === 1) return { text, count: 0 }
  return { text: pieces.join(replacement), count: pieces.length - 1 }
}

function applyReplacements(text, pairs) {
  let output = text
  let count = 0

  for (const [search, replacement] of pairs) {
    const result = replaceAll(output, search, replacement)
    output = result.text
    count += result.count
  }

  return { text: output, count }
}

function normalizeLatin1(text) {
  let output = text
  let passes = 0

  while (passes < MAX_LATIN1_PASSES) {
    const decoded = Buffer.from(output, 'latin1').toString('utf8')
    if (decoded === output) break
    output = decoded
    passes += 1
  }

  return { text: output, count: passes }
}

function walk(dir, collected = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, collected)
      continue
    }

    if (entry.isFile() && /\.(tsx?|ts)$/i.test(entry.name)) {
      collected.push(fullPath)
    }
  }

  return collected
}

const cleanupPairs = [
  [ch(0x00c2, 0x00b7), ch(0x00b7)],
  [ch(0x00e2, 0x20ac, 0x2019), "'"],
  [ch(0x00e2, 0x20ac, 0x201c), '"'],
  [ch(0x00e2, 0x20ac, 0x201d), '"'],
  [ch(0x00e2, 0x20ac, 0x2013), '-'],
  [ch(0x00e2, 0x20ac, 0x2014), '-'],
  [ch(0x00c2, 0x00a0), ' '],
]

const directPairs = [
  [ch(0x00c3, 0x00a9), ch(0x00e9)],
  [ch(0x00c3, 0x00a8), ch(0x00e8)],
  [ch(0x00c3, 0x00aa), ch(0x00ea)],
  [ch(0x00c3, 0x00ab), ch(0x00eb)],
  [ch(0x00c3, 0x00a0), ch(0x00e0)],
  [ch(0x00c3, 0x00a2), ch(0x00e2)],
  [ch(0x00c3, 0x00ae), ch(0x00ee)],
  [ch(0x00c3, 0x00af), ch(0x00ef)],
  [ch(0x00c3, 0x00b4), ch(0x00f4)],
  [ch(0x00c3, 0x00b9), ch(0x00f9)],
  [ch(0x00c3, 0x00bb), ch(0x00fb)],
  [ch(0x00c3, 0x00bc), ch(0x00fc)],
  [ch(0x00c3, 0x00a7), ch(0x00e7)],
  [ch(0x00c3, 0x0089), ch(0x00c9)],
  [ch(0x00c3, 0x0080), ch(0x00c0)],
  [ch(0x00c3, 0x0086), ch(0x0152)],
  [ch(0x00c3, 0x0092), ch(0x0153)],
  [ch(0x00c3, 0x00a1), ch(0x00e1)],
  [ch(0x00c3, 0x00ad), ch(0x00ed)],
  [ch(0x00c3, 0x00b1), ch(0x00f1)],
  [ch(0x00c3, 0x00a8), ch(0x00e8)],
  [ch(0x00c3, 0x0087), ch(0x00c7)],
]

const emojiPairs = [
  [ch(0x00f0, 0x009f, 0x009a, 0x0097), ch(0x1f697)],
  [ch(0x00f0, 0x009f, 0x008f, 0x00a0), ch(0x1f3e0)],
  [ch(0x00f0, 0x009f, 0x009b, 0x00a0), ch(0x1f6e0)],
  [ch(0x00f0, 0x009f, 0x0093, 0x00b1), ch(0x1f4f1)],
  [ch(0x00f0, 0x009f, 0x008c, 0x00bf), ch(0x1f33f)],
  [ch(0x00f0, 0x009f, 0x008f, 0x00ad), ch(0x1f3ed)],
  [ch(0x00f0, 0x009f, 0x008f, 0x00ab), ch(0x1f3eb)],
  [ch(0x00f0, 0x009f, 0x008f, 0x00b7), ch(0x1f3f7)],
]

function fixText(input) {
  let output = input
  let total = 0

  const normalized = normalizeLatin1(output)
  if (normalized.count > 0) {
    output = normalized.text
    total += normalized.count
  }

  const direct = applyReplacements(output, directPairs)
  output = direct.text
  total += direct.count

  const cleanup = applyReplacements(output, cleanupPairs)
  output = cleanup.text
  total += cleanup.count

  const emoji = applyReplacements(output, emojiPairs)
  output = emoji.text
  total += emoji.count

  return { output, total }
}

const files = walk(TARGET_DIR)
let modifiedCount = 0

for (const filePath of files) {
  const raw = fs.readFileSync(filePath)
  const original = raw.toString('latin1')
  const { output, total } = fixText(original)

  if (output !== original) {
    fs.writeFileSync(filePath, output, 'utf8')
    modifiedCount += 1
    console.log(`${path.relative(ROOT_DIR, filePath)}: ${total} remplacement(s)`)
  }
}

console.log(`Mojibake corriges: ${modifiedCount} fichier(s) modifies.`)
