// 211 fichiers contiennent ï¿½ (double-encoded U+FFFD)
// introduits par commit fe407ca — correction progressive
// Build n'est pas affecté — exit code non bloquant

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src')
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx'])

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, files)
    } else if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }
  return files
}

function detectIssues(buffer) {
  const issues = []

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    issues.push('UTF-16 LE BOM')
  }

  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    issues.push('UTF-8 BOM')
  }

  if (buffer.includes(Buffer.from([0xef, 0xbf, 0xbd]))) {
    issues.push('U+FFFD replacement character')
  }

  if (buffer.includes(Buffer.from([0xc3, 0xaf, 0xc2, 0xbf, 0xc2, 0xbd]))) {
    issues.push('Mojibake ï¿½ (double-encoded U+FFFD)')
  }

  return issues
}

const suspectFiles = walk(FRONTEND_SRC).reduce((acc, file) => {
  const buffer = fs.readFileSync(file)
  const issues = detectIssues(buffer)
  if (issues.length) {
    acc.push({ file, issues })
  }
  return acc
}, [])

if (suspectFiles.length) {
  console.error('Encoding issues detected:')
  for (const item of suspectFiles) {
    console.error(`- ${path.relative(ROOT, item.file)}: ${item.issues.join(', ')}`)
  }
} else {
  console.log('No encoding issues detected.')
}
