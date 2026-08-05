import type { ComponentType } from 'react'
import {
  Baby,
  Banknote,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Car,
  CarFront,
  Anchor,
  Cat,
  Archive,
  Dog,
  Dumbbell,
  Factory,
  FileText,
  Flower2,
  Gamepad2,
  Gift,
  Hammer,
  Handshake,
  HeartHandshake,
  Headphones,
  HardHat,
  Home,
  Laptop,
  Layers3,
  MapPin,
  Music2,
  Package,
  PawPrint,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Ship,
  Stethoscope,
  Store,
  Target,
  ShoppingBag,
  Truck,
  Tv2,
  UsersRound,
  Waves,
  Wrench,
} from 'lucide-react'

import type { CategoryNode } from '@/lib/categoryCatalog'
import { CATEGORY_ICONS } from '@/shared-copy/category-icons'

export type CategoryVisual = {
  icon: ComponentType<{ className?: string }>
  label: string
}

const ICONS_BY_KEY: Record<string, ComponentType<{ className?: string }>> = {
  car: CarFront,
  sedan: CarFront,
  suv: CarFront,
  wagon: CarFront,
  convertible: CarFront,
  'sports-car': CarFront,
  'vintage-car': CarFront,
  'mini-car': CarFront,
  truck: Truck,
  van: Truck,
  motorcycle: Bike,
  scooter: Bike,
  bike: Bike,
  ship: Ship,
  waves: Waves,
  home: Home,
  apartment: Home,
  villa: Home,
  land: MapPin,
  parking: CarFront,
  building: Building2,
  office: Building2,
  briefcase: Briefcase,
  shirt: Shirt,
  dress: Shirt,
  jacket: Shirt,
  pants: Shirt,
  swimwear: Shirt,
  shoe: ShoppingBag,
  bag: ShoppingBag,
  'shopping-bag': ShoppingBag,
  sparkles: Sparkles,
  beauty: Sparkles,
  accessory: Sparkles,
  jewelry: Sparkles,
  sofa: Sofa,
  hammer: Hammer,
  wrench: Wrench,
  users: UsersRound,
  baby: Baby,
  smartphone: Smartphone,
  laptop: Laptop,
  tv: Tv2,
  headphones: Headphones,
  gamepad: Gamepad2,
  gift: Gift,
  paw: PawPrint,
  dog: Dog,
  cat: Cat,
  handshake: Handshake,
  layers: Layers3,
  camera: Camera,
  book: BookOpen,
  dumbbell: Dumbbell,
  flower: Flower2,
  factory: Factory,
  store: Store,
  stethoscope: Stethoscope,
  package: Package,
  calendar: CalendarDays,
  music: Music2,
  banknote: Banknote,
  target: Target,
  'file-text': FileText,
}

const TABLER_ICON_TO_LEGACY_KEY: Record<string, string> = {
  IconCar: 'car',
  IconCarSuv: 'car',
  IconCaravan: 'truck',
  IconCarConvertible: 'car',
  IconCarTurbine: 'car',
  IconSteeringWheel: 'car',
  IconGolfCart: 'car',
  IconTruck: 'truck',
  IconTruckDelivery: 'truck',
  IconMotorbike: 'bike',
  IconBike: 'bike',
  IconScooter: 'bike',
  IconHelmet: 'bike',
  IconSailboat: 'ship',
  IconWaveSine: 'waves',
  IconAnchor: 'ship',
  IconLifebuoy: 'ship',
  IconFish: 'waves',
  IconScubaMask: 'waves',
  IconWind: 'waves',
  IconBuilding: 'building',
  IconBuildingStore: 'store',
  IconBuildingWarehouse: 'building',
  IconBuildingSkyscraper: 'building',
  IconBuildingCommunity: 'users',
  IconParking: 'car',
  IconKey: 'briefcase',
  IconBriefcase: 'briefcase',
  IconHanger: 'shirt',
  IconShirt: 'shirt',
  IconDress: 'shirt',
  IconJacket: 'shirt',
  IconShoe: 'shoe',
  IconBag: 'bag',
  IconBackpack: 'bag',
  IconLuggage: 'bag',
  IconWallet: 'bag',
  IconWatch: 'target',
  IconDiamond: 'gift',
  IconArmchair: 'sofa',
  IconBed: 'sofa',
  IconBulb: 'sparkles',
  IconPlant: 'flower',
  IconLeaf: 'flower',
  IconTree: 'flower',
  IconPalette: 'sparkles',
  IconMusic: 'music',
  IconBooks: 'book',
  IconNews: 'book',
  IconPuzzle: 'gamepad',
  IconCards: 'gamepad',
  IconBallFootball: 'dumbbell',
  IconBallTennis: 'dumbbell',
  IconRun: 'dumbbell',
  IconSwimming: 'waves',
  IconDeviceLaptop: 'laptop',
  IconDeviceDesktop: 'laptop',
  IconDeviceMobile: 'smartphone',
  IconDeviceTablet: 'smartphone',
  IconDeviceTv: 'tv',
  IconDeviceGamepad: 'gamepad',
  IconDeviceGamepad2: 'gamepad',
  IconSpeakerphone: 'headphones',
  IconVolume: 'headphones',
  IconWifi: 'smartphone',
  IconCpu: 'smartphone',
  IconEngine: 'wrench',
  IconPaw: 'paw',
  IconBone: 'paw',
  IconHeart: 'users',
  IconMapPin: 'layers',
  IconStethoscope: 'stethoscope',
  IconHeartRateMonitor: 'stethoscope',
  IconBuildingFactory: 'factory',
  IconBuildingFactory2: 'factory',
  IconStore: 'store',
  IconUsers: 'users',
  IconUser: 'users',
  IconMan: 'users',
  IconWoman: 'users',
  IconBabyCarriage: 'baby',
  IconMoodSmile: 'sparkles',
  IconFlame: 'sparkles',
  IconMoon: 'sparkles',
  IconGuitar: 'music',
  IconGuitars: 'music',
  IconMicrophone: 'music',
  IconVinyl: 'music',
  IconTarget: 'target',
  IconSword: 'target',
  IconBarbell: 'dumbbell',
  IconTent: 'dumbbell',
  IconActivity: 'dumbbell',
  IconPlane: 'layers',
  IconDots: 'layers',
  IconBox: 'package',
  IconLink: 'package',
  IconLayoutGrid: 'layers',
  IconCircleDashed: 'layers',
  IconArrowsUpDown: 'layers',
  IconPipe: 'wrench',
  IconSquare: 'layers',
  IconWrenchBolt: 'wrench',
  IconTrailer: 'truck',
  IconMap: 'land',
  IconFileText: 'file-text',
  IconPencil: 'file-text',
  IconCup: 'sofa',
  IconToolsKitchen: 'sofa',
  IconToolsKitchen2: 'sofa',
  IconWashMachine: 'home',
  IconBlender: 'home',
  IconTable: 'sofa',
  IconBath: 'home',
  IconDrill: 'wrench',
  IconHat: 'sparkles',
  IconEyeglasses: 'sparkles',
  IconUmbrella: 'sparkles',
  IconHandFinger: 'users',
  IconHandStop: 'users',
  IconCoin: 'banknote',
  IconSchool: 'briefcase',
  IconClock: 'briefcase',
}

function resolveLegacyIconKey(iconKey?: string | null) {
  if (!iconKey) return null
  if (ICONS_BY_KEY[iconKey]) return iconKey
  if (TABLER_ICON_TO_LEGACY_KEY[iconKey]) return TABLER_ICON_TO_LEGACY_KEY[iconKey]
  return null
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  vehicules: { icon: Car, label: 'VÃ©hicules' },
  nautisme: { icon: Anchor, label: 'Nautisme' },
  immobilier: { icon: Home, label: 'Immobilier' },
  emploi: { icon: Briefcase, label: 'Emploi' },
  mode: { icon: Shirt, label: 'Mode' },
  'maison-jardin': { icon: Sofa, label: 'Maison & Jardin' },
  'bricolage-outillage': { icon: Wrench, label: 'Bricolage & Outillage' },
  'famille-puericulture': { icon: Baby, label: 'Famille & Puï¿½riculture' },
  'electronique-multimedia': { icon: Smartphone, label: 'ï¿½lectronique & Multimï¿½dia' },
  loisirs: { icon: Gamepad2, label: 'Loisirs' },
  'collections-antiquites': { icon: Archive, label: 'Collections & Antiquitï¿½s' },
  animaux: { icon: PawPrint, label: 'Animaux' },
  services: { icon: HeartHandshake, label: 'Services' },
  'materiel-professionnel': { icon: HardHat, label: 'Matï¿½riel professionnel' },
  divers: { icon: Package, label: 'Divers' },
  // legacy aliases kept for backward compatibility
  location_courte_duree: { icon: Home, label: 'Locations courte durï¿½e' },
  don: { icon: Gift, label: 'Dons' },
  'location-vacances': { icon: MapPin, label: 'Location vacances' },
  electronique: { icon: Smartphone, label: 'ï¿½lectronique' },
  famille: { icon: UsersRound, label: 'Famille' },
  troc: { icon: Handshake, label: 'Troc' },
  mobilier: { icon: Sofa, label: 'Maison & Jardin' },
  'sports-loisirs': { icon: Dumbbell, label: 'Loisirs' },
  vetements: { icon: Shirt, label: 'Mode' },
  autres: { icon: Package, label: 'Divers' },
}
function normalizeText(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function resolveIconKey(slug: string, label?: string, iconKey?: string) {
  const fromSlug = CATEGORY_ICONS[slug]
  const fromSlugLegacy = resolveLegacyIconKey(fromSlug)
  if (fromSlugLegacy) return fromSlugLegacy

  const key = String(iconKey || '').trim()
  const legacy = resolveLegacyIconKey(key)
  if (legacy) return legacy

  const text = normalizeText([slug, label].filter(Boolean).join(' '))

  if (/(citadines|berlines)/.test(text)) return 'sedan'
  if (/(suv|4x4)/.test(text)) return 'suv'
  if (/(breaks|wagon)/.test(text)) return 'wagon'
  if (/(monospaces|vans|fourgons|utilitaires)/.test(text)) return 'van'
  if (/(cabriolets|convertibles)/.test(text)) return 'convertible'
  if (/(voitures de sport|sportives)/.test(text)) return 'sports-car'
  if (/(voitures de collection|collection)/.test(text)) return 'vintage-car'
  if (/(voiturettes)/.test(text)) return 'mini-car'
  if (/(moto|roadster|custom|trail|enduro|cross|scooters|quad)/.test(text)) return 'motorcycle'
  if (/(125cc|trottinette|scooter)/.test(text)) return 'scooter'
  if (/(velo|vtc|vtt|vae|roller|skate)/.test(text)) return 'bike'

  if (/(appartement|colocation)/.test(text)) return 'apartment'
  if (/(maison|villa)/.test(text)) return 'villa'
  if (/(terrain)/.test(text)) return 'land'
  if (/(parking)/.test(text)) return 'parking'
  if (/(bureau|commerce|entrepot|docks)/.test(text)) return 'office'

  if (/(manteau|veste|blazer|tailleur|haut|t-shirt|chemise|pull|sweat|robe|jupe|pantalon|legging|short|combinaison|lingerie|pyjama|maillot de bain|vetement de sport)/.test(text)) {
    return 'shirt'
  }
  if (/(chaussure|baskets|sandales|mocassins|bottes|tongs|claquettes|chaussons)/.test(text)) {
    return 'shoe'
  }
  if (/(sac|pochette|porte-monnaie|portemonnaie|trousse|banane|bandouliere|sac a main|sac a dos|sac de voyage|sac de sport)/.test(text)) {
    return 'bag'
  }
  if (/(beaute|bijou|montre|foulard|ceinture|chapeau|casquette|lunette|parfum|maquillage|accessoire cheveux)/.test(text)) {
    return 'beauty'
  }

  if (/(animaux|chien|chat|cheval|rongeur)/.test(text)) return 'paw'
  if (/(services|depannage|demenagement|livraison|garde|administratif|cours particuliers)/.test(text)) return 'handshake'
  if (/(agriculture|jardin|plante|semence)/.test(text)) return 'flower'
  if (/(btp|construction|travaux|outillage|bricolage)/.test(text)) return 'hammer'
  if (/(telecom|internet|media|electronique|multimedia|smartphone|telephone)/.test(text)) return 'smartphone'
  if (/(collection|antiquit)/.test(text)) return 'gift'
  if (/(loisirs|musique|lecture|jeux|sport|fitness|camping|creatif|modelisme|airsoft|tir)/.test(text)) return 'dumbbell'
  if (/(banque|finance|assurance|prix|tarif|salaire)/.test(text)) return 'banknote'
  if (/(mï¿½dical|medical|sante|santï¿½|formation|stage)/.test(text)) return 'stethoscope'
  if (/(industrie|environnement)/.test(text)) return 'factory'

  return CATEGORY_VISUALS[slug]?.icon ? slug : 'layers'
}

export const FEATURED_SEARCHES = [
  { label: 'Emploi', slug: 'emploi' },
  { label: 'VÃ©hicules', slug: 'vehicules' },
  { label: 'Immobilier', slug: 'immobilier' },
  { label: 'Nautisme', slug: 'nautisme' },
  { label: 'Services', slug: 'services' },
  { label: 'Mode', slug: 'mode' },
  { label: 'Maison & Jardin', slug: 'maison-jardin' },
  { label: 'Bricolage & Outillage', slug: 'bricolage-outillage' },
  { label: 'Famille & Puï¿½riculture', slug: 'famille-puericulture' },
  { label: 'ï¿½lectronique & Multimï¿½dia', slug: 'electronique-multimedia' },
  { label: 'Loisirs', slug: 'loisirs' },
  { label: 'Collections & Antiquitï¿½s', slug: 'collections-antiquites' },
  { label: 'Animaux', slug: 'animaux' },
  { label: 'Matï¿½riel professionnel', slug: 'materiel-professionnel' },
  { label: 'Divers', slug: 'divers' },
]

export const SEARCH_ALERTS = ['iPhone 15', 'Toyota Hilux', 'Studio Nouméa', 'Canapé', 'PS5', 'Chiot']

export const FEATURED_CATEGORY_ORDER = [
  'emploi',
  'vehicules',
  'nautisme',
  'immobilier',
  'mode',
  'maison-jardin',
  'bricolage-outillage',
  'famille-puericulture',
  'electronique-multimedia',
  'loisirs',
  'collections-antiquites',
  'animaux',
  'services',
  'materiel-professionnel',
  'divers',
]

export function getCategoryIcon(slug: string, label?: string, iconKey?: string) {
  const resolvedIconKey = resolveIconKey(slug, label, iconKey)
  return ICONS_BY_KEY[resolvedIconKey] ?? CATEGORY_VISUALS[slug]?.icon ?? Layers3
}

export function mergeCategories(fallback: CategoryNode[], remote: CategoryNode[]) {
  const merged = new Map<string, CategoryNode>()
  ;[...fallback, ...remote].forEach((cat) => {
    const current = merged.get(cat.slug)
    if (!current) {
      merged.set(cat.slug, cat)
      return
    }

    const currentChildren = current.children || current.subcategories || []
    const nextChildren = cat.children || cat.subcategories || []
    if (currentChildren.length === 0 && nextChildren.length) {
      merged.set(cat.slug, { ...current, children: nextChildren, subcategories: nextChildren })
    }
  })

  return Array.from(merged.values()).map((item) => ({
    ...item,
    children: item.children || item.subcategories || [],
    subcategories: item.subcategories || item.children || [],
  }))
}

export function getFeaturedCategories(categories: CategoryNode[]) {
  const bySlug = new Map(categories.map((cat) => [cat.slug, cat]))
  return FEATURED_CATEGORY_ORDER.map((slug) => bySlug.get(slug)).filter(Boolean) as CategoryNode[]
}
