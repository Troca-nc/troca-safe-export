'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import {
  Anchor,
  Archive,
  ArrowRight,
  Baby,
  Briefcase,
  Car,
  Gamepad2,
  HardHat,
  HeartHandshake,
  Home,
  Package,
  PawPrint,
  Shirt,
  Smartphone,
  Sofa,
  Wrench,
} from 'lucide-react'

import { CATEGORY_ICONS } from '@/constants/category-icons'
import { FALLBACK_CATEGORIES, type CategoryNode } from '@/lib/categoryCatalog'

type IconComponent = ComponentType<{ className?: string }>

const ICON_COMPONENTS: Record<string, IconComponent> = {
  car: Car,
  IconCar: Car,
  IconCarSuv: Car,
  IconCaravan: Car,
  IconCarConvertible: Car,
  IconCarTurbine: Car,
  IconSteeringWheel: Car,
  IconGolfCart: Car,
  ship: Anchor,
  IconSailboat: Anchor,
  IconWaveSine: Anchor,
  IconAnchor: Anchor,
  home: Home,
  IconBuilding: Home,
  IconHome: Home,
  apartment: Home,
  villa: Home,
  briefcase: Briefcase,
  IconBriefcase: Briefcase,
  shirt: Shirt,
  IconShirt: Shirt,
  IconHanger: Shirt,
  sofa: Sofa,
  IconArmchair: Sofa,
  IconBed: Sofa,
  hammer: Wrench,
  IconHammer: Wrench,
  IconTool: Wrench,
  IconDrill: Wrench,
  wrench: Wrench,
  users: Baby,
  IconBabyCarriage: Baby,
  smartphone: Smartphone,
  IconDeviceMobile: Smartphone,
  IconDeviceLaptop: Smartphone,
  IconDeviceDesktop: Smartphone,
  dumbbell: Gamepad2,
  IconDumbbell: Gamepad2,
  gift: Archive,
  IconDiamond: Archive,
  paw: PawPrint,
  IconPaw: PawPrint,
  handshake: HeartHandshake,
  IconHandshake: HeartHandshake,
  package: Package,
  IconBox: Package,
  layers: Package,
  IconDots: Package,
  IconLayoutGrid: Package,
  IconBuildingFactory2: HardHat,
  IconBuildingFactory: HardHat,
}

const ROOT_ICON_BY_SLUG: Record<string, IconComponent> = {
  vehicules: Car,
  nautisme: Anchor,
  immobilier: Home,
  emploi: Briefcase,
  mode: Shirt,
  'maison-jardin': Sofa,
  'bricolage-outillage': Wrench,
  'famille-puericulture': Baby,
  'electronique-multimedia': Smartphone,
  loisirs: Gamepad2,
  'collections-antiquites': Archive,
  animaux: PawPrint,
  services: HeartHandshake,
  'materiel-professionnel': HardHat,
  divers: Package,
}

function getCategoryChildren(category: CategoryNode) {
  return category.children || category.subcategories || []
}

function buildCategoryHref(categorySlug: string, subcategorySlug?: string) {
  const params = new URLSearchParams()
  params.set('categorie', categorySlug)
  if (subcategorySlug) params.set('sous_categorie', subcategorySlug)
  return `/annonces?${params.toString()}`
}

function resolveCategoryIcon(category: CategoryNode) {
  if (ROOT_ICON_BY_SLUG[category.slug]) return ROOT_ICON_BY_SLUG[category.slug]
  const iconKey = CATEGORY_ICONS[category.slug as keyof typeof CATEGORY_ICONS] || category.icon || ''
  return ICON_COMPONENTS[iconKey] || ICON_COMPONENTS[category.icon || ''] || Package
}

function CategorySubtree({
  rootSlug,
  nodes,
  depth = 0,
}: {
  rootSlug: string
  nodes: CategoryNode[]
  depth?: number
}) {
  if (!nodes.length) return null

  return (
    <ul className={depth === 0 ? 'mt-3 space-y-1' : 'mt-2 space-y-1 border-l border-[var(--color-border)] pl-3'}>
      {nodes.map((node) => {
        const children = getCategoryChildren(node)
        return (
          <li key={node.id} className="space-y-1">
            <Link
              href={buildCategoryHref(rootSlug, node.slug)}
              className={`block line-clamp-1 transition-colors hover:text-[#0A7EA4] ${
                depth === 0 ? 'text-sm font-medium text-night/70' : 'text-xs text-night/55'
              }`}
            >
              {node.name}
            </Link>
            {children.length > 0 ? <CategorySubtree rootSlug={rootSlug} nodes={children} depth={depth + 1} /> : null}
          </li>
        )
      })}
    </ul>
  )
}

export default function CategoryTreeSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">
            Tous les rayons
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">
            L&apos;arbre complet des catégories
          </h2>
        </div>
        <Link
          href="/annonces"
          className="hidden items-center gap-1 text-sm font-semibold text-coral hover:underline md:inline-flex"
        >
          Voir toutes les annonces <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {FALLBACK_CATEGORIES.map((cat) => {
          const Icon = resolveCategoryIcon(cat)
          const subcats = getCategoryChildren(cat)

          return (
            <article
              key={cat.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-shadow hover:shadow-md"
            >
              <Link href={buildCategoryHref(cat.slug)} className="mb-3 flex items-center gap-2 group">
                <Icon className="h-7 w-7 shrink-0 text-[#0A7EA4]" />
                <span className="font-semibold text-night transition-colors group-hover:text-coral text-sm">
                  {cat.name}
                </span>
              </Link>

              {subcats.length > 0 ? (
                <CategorySubtree rootSlug={cat.slug} nodes={subcats} />
              ) : null}
            </article>
          )
        })}
      </div>

      <div className="mt-4 text-center md:hidden">
        <Link href="/annonces" className="text-sm font-semibold text-coral hover:underline">
          Voir toutes les annonces <ArrowRight className="h-4 w-4 inline-block align-[-2px]" />
        </Link>
      </div>
    </section>
  )
}
