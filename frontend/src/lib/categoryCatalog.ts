import { buildCategoryTreeFromFlatRows, flattenCategoryTaxonomy } from '@/shared-copy/categoryTaxonomy'

export type CategoryNode = {
  id: string
  name: string
  slug: string
  icon?: string
  children?: CategoryNode[]
  subcategories?: CategoryNode[]
}

export function hasNestedCategoryTree(categories: CategoryNode[]) {
  const visit = (nodes: CategoryNode[], depth = 0): boolean => {
    for (const node of nodes || []) {
      const children = node.children || node.subcategories || []
      if (depth === 0 && children.length > 0) return true
      if (children.length > 0 && visit(children, depth + 1)) return true
      if (depth > 0 && children.length > 0) return true
    }
    return false
  }

  return visit(categories)
}

const ROOT_ICON_MAP: Record<string, string> = {
  vehicules: 'car',
  nautisme: 'ship',
  immobilier: 'home',
  emploi: 'briefcase',
  mode: 'shirt',
  'maison-jardin': 'sofa',
  'bricolage-outillage': 'hammer',
  'pieces-equipement': 'wrench',
  'famille-puericulture': 'users',
  'electronique-multimedia': 'smartphone',
  loisirs: 'dumbbell',
  'collections-antiquites': 'gift',
  animaux: 'paw',
  services: 'handshake',
  'materiel-professionnel': 'package',
  divers: 'layers',
}

function normalizeCategoryText(...parts: string[]) {
  return parts
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function inferIconKey(name: string, slug: string, path: string[] = []) {
  const text = normalizeCategoryText(name, slug, ...path)

  if (/(citadines|berlines)/.test(text)) return 'sedan'
  if (/(suv|4x4)/.test(text)) return 'suv'
  if (/(breaks|wagon)/.test(text)) return 'wagon'
  if (/(monospaces|vans|fourgons)/.test(text)) return 'van'
  if (/(cabriolets|convertibles)/.test(text)) return 'convertible'
  if (/(voitures de sport|sportives)/.test(text)) return 'sports-car'
  if (/(voitures de collection|collection)/.test(text)) return 'vintage-car'
  if (/(voiturettes)/.test(text)) return 'mini-car'
  if (/(routieres|motos|roadsters|custom|trails|enduro|cross)/.test(text)) return 'motorcycle'
  if (/(scooters|125cc|3 roues)/.test(text)) return 'scooter'
  if (/(velos|vtc|vtt|vae|velo de route|velo enfant|free-style|trottinettes)/.test(text)) return 'bike'

  if (/(appartements|colocations)/.test(text)) return 'apartment'
  if (/(maisons|villas)/.test(text)) return 'villa'
  if (/(terrains)/.test(text)) return 'land'
  if (/(parkings)/.test(text)) return 'parking'
  if (/(bureaux|commerces|docks|entrepots)/.test(text)) return 'office'

  if (/(manteaux|vestes|blazers|tailleurs|hauts|t-shirts|chemises|pulls|sweats|robes|jupes|pantalons|leggings|shorts|combinaisons|lingerie|pyjamas|maillots de bain|vetements de sport|v�tements de sport)/.test(text)) {
    return 'shirt'
  }
  if (/(chaussures|baskets|sandales|mocassins|bottes|claquettes|tongs|chaussons)/.test(text)) {
    return 'shoe'
  }
  if (/(sacs|pochettes|porte-monnaie|portemonnaie|trousses|banane|bandouliere|bandouli�re|sacs a main|sacs a dos|sacs de voyage|sacs de sport)/.test(text)) {
    return 'shopping-bag'
  }
  if (/(beaute|beaut�|parfums|maquillage|bijoux|montres|foulards|ceintures|chapeaux|casquettes|lunettes|accessoires cheveux|accessoires de beaut�)/.test(text)) {
    return 'sparkles'
  }

  if (/(animaux|chiens|chats|chevaux|rongeurs|adoption|perdus|trouves|trouv�s)/.test(text)) return 'paw'
  if (/(services|depannages|demenagement|livraison|cours particuliers|administratif|garde d'enfants|soins|sports|sante|sant�|beaute|beaut�|bien-etre|bien-�tre)/.test(text)) return 'handshake'
  if (/(agriculture|espaces verts|jardinage|piscine|spa|plantes|semences)/.test(text)) return 'sprout'
  if (/(btp|construction|travaux|depannages|outillage|bricolage)/.test(text)) return 'hammer'
  if (/(telecom|internet|medias|m�dias|photo|son|audio|electronique|multimedia|multim�dia|smartphone|ordinateur|tv|television|t�l�vision)/.test(text)) return 'smartphone'
  if (/(collections|antiquites|antiquit�s)/.test(text)) return 'gift'
  if (/(loisirs|musique|lecture|jeux|sport|fitness|camping|creatifs|cr�atifs|modelisme|mod�lisme|airsoft|tir)/.test(text)) return 'dumbbell'

  return ROOT_ICON_MAP[slug] || 'layers'
}

function cloneWithIcons(nodes: any[], path: string[] = []): CategoryNode[] {
  return nodes.map((node) => {
    const currentPath = [...path, node.name]
    const children = cloneWithIcons(node.children || node.subcategories || [], currentPath)
    return {
      id: String(node.id),
      name: node.name,
      slug: node.slug,
      icon: node.icon ?? inferIconKey(node.name, node.slug, currentPath),
      children,
      subcategories: children,
    }
  })
}

export const FALLBACK_CATEGORIES: CategoryNode[] = cloneWithIcons(
  buildCategoryTreeFromFlatRows(flattenCategoryTaxonomy())
)

export function findCategoryNode(slug: string, categories: CategoryNode[] = FALLBACK_CATEGORIES): CategoryNode | null {
  const stack = [...categories]
  while (stack.length > 0) {
    const current = stack.shift()
    if (!current) continue
    if (current.slug === slug) return current
    stack.unshift(...(current.children || current.subcategories || []))
  }
  return null
}

export function normalizeCategoryTree(categories: CategoryNode[]): CategoryNode[] {
  return categories.map((category) => {
    const children = normalizeCategoryTree(category.children || category.subcategories || [])
    return {
      ...category,
      children,
      subcategories: children,
    }
  })
}
