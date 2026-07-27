// ⚠️ COPIE MANUELLE depuis /shared/category-icons.js
// Ce fichier doit être copié à nouveau si l'original est modifié.
// Ne pas éditer ce fichier séparément de l'original sans reporter le changement des deux côtés.
'use strict'

const { TAXONOMY_TREE, slugifyCategoryName } = require('./categoryTaxonomy')

function normalizeText(...parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function inferCategoryIconName(name, slug, path = []) {
  const text = normalizeText(name, slug, ...path)

  if (/^(vehicules?|voitures?|citadines?|berlines?|breaks?|monospaces?|vans?|cabriolets?|sportives?|collection|voiturettes?)$/.test(text)) return 'IconCar'
  if (/(suv|4x4)/.test(text)) return 'IconCarSuv'
  if (/(monospaces|vans|fourgons)/.test(text)) return 'IconCaravan'
  if (/(cabriolets|convertibles)/.test(text)) return 'IconCarConvertible'
  if (/(voitures de sport|sportives)/.test(text)) return 'IconCarTurbine'
  if (/(voitures de collection|collection)/.test(text)) return 'IconSteeringWheel'
  if (/(voiturettes)/.test(text)) return 'IconGolfCart'

  if (/(utilitaires|poids lourds|engins|remorques)/.test(text)) return 'IconTruck'
  if (/(fourgons|logistique|transport)/.test(text)) return 'IconTruckDelivery'

  if (/(motos|scooters|quad|roadsters|custom|trails|enduro|cross|125cc)/.test(text)) return 'IconMotorbike'
  if (/(velos|trottinettes|vtc|vtt|vae|roller|skate)/.test(text)) return 'IconBike'
  if (/(3 roues)/.test(text)) return 'IconCarSuv'
  if (/(equipement deux roues|equipement motard|casques)/.test(text)) return 'IconHelmet'
  if (/(pieces moto|pieces scooter|pieces velo|pieces trottinette)/.test(text)) return 'IconTool'
  if (/(pieces auto|pieces|frein|jantes|pneus|suspensions|echappement|carrosseries|parechocs|eclairages|vitres|electronique auto|attelages|barres|tuning|sonorisation|epaves|entretien)/.test(text)) {
    if (/(moteurs|engine)/.test(text)) return 'IconEngine'
    if (/(habitacle)/.test(text)) return 'IconArmchair'
    if (/(suspensions)/.test(text)) return 'IconArrowsUpDown'
    if (/(echappement)/.test(text)) return 'IconPipe'
    if (/(eclairages)/.test(text)) return 'IconBulb'
    if (/(vitres|hayons)/.test(text)) return 'IconSquare'
    if (/(electronique auto)/.test(text)) return 'IconCpu'
    if (/(attelages)/.test(text)) return 'IconLink'
    if (/(barres)/.test(text)) return 'IconLayoutGrid'
    if (/(tuning)/.test(text)) return 'IconWrenchBolt'
    if (/(sonorisation)/.test(text)) return 'IconSpeakerphone'
    if (/(epaves)/.test(text)) return 'IconCar'
    if (/(entretien)/.test(text)) return 'IconDroplets'
    if (/(frein|jantes|pneus)/.test(text)) return 'IconCircleDashed'
    if (/(moteurs)/.test(text)) return 'IconEngine'
    return 'IconTool'
  }

  if (/(nautisme|bateaux|voiliers|multicoques|bateaux moteur|annexes)/.test(text)) return 'IconSailboat'
  if (/(sports nautiques|motos marines)/.test(text)) return 'IconWaveSine'
  if (/(kite|windsurf|sup)/.test(text)) return 'IconWind'
  if (/(peche)/.test(text)) return 'IconFish'
  if (/(plongee)/.test(text)) return 'IconScubaMask'
  if (/(motorisation)/.test(text)) return 'IconEngine'
  if (/(accastillage|mouillage)/.test(text)) return 'IconAnchor'
  if (/(gilets)/.test(text)) return 'IconLifebuoy'
  if (/(remorques nautisme)/.test(text)) return 'IconTrailer'
  if (/(equipement divers nautisme)/.test(text)) return 'IconPackage'

  if (/(immobilier|vente|location|appartements|maisons|terrains|docks|entrepots|bureaux|commerces|parkings|colocations)/.test(text)) {
    if (/(immobilier)/.test(text)) return 'IconBuilding'
    if (/(vente)/.test(text)) return 'IconBuildingStore'
    if (/(location)/.test(text)) return 'IconKey'
    if (/(appartements)/.test(text)) return 'IconBuildingSkyscraper'
    if (/(maisons|villas)/.test(text)) return 'IconHome'
    if (/(terrains)/.test(text)) return 'IconMap'
    if (/(docks|entrepots)/.test(text)) return 'IconBuildingWarehouse'
    if (/(bureaux|commerces)/.test(text)) return 'IconBuildingStore'
    if (/(parkings)/.test(text)) return 'IconParking'
    if (/(colocations)/.test(text)) return 'IconUsers'
  }

  if (/(emploi|offres d'emploi|formations professionnelles)/.test(text)) {
    if (/(emploi)/.test(text)) return 'IconBriefcase'
    if (/(agriculture)/.test(text)) return 'IconPlant'
    if (/(automobile)/.test(text)) return 'IconCar'
    if (/(btp|construction)/.test(text)) return 'IconBuildingFactory'
    if (/(commerce|distribution)/.test(text)) return 'IconShoppingCart'
    if (/(banque|assurance|finance)/.test(text)) return 'IconCoin'
    if (/(industrie|environnement)/.test(text)) return 'IconLeaf'
    if (/(immobilier)/.test(text)) return 'IconBuilding'
    if (/(services publics|administrations)/.test(text)) return 'IconBuildingCommunity'
    if (/(sante)/.test(text)) return 'IconStethoscope'
    if (/(services)/.test(text)) return 'IconBriefcase'
    if (/(telecom|internet|medias)/.test(text)) return 'IconDeviceMobile'
    if (/(transport|logistique)/.test(text)) return 'IconTruckDelivery'
    if (/(restaurant|hotellerie|tourisme)/.test(text)) return 'IconToolsKitchen2'
    if (/(textile|mode|luxe)/.test(text)) return 'IconHanger'
    if (/(sport)/.test(text)) return 'IconBallFootball'
    if (/(service a la personne)/.test(text)) return 'IconHeart'
    if (/(appoint)/.test(text)) return 'IconClock'
    if (/(jobs etudiants)/.test(text)) return 'IconSchool'
    if (/(stage|benevolat)/.test(text)) return 'IconHandStop'
    if (/(formations professionnelles)/.test(text)) return 'IconSchool'
    return 'IconBriefcase'
  }

  if (/(mode|vetements|chaussures|sacs|accessoires|beaute|bijoux|foulards|ceintures|chapeaux|casquettes|lunettes|montres|parfums|maquillage)/.test(text)) {
    if (/(chaussures|baskets|sandales|mocassins|bottes|claquettes|tongs|chaussons)/.test(text)) return 'IconShoe'
    if (/(sacs|pochettes|porte-monnaie|portemonnaie|trousses|banane|bandouliere)/.test(text)) return 'IconBag'
    if (/(dos)/.test(text)) return 'IconBackpack'
    if (/(voyage)/.test(text)) return 'IconLuggage'
    if (/(porte-monnaie)/.test(text)) return 'IconWallet'
    if (/(foulards|ceintures|chapeaux|casquettes|lunettes|montres)/.test(text)) return 'IconWatch'
    if (/(bijoux)/.test(text)) return 'IconDiamond'
    if (/(parfums|maquillage|beaute)/.test(text)) return 'IconSparkles'
    if (/(mains|corps|visage|cheveux)/.test(text)) return 'IconMoodSmile'
    if (/(maternite|bebe)/.test(text)) return 'IconBabyCarriage'
    if (/(femmes|hommes|enfants|ados)/.test(text)) return 'IconUser'
    return 'IconHanger'
  }

  if (/(maison|jardin|mobilier|electromenager|decoration|linge|jardin|plantes|divers maison)/.test(text)) {
    if (/(maison|jardin)/.test(text) && !/(mobilier|electromenager|decoration|linge|divers maison)/.test(text)) return 'IconHome'
    if (/(mobilier)/.test(text)) return 'IconArmchair'
    if (/(tables)/.test(text)) return 'IconTable'
    if (/(lits|matelas)/.test(text)) return 'IconBed'
    if (/(meubles tv)/.test(text)) return 'IconDeviceTv'
    if (/(meubles cuisine|arts de la table)/.test(text)) return 'IconToolsKitchen2'
    if (/(meubles salle de bains)/.test(text)) return 'IconBath'
    if (/(mobilier exterieur)/.test(text)) return 'IconTree'
    if (/(luminaires)/.test(text)) return 'IconBulb'
    if (/(electromenager)/.test(text)) return 'IconWashMachine'
    if (/(petit electromenager)/.test(text)) return 'IconBlender'
    if (/(decoration)/.test(text)) return 'IconPalette'
    if (/(linge|textiles)/.test(text)) return 'IconHanger'
    if (/(bbq|plancha)/.test(text)) return 'IconFlame'
    if (/(piscine)/.test(text)) return 'IconSwimming'
    if (/(outils)/.test(text)) return 'IconPlant'
    if (/(plantes)/.test(text)) return 'IconLeaf'
    if (/(divers maison)/.test(text)) return 'IconBox'
    if (/(papeterie)/.test(text)) return 'IconPencil'
    if (/(vaisselle)/.test(text)) return 'IconToolsKitchen'
    return 'IconHome'
  }

  if (/(bricolage|outillage|electricite|plomberie|peinture|menuiserie|maconnerie|isolation|quincaillerie|outillage electroportatif|outillage a main|echelles|rangement atelier|securite epi|divers bricolage)/.test(text)) {
    if (/(electricite|quincaillerie)/.test(text)) return 'IconBolt'
    if (/(plomberie)/.test(text)) return 'IconDroplets'
    if (/(peinture)/.test(text)) return 'IconPalette'
    if (/(menuiserie)/.test(text)) return 'IconTrees'
    if (/(maconnerie)/.test(text)) return 'IconLayoutGrid'
    if (/(isolation)/.test(text)) return 'IconSquare'
    if (/(outillage electroportatif)/.test(text)) return 'IconDrill'
    if (/(outillage a main)/.test(text)) return 'IconHammer'
    if (/(echelles)/.test(text)) return 'IconArrowsUpDown'
    if (/(rangement atelier)/.test(text)) return 'IconBox'
    if (/(securite epi)/.test(text)) return 'IconHelmet'
    if (/(divers bricolage)/.test(text)) return 'IconTool'
    return 'IconHammer'
  }

  if (/(famille|puericulture|bebe|enfant|ados|poussette|mobilier enfant|matelas|doudous|jeux)/.test(text)) {
    if (/(poussette|landeau|siege auto|accessoires bebe)/.test(text)) return 'IconBabyCarriage'
    if (/(mobilier enfant|matelas)/.test(text)) return 'IconBed'
    if (/(jeux)/.test(text)) return 'IconPuzzle'
    if (/(doudous|peluches)/.test(text)) return 'IconHeart'
    return 'IconBabyCarriage'
  }

  if (/(electronique|multimedia|informatique|telephonie|montres|objets connectes|image|son|jeux video)/.test(text)) {
    if (/(informatique|ordinateurs|tablettes|liseuses|accessoires informatique)/.test(text)) return 'IconDeviceLaptop'
    if (/(telephonie|telephones|accessoires telephone)/.test(text)) return 'IconDeviceMobile'
    if (/(montres|objets connectes)/.test(text)) return 'IconWatch'
    if (/(image|tv|videoprojecteurs)/.test(text)) return 'IconDeviceTv'
    if (/(photo|video)/.test(text)) return 'IconCamera'
    if (/(enceintes|son|audio|casques|ecouteurs)/.test(text)) return 'IconHeadphones'
    if (/(jeux video|consoles)/.test(text)) return 'IconDeviceGamepad2'
    return 'IconDeviceLaptop'
  }

  if (/(loisirs|pour enfants|sport|musique|lecture|jeux de societe|loisirs creatifs|modelisme|airsoft|tir)/.test(text)) {
    if (/(pour enfants|jouets|jeux|ateliers creatifs)/.test(text)) return 'IconPuzzle'
    if (/(musique|instruments|cd|vinyles)/.test(text)) return 'IconMusic'
    if (/(lecture|livres|revues|bd)/.test(text)) return 'IconBook'
    if (/(sports nautiques|aquatiques)/.test(text)) return 'IconSwimming'
    if (/(raquette)/.test(text)) return 'IconBallTennis'
    if (/(collectifs)/.test(text)) return 'IconBallFootball'
    if (/(combat|arts martiaux)/.test(text)) return 'IconSword'
    if (/(fitness|musculation)/.test(text)) return 'IconBarbell'
    if (/(camping)/.test(text)) return 'IconTent'
    if (/(mecaniques)/.test(text)) return 'IconMotorbike'
    if (/(jeux de societe)/.test(text)) return 'IconCards'
    if (/(loisirs creatifs)/.test(text)) return 'IconPalette'
    if (/(modelisme)/.test(text)) return 'IconPlane'
    if (/(airsoft|tir)/.test(text)) return 'IconTarget'
    return 'IconDumbbell'
  }

  if (/(collections|antiquites)/.test(text)) return 'IconDiamond'

  if (/(animaux|chiens|chats|chevaux|rongeurs|adoption|perdus|trouves|alimentation|reproduction)/.test(text)) {
    if (/(chiens|chien)/.test(text)) return 'IconDog'
    if (/(chats|chat)/.test(text)) return 'IconCat'
    if (/(chevaux|cheval)/.test(text)) return 'IconHorse'
    if (/(perdus|trouves)/.test(text)) return 'IconMapPin'
    if (/(alimentation|accessoires)/.test(text)) return 'IconBone'
    if (/(adoption|sauvetage|reproduction|saillies)/.test(text)) return 'IconHeart'
    return 'IconPaw'
  }

  if (/(services|travaux|depannages|demenagement|livraison|services a la personne|garde|soins|sports|sante|mode|beaute|bien-etre|administratif|cours particuliers)/.test(text)) {
    if (/(demenagement|livraison)/.test(text)) return 'IconTruckDelivery'
    if (/(garde d'enfants)/.test(text)) return 'IconBabyCarriage'
    if (/(soins a la personne|sante|sports sante)/.test(text)) return 'IconStethoscope'
    if (/(mode|beaute|bien-etre)/.test(text)) return 'IconSparkles'
    if (/(administratif|cours particuliers)/.test(text)) return 'IconFileText'
    return 'IconTools'
  }

  if (/(materiel professionnel|agriculture|btp|restauration|commerce|bureaux|medical)/.test(text)) {
    if (/(agriculture)/.test(text)) return 'IconPlant'
    if (/(btp)/.test(text)) return 'IconBuildingFactory'
    if (/(restauration|commerce)/.test(text)) return 'IconToolsKitchen2'
    if (/(bureaux)/.test(text)) return 'IconBuilding'
    if (/(medical)/.test(text)) return 'IconStethoscope'
    return 'IconBuildingFactory2'
  }

  if (/(divers)/.test(text)) return 'IconDots'

  return 'IconDots'
}

function buildCategoryIcons(nodes, path = [], output = {}) {
  for (const node of nodes || []) {
    const currentPath = [...path, node.name]
    const slug = slugifyCategoryName(node.name)
    output[slug] = inferCategoryIconName(node.name, slug, currentPath)
    if (Array.isArray(node.children) && node.children.length > 0) {
      buildCategoryIcons(node.children, currentPath, output)
    }
  }
  return output
}

const CATEGORY_ICONS = buildCategoryIcons(TAXONOMY_TREE)

module.exports = {
  CATEGORY_ICONS,
  inferCategoryIconName,
}
