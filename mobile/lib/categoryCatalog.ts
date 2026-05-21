import { Ionicons } from '@expo/vector-icons';

export type MobileCategory = {
  id: number;
  label: string;
  slug: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const MOBILE_FALLBACK_CATEGORIES: MobileCategory[] = [
  { id: 1, label: 'Emploi', slug: 'emploi', icon: 'briefcase-outline' },
  { id: 2, label: 'Véhicules', slug: 'vehicules', icon: 'car-sport-outline' },
  { id: 3, label: 'Immobilier', slug: 'immobilier', icon: 'home-outline' },
  { id: 4, label: 'Location vacances', slug: 'location-vacances', icon: 'map-outline' },
  { id: 5, label: 'Électronique', slug: 'electronique', icon: 'phone-portrait-outline' },
  { id: 6, label: 'Maison & jardin', slug: 'maison-jardin', icon: 'leaf-outline' },
  { id: 7, label: 'Famille', slug: 'famille', icon: 'people-outline' },
  { id: 8, label: 'Mode', slug: 'mode', icon: 'shirt-outline' },
  { id: 9, label: 'Loisirs', slug: 'loisirs', icon: 'tennisball-outline' },
  { id: 10, label: 'Animaux', slug: 'animaux', icon: 'paw-outline' },
  { id: 11, label: 'Matériel pro', slug: 'materiel-professionnel', icon: 'construct-outline' },
  { id: 12, label: 'Services', slug: 'services', icon: 'hammer-outline' },
  { id: 13, label: 'Troc', slug: 'troc', icon: 'hand-right-outline' },
  { id: 14, label: 'Divers', slug: 'divers', icon: 'layers-outline' },
];
