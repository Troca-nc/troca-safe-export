#!/usr/bin/env node
// Contrôle des ajouts depuis la base Git ; tous les fichiers nouveaux sont inclus.
import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = realpathSync.native(
  resolve(dirname(fileURLToPath(import.meta.url)), '..'),
)
const args = new Set(process.argv.slice(2))
const normalize = (value) => value.replaceAll('\\', '/')
const git = (...argv) =>
  execFileSync('git', argv, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
const EXT = /\.(tsx?|jsx?|css)$/
const errors = []
const warnings = []
function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return []
    const file = resolve(dir, entry.name)
    return entry.isDirectory() ? walk(file) : EXT.test(file) ? [file] : []
  })
}
let files
let base
let repository
if (args.has('--changed')) {
  repository = git('rev-parse', '--show-toplevel').trim()
  const explicit = process.argv
    .find((arg) => arg.startsWith('--base='))
    ?.slice(7)
  for (const candidate of explicit ? [explicit] : ['origin/main', 'main']) {
    try {
      base = git('merge-base', 'HEAD', candidate).trim()
      break
    } catch {
      /* Try the next existing ref. */
    }
  }
  if (!base)
    throw new Error(
      'Base Git introuvable : récupérer origin/main ou préciser --base=<ref>.',
    )
  const tracked = git(
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    '-z',
    base,
    '--',
    ROOT,
  )
    .split('\0')
    .filter(Boolean)
  const untracked = git(
    'ls-files',
    '--others',
    '--exclude-standard',
    '--full-name',
    '-z',
    '--',
    ROOT,
  )
    .split('\0')
    .filter(Boolean)
  files = [
    ...new Set(
      [...tracked, ...untracked].map((file) => resolve(repository, file)),
    ),
  ].filter(
    (file) =>
      EXT.test(file) &&
      normalize(relative(ROOT, file)).startsWith('src/') &&
      existsSync(file),
  )
} else files = walk(resolve(ROOT, 'src'))

function addedLines(file) {
  if (!base) return null
  const repoPath = normalize(relative(repository, file))
  try {
    git('cat-file', '-e', base + ':' + repoPath)
  } catch {
    return null
  }
  const patch = git(
    'diff',
    '--unified=0',
    '--no-color',
    base,
    '--',
    ':(top)' + repoPath,
  )
  const lines = new Set()
  let number = 0
  for (const line of patch.split('\n')) {
    const hunk = /^@@ .* \+(\d+)(?:,\d+)? @@/.exec(line)
    if (hunk) {
      number = Number(hunk[1])
      continue
    }
    if (line.startsWith('+++') || line.startsWith('---')) continue
    if (line.startsWith('+')) lines.add(number++)
    else if (line.startsWith(' ')) number++
  }
  return lines
}

const rules = [
  {
    re: /#b85c00/i,
    message: 'ancienne couleur orange : utiliser accent-strong ou accent-text',
  },
  {
    re: /\bbg-white\b|#fbfcfc\b|#ffffff\b|#fff\b/i,
    message: 'blanc pur : utiliser une surface crème',
  },
  {
    re: /\bnc-(lagon|emeraude|corail|sable)\b|--coral\b|--ocean\b|--lagoon\b|--night\b|--jungle\b/,
    message: 'ancienne palette dans du code ajouté',
  },
  { re: /#[\da-f]{3,8}\b/i, message: 'couleur en dur : utiliser un token' },
  {
    re: /style=\{\{/,
    message: 'style en ligne : vérifier que la valeur est réellement dynamique',
    warning: true,
  },
  {
    re: /text-\[(1[0-4])px\]/,
    message: 'texte sous 15 px : utiliser un rôle typographique explicite',
    warning: true,
  },
]
for (const file of files) {
  const name = normalize(relative(ROOT, file))
  // La définition des tokens est le seul emplacement CSS autorisé pour les couleurs littérales.
  const definesTokens = name === 'src/styles/kalico-tokens.css'
  const additions = addedLines(file)
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (additions && !additions.has(index + 1)) return
      if (!name.startsWith('src/lib/data/') && !name.startsWith('src/demo/')) {
        for (const match of line.matchAll(
          /(?:from\s*|import\s*\(|require\s*\()\s*['"]([^'"]+)/g,
        )) {
          const specifier = match[1]
          const target = specifier.startsWith('@/')
            ? resolve(ROOT, 'src', specifier.slice(2))
            : specifier.startsWith('.')
              ? resolve(dirname(file), specifier)
              : null
          if (
            target &&
            normalize(relative(ROOT, target)).startsWith('src/demo/')
          )
            errors.push(
              name +
                ':' +
                (index + 1) +
                ' import de fixture hors de src/lib/data',
            )
        }
      }
      if (definesTokens) return
      for (const rule of rules)
        if (rule.re.test(line))
          (rule.warning ? warnings : errors).push(
            name + ':' + (index + 1) + ' ' + rule.message,
          )
    })
}
// Critère de la fiche 00 : aucun hex, y compris dans les anciens composants UI.
for (const file of walk(resolve(ROOT, 'src/components/ui'))) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (/#[\da-f]{3,8}\b/i.test(line))
        errors.push(
          normalize(relative(ROOT, file)) +
            ':' +
            (index + 1) +
            ' hex interdit dans la bibliothèque UI',
        )
    })
}
if (args.has('--launch')) {
  for (const env of ['.env.production', '.env.production.local']) {
    const file = resolve(ROOT, env)
    if (
      existsSync(file) &&
      /^\s*NEXT_PUBLIC_DEMO_DATA\s*=\s*['"]?true\b/m.test(
        readFileSync(file, 'utf8'),
      )
    )
      errors.push(env + ' : mode démo actif')
  }
  const ph = resolve(ROOT, 'src/content/placeholders.ts')
  if (existsSync(ph) && /provisional:\s*true/.test(readFileSync(ph, 'utf8')))
    errors.push('src/content/placeholders.ts : chiffres encore provisoires')
  for (const file of walk(resolve(ROOT, 'src')))
    if (/TODO-LANCEMENT/.test(readFileSync(file, 'utf8')))
      errors.push(normalize(relative(ROOT, file)) + ' : TODO-LANCEMENT')
}
for (const message of [...new Set(warnings)])
  console.log('AVERTISSEMENT ' + message)
for (const message of [...new Set(errors)]) console.error('ERREUR ' + message)
console.log(
  files.length +
    ' fichiers · ' +
    errors.length +
    ' erreur(s) · ' +
    warnings.length +
    ' avertissement(s)',
)
if (!files.length)
  console.log(
    'Aucun fichier source nouveau ou modifié à contrôler ; aucune validation visuelle implicite.',
  )
process.exitCode = errors.length ? 1 : 0
