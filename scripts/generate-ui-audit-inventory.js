const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const APP_ROOT = path.join(ROOT, 'frontend', 'src', 'app')
const OUTPUT = path.join(ROOT, 'docs', 'quality', 'ROUTE_INVENTORY.md')
const mode = process.argv[2]

const AUTOMATED_ROUTES = new Set([
  '/',
  '/annonces',
  '/annonces/nouvelle',
  '/cgu',
  '/connexion',
  '/inscription',
  '/parametres',
  '/politique-de-confidentialite',
])

const CRITICAL_ROUTES = new Set([
  '/',
  '/annonces',
  '/annonces/[id]',
  '/annonces/nouvelle',
  '/connexion',
  '/inscription',
  '/inscription/telephone',
  '/messages',
  '/parametres',
  '/profil',
  '/verification-email',
])

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(fullPath, files)
    else if (entry.name === 'page.tsx') files.push(fullPath)
  }
  return files
}

function routeFor(file) {
  const relative = path.relative(APP_ROOT, path.dirname(file)).split(path.sep).filter(Boolean)
  return relative.length ? `/${relative.join('/')}` : '/'
}

function audienceFor(route) {
  if (route.startsWith('/admin')) return 'administrateur'
  if (route.startsWith('/pro/dashboard')) return 'professionnel'
  if (/^\/(annonces\/nouvelle|alertes|favoris|mes-rdv|messages|notifications|parametres|profil(?:\/|$))/.test(route)) {
    return 'particulier connecté'
  }
  if (route.startsWith('/dev') || route.startsWith('/qa')) return 'interne'
  return 'public'
}

function priorityFor(route) {
  if (CRITICAL_ROUTES.has(route)) return 'P0'
  if (/^\/(annonces|appels-offres|cgu|cgv|confidentialite|covoiturage|politique-|pro|troc)/.test(route)) return 'P1'
  return 'P2'
}

function render() {
  const routes = walk(APP_ROOT).map(routeFor).sort((left, right) => left.localeCompare(right, 'fr'))
  const rows = routes.map((route) => {
    const automation = AUTOMATED_ROUTES.has(route) ? 'contraste + texte + largeur' : 'à planifier'
    return `| \`${route}\` | ${audienceFor(route)} | ${priorityFor(route)} | ${automation} | À auditer |`
  })

  return [
    '# Inventaire des routes UI',
    '',
    '> Généré par `npm run quality:inventory`. Ne pas modifier manuellement.',
    '',
    `Routes détectées : **${routes.length}**.`,
    '',
    '| Route | Audience | Priorité | Automatisation actuelle | Audit manuel |',
    '|---|---|---:|---|---|',
    ...rows,
    '',
  ].join('\n')
}

const expected = render()

if (mode === '--write') {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, expected, 'utf8')
  console.log(`Inventaire écrit: ${path.relative(ROOT, OUTPUT)}`)
} else if (mode === '--check') {
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : ''
  if (current !== expected) {
    console.error('Inventaire des routes obsolète. Exécuter: npm run quality:inventory')
    process.exitCode = 1
  } else {
    console.log('Inventaire des routes à jour.')
  }
} else {
  process.stdout.write(expected)
}
