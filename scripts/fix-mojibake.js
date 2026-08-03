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
  ['V�hicules', 'Véhicules'],
  ['Communes, tribus, �les', 'Communes, tribus, îles'],
  ['Pros v�rifi�s', 'Pros vérifiés'],
  ['Les premi�res annonces arrivent bient�t.', 'Les premières annonces arrivent bientôt.'],
  ['Les meilleures annonces appara�tront ici', 'Les meilleures annonces apparaîtront ici'],
  ['Boostez votre annonce pour appara�tre en t�te de page.', 'Boostez votre annonce pour apparaître en tête de page.'],
  ['D�poser une annonce', 'Déposer une annonce'],
  ['G�rer mes alertes', 'Gérer mes alertes'],
  ['Cat�gorie', 'Catégorie'],
  ['Cat�gories', 'Catégories'],
  ['Sponsoris�', 'Sponsorisé'],
  ['D�couvrir', 'Découvrir'],
  ['G�rer les campagnes', 'Gérer les campagnes'],
  ['Bons plans & ï¿½vï¿½nements', 'Bons plans & Événements'],
  ['mobilitï¿½', 'mobilité'],
  ['trajets ï¿½ partager', 'trajets à partager'],
  ['ï¿½0tat', 'État'],
  ['Noumï¿½a', 'Nouméa'],
  ['Dumbï¿½a', 'Dumbéa'],
  ['Canapï¿½', 'Canapé'],
  ['mots-clï¿½s', 'mots-clés'],
  ['modï¿½le', 'modèle'],
  ['Derniï¿½re', 'Dernière'],
  ['rï¿½servations', 'réservations'],
  ['sï¿½curitï¿½', 'sécurité'],
  ['ï¿½changes', 'échanges'],
  ['V\uFFFDhicules', 'Véhicules'],
  ['Nouvelle-Cal�donie', 'Nouvelle-Calédonie'],
  ['Annonces, services et pros locaux partout en Nouvelle-Cal�donie. De Nouméa aux Loyaut�, de Koné à l&apos;île des Pins.', 'Annonces, services et pros locaux partout en Nouvelle-Calédonie. De Nouméa aux Loyauté, de Koné à l&apos;île des Pins.'],
  ['Les utilisateurs peuvent enregistrer des mots-cl�s pour suivre ce qui compte vraiment: un mod�le pr�cis, une commune, une gamme de prix ou une cat�gorie.', 'Les utilisateurs peuvent enregistrer des mots-clés pour suivre ce qui compte vraiment: un modèle précis, une commune, une gamme de prix ou une catégorie.'],
  ['Promotions, culture et mobilit� locale', 'Promotions, culture et mobilité locale'],
  ['Le prochain �v�nement NC m�rite d&apos;�tre ici.', 'Le prochain événement NC mérite d\'être ici.'],
  ['Concerts, march�s, conf�rences - tout y est.', 'Concerts, marchés, conférences - tout y est.'],
  ['Cr�er un �v�nement', 'Créer un événement'],
  ['Mobilit�', 'Mobilité'],
  ['pensés pour la recherche rapide, les réservations simples et la sécurité des �changes.', 'pensés pour la recherche rapide, les réservations simples et la sécurité des échanges.'],
  ['D�poser', 'Déposer'],
  ['Param�tres', 'Paramètres'],
  ['D�connexion', 'Déconnexion'],
  ['Communes, tribus, \uFFFDles', 'Communes, tribus, îles'],
  ['Pros v\uFFFDrifi\uFFFDs', 'Pros vérifiés'],
  ['Les premi\uFFFDres annonces arrivent bient\uFFFDt.', 'Les premières annonces arrivent bientôt.'],
  ['Les meilleures annonces appara\uFFFDtront ici', 'Les meilleures annonces apparaîtront ici'],
  ['Boostez votre annonce pour appara\uFFFDtre en t\uFFFDte de page.', 'Boostez votre annonce pour apparaître en tête de page.'],
  ['D\uFFFDposer une annonce', 'Déposer une annonce'],
  ['Gardez vos recherches en m\uFFFDmoire', 'Gardez vos recherches en mémoire'],
  ['Publi\uFFFD par', 'Publié par'],
  ['Derni\uFFFDre place', 'Dernière place'],
  ['V\uFFFDhicule d\uFFFDtaill\uFFFD', 'Véhicule détaillé'],
  ['Fiabilit\uFFFD', 'Fiabilité'],
  ['Trajet v\uFFFDrifi\uFFFD', 'Trajet vérifié'],
  ['Sponsoris\uFFFD', 'Sponsorisé'],
  ['Une visibilit\uFFFD locale payante, affich\uFFFDe au bon moment sur Kalico.', 'Une visibilité locale payante, affichée au bon moment sur Kalico.'],
  ['D\uFFFDcouvrir', 'Découvrir'],
  ['G\uFFFDrer les campagnes', 'Gérer les campagnes'],
  ['Bons plans & \uFFFDv\uFFFDnements', 'Bons plans & Événements'],
  ['trajets \uFFFD partager', 'trajets à partager'],
  ['Ajouter la v\uFFFDtre', 'Ajouter la vôtre'],
  ['pens\uFFFDs', 'pensés'],
  ['r\uFFFDservations', 'réservations'],
  ['s\uFFFDcurit\uFFFD', 'sécurité'],
  ['\uFFFDtat', 'État'],
  ['Noum\uFFFDa', 'Nouméa'],
  ['Dumb\uFFFDa', 'Dumbéa'],
  ['Cat\uFFFDgorie', 'Catégorie'],
  ['Cat\uFFFDgories', 'Catégories'],
  ['Sous-cat\uFFFDgorie', 'Sous-catégorie'],
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

  if (output.startsWith('\uFEFF')) {
    output = output.slice(1)
    total += 1
  }
  if (output.startsWith('\uFFFD')) {
    output = output.slice(1)
    total += 1
  }

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

  const tagReplacement = applyReplacements(output, [
    ['<\uFFFD', '🎭'],
    ['\u000f', ''],
  ])
  output = tagReplacement.text
  total += tagReplacement.count

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
