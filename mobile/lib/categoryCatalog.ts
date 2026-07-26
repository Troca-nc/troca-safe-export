import { Ionicons } from '@expo/vector-icons'
import { buildCategoryTreeFromFlatRows, flattenCategoryTaxonomy } from '../shared-copy/categoryTaxonomy'
import { CATEGORY_ICONS } from '../shared-copy/category-icons'

const CATEGORY_ICON_MAP = CATEGORY_ICONS as Record<string, string>

export type MobileCategory = {
  id: number
  label: string
  slug: string
  icon: keyof typeof Ionicons.glyphMap
  children?: MobileCategory[]
}

function normalizeText(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function tablerToIonicon(iconName?: string | null): keyof typeof Ionicons.glyphMap | null {
  switch (iconName) {
    case 'IconCar':
    case 'IconCarSuv':
    case 'IconCaravan':
    case 'IconCarConvertible':
    case 'IconCarTurbine':
    case 'IconSteeringWheel':
    case 'IconGolfCart':
      return 'car-sport-outline'
    case 'IconTruck':
    case 'IconTruckDelivery':
    case 'IconTrailer':
      return 'bus-outline'
    case 'IconMotorbike':
      return 'bicycle-outline'
    case 'IconBike':
      return 'bicycle-outline'
    case 'IconScooter':
      return 'bicycle-outline'
    case 'IconSailboat':
      return 'boat-outline'
    case 'IconWaveSine':
    case 'IconScubaMask':
      return 'water-outline'
    case 'IconAnchor':
      return 'boat-outline'
    case 'IconFish':
      return 'fish-outline'
    case 'IconWind':
      return 'leaf-outline'
    case 'IconBuilding':
    case 'IconBuildingStore':
    case 'IconBuildingWarehouse':
    case 'IconBuildingSkyscraper':
    case 'IconBuildingCommunity':
      return 'business-outline'
    case 'IconHome':
      return 'home-outline'
    case 'IconKey':
      return 'key-outline'
    case 'IconBriefcase':
      return 'briefcase-outline'
    case 'IconHanger':
    case 'IconShirt':
    case 'IconDress':
    case 'IconJacket':
      return 'shirt-outline'
    case 'IconShoe':
      return 'walk-outline'
    case 'IconBag':
    case 'IconBackpack':
    case 'IconLuggage':
    case 'IconWallet':
      return 'bag-outline'
    case 'IconWatch':
      return 'time-outline'
    case 'IconDiamond':
      return 'diamond-outline'
    case 'IconArmchair':
    case 'IconBed':
      return 'bed-outline'
    case 'IconBulb':
      return 'bulb-outline'
    case 'IconHammer':
    case 'IconTool':
    case 'IconWrench':
    case 'IconWrenchBolt':
      return 'hammer-outline'
    case 'IconBolt':
      return 'flash-outline'
    case 'IconDroplets':
      return 'water-outline'
    case 'IconPlant':
    case 'IconLeaf':
    case 'IconTree':
      return 'leaf-outline'
    case 'IconPalette':
    case 'IconSparkles':
    case 'IconMoodSmile':
    case 'IconFlame':
      return 'sparkles-outline'
    case 'IconMusic':
    case 'IconGuitar':
    case 'IconGuitars':
    case 'IconMicrophone':
    case 'IconVinyl':
      return 'musical-notes-outline'
    case 'IconBook':
    case 'IconBooks':
    case 'IconNews':
      return 'book-outline'
    case 'IconPuzzle':
    case 'IconCards':
      return 'extension-puzzle-outline'
    case 'IconBallFootball':
    case 'IconBallTennis':
      return 'football-outline'
    case 'IconRun':
    case 'IconBarbell':
    case 'IconActivity':
      return 'fitness-outline'
    case 'IconTent':
      return 'triangle-outline'
    case 'IconCamera':
      return 'camera-outline'
    case 'IconHeadphones':
    case 'IconSpeakerphone':
    case 'IconVolume':
      return 'headset-outline'
    case 'IconWifi':
    case 'IconCpu':
      return 'phone-portrait-outline'
    case 'IconPaw':
    case 'IconDog':
    case 'IconCat':
      return 'paw-outline'
    case 'IconHeart':
      return 'heart-outline'
    case 'IconMapPin':
      return 'location-outline'
    case 'IconBone':
      return 'nutrition-outline'
    case 'IconStethoscope':
    case 'IconHeartRateMonitor':
      return 'medical-outline'
    case 'IconTools':
      return 'build-outline'
    case 'IconBuildingFactory':
    case 'IconBuildingFactory2':
      return 'business-outline'
    case 'IconStore':
      return 'storefront-outline'
    case 'IconPackage':
      return 'cube-outline'
    case 'IconUsers':
    case 'IconUser':
    case 'IconMan':
    case 'IconWoman':
      return 'people-outline'
    case 'IconBabyCarriage':
      return 'people-outline'
    case 'IconMoon':
      return 'moon-outline'
    case 'IconTarget':
    case 'IconSword':
      return 'at-outline'
    case 'IconPlane':
      return 'paper-plane-outline'
    case 'IconDots':
      return 'ellipsis-horizontal-outline'
    case 'IconBox':
      return 'cube-outline'
    case 'IconLink':
      return 'link-outline'
    case 'IconLayoutGrid':
      return 'grid-outline'
    case 'IconCircleDashed':
      return 'ellipse-outline'
    case 'IconArrowsUpDown':
      return 'swap-vertical-outline'
    case 'IconPipe':
      return 'construct-outline'
    case 'IconSquare':
      return 'square-outline'
    case 'IconTrailer':
      return 'bus-outline'
    case 'IconFileText':
      return 'document-text-outline'
    case 'IconPencil':
      return 'create-outline'
    case 'IconCup':
    case 'IconToolsKitchen':
    case 'IconToolsKitchen2':
      return 'restaurant-outline'
    case 'IconWashMachine':
      return 'water-outline'
    case 'IconBlender':
      return 'nutrition-outline'
    case 'IconTable':
      return 'tablet-landscape-outline'
    case 'IconBath':
      return 'water-outline'
    case 'IconDrill':
      return 'construct-outline'
    case 'IconHat':
    case 'IconEyeglasses':
    case 'IconUmbrella':
      return 'happy-outline'
    case 'IconHandFinger':
    case 'IconHandStop':
      return 'hand-left-outline'
    case 'IconCoin':
      return 'cash-outline'
    case 'IconSchool':
      return 'school-outline'
    default:
      return null
  }
}

function inferIconKey(name: string, slug: string, path: string[] = []): keyof typeof Ionicons.glyphMap {
  const explicit = tablerToIonicon(CATEGORY_ICON_MAP[slug])
  if (explicit) return explicit

  const text = normalizeText([name, slug, ...path].filter(Boolean).join(' '))

  if (/(citadines|berlines)/.test(text)) return 'car-sport-outline'
  if (/(suv|4x4)/.test(text)) return 'car-sport-outline'
  if (/(breaks|wagon)/.test(text)) return 'car-sport-outline'
  if (/(monospaces|vans|fourgons|utilitaires)/.test(text)) return 'bus-outline'
  if (/(cabriolets|convertibles)/.test(text)) return 'car-sport-outline'
  if (/(voitures de sport|sportives)/.test(text)) return 'car-sport-outline'
  if (/(voitures de collection|collection|voiturettes)/.test(text)) return 'car-sport-outline'
  if (/(moto|roadster|custom|trail|enduro|cross|scooter|quad)/.test(text)) return 'bicycle-outline'
  if (/(velo|vtc|vtt|vae|roller|skate|trottinette)/.test(text)) return 'bicycle-outline'

  if (/(appartement|colocation)/.test(text)) return 'home-outline'
  if (/(maison|villa)/.test(text)) return 'home-outline'
  if (/(terrain)/.test(text)) return 'locate-outline'
  if (/(parking)/.test(text)) return 'car-outline'
  if (/(bureau|commerce|entrepot|docks)/.test(text)) return 'business-outline'

  if (/(manteau|veste|blazer|tailleur|haut|t-shirt|chemise|pull|sweat|robe|jupe|pantalon|legging|short|combinaison|lingerie|pyjama|maillot de bain|vetement de sport)/.test(text)) {
    return 'shirt-outline'
  }
  if (/(chaussure|baskets|sandales|mocassins|bottes|tongs|claquettes|chaussons)/.test(text)) {
    return 'shirt-outline'
  }
  if (/(sac|pochette|porte-monnaie|portemonnaie|trousse|banane|bandouliere|sac a main|sac a dos|sac de voyage|sac de sport)/.test(text)) {
    return 'bag-outline'
  }
  if (/(beaute|bijou|montre|foulard|ceinture|chapeau|casquette|lunette|parfum|maquillage|accessoire cheveux)/.test(text)) {
    return 'sparkles-outline'
  }

  if (/(animaux|chien|chat|cheval|rongeur)/.test(text)) return 'paw-outline'
  if (/(services|depannage|demenagement|livraison|garde|administratif|cours particuliers)/.test(text)) return 'hand-left-outline'
  if (/(agriculture|jardin|plante|semence)/.test(text)) return 'leaf-outline'
  if (/(btp|construction|travaux|outillage|bricolage)/.test(text)) return 'hammer-outline'
  if (/(telecom|internet|media|electronique|multimedia|smartphone|telephone)/.test(text)) return 'phone-portrait-outline'
  if (/(collection|antiquit)/.test(text)) return 'gift-outline'
  if (/(loisirs|musique|lecture|jeux|sport|fitness|camping|creatif|modelisme|airsoft|tir)/.test(text)) return 'barbell-outline'
  if (/(banque|finance|assurance|prix|tarif|salaire)/.test(text)) return 'cash-outline'
  if (/(médical|medical|sante|santé|formation|stage)/.test(text)) return 'medical-outline'
  if (/(industrie|environnement)/.test(text)) return 'business-outline'
  if (/(bateau|voilier|nautique|marine|accastillage|mouillage)/.test(text)) return 'boat-outline'
  if (/(peche|plongee|windsurf|kite|sup|nautiques?)/.test(text)) return 'water-outline'

  return 'grid-outline'
}

function cloneWithIcons(nodes: any[], path: string[] = []): MobileCategory[] {
  return nodes.map((node) => {
    const currentPath = [...path, node.name]
    const children = cloneWithIcons(node.children || node.subcategories || [], currentPath)
    return {
      id: Number(node.id),
      label: node.name,
      slug: node.slug,
      icon: (node.icon as keyof typeof Ionicons.glyphMap) ?? inferIconKey(node.name, node.slug, currentPath),
      children,
    }
  })
}

export const MOBILE_FALLBACK_CATEGORIES: MobileCategory[] = cloneWithIcons(
  buildCategoryTreeFromFlatRows(flattenCategoryTaxonomy())
)
