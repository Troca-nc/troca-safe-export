export type ListingImage = {
  id?: number | string;
  url?: string | null;
  thumbnail_url?: string | null;
};

export type ListingUser = {
  id: number;
  prenom: string;
  nom: string;
  avatar_url?: string | null;
  is_pro?: boolean;
  nb_annonces?: number | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  trust_score?: number | null;
  trust_level?: string | null;
  membre_depuis?: string | null;
  created_at?: string | null;
  commune_name?: string | null;
  province_name?: string | null;
};

export type SellerProfileSummary = {
  commune_name?: string | null;
  province_name?: string | null;
  total_vues?: number | null;
  active_listings_count?: number | null;
};

export type ListingDetail = {
  id: string;
  titre?: string;
  title?: string;
  description?: string | null;
  prix?: number | null;
  price?: number | null;
  price_negotiable?: boolean;
  is_free?: boolean;
  commune?: string | null;
  commune_name?: string | null;
  commune_id?: number | null;
  category_name?: string | null;
  category_id?: number | null;
  categorie?: string | null;
  created_at?: string;
  published_at?: string;
  status?: string;
  is_favorited?: boolean;
  images?: ListingImage[];
  user?: ListingUser;
};

export type RelatedListing = {
  id: number | string;
  titre?: string;
  title?: string;
  prix?: number | null;
  price?: number | null;
  commune_name?: string | null;
};

export type SellerReview = {
  id: number | string;
  note?: number | null;
  commentaire?: string | null;
};

export const money = (value: number | null | undefined) => {
  if (value == null) return 'Prix a debattre';
  return `${Number(value).toLocaleString('fr-NC')} XPF`;
};

export const getListingTitle = (listing?: Pick<ListingDetail, 'titre' | 'title'> | null) =>
  listing?.titre ?? listing?.title ?? 'Annonce';

export const getListingPrice = (listing?: Pick<ListingDetail, 'prix' | 'price'> | null) =>
  listing?.prix ?? listing?.price ?? null;

export const getListingLocation = (
  listing?: Pick<ListingDetail, 'commune_name' | 'commune'> | null,
  fallback = 'Nouvelle-Caledonie'
) => listing?.commune_name ?? listing?.commune ?? fallback;

export const getListingCategory = (
  listing?: Pick<ListingDetail, 'category_name' | 'categorie'> | null
) => listing?.category_name ?? listing?.categorie ?? null;

export const getSellerDisplayName = (user?: Pick<ListingUser, 'prenom' | 'nom'> | null) => {
  if (!user) return 'Vendeur';
  return `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || 'Vendeur';
};

export const getSellerInitials = (user?: Pick<ListingUser, 'prenom' | 'nom'> | null) => {
  const first = user?.prenom?.[0] ?? '?';
  const last = user?.nom?.[0] ?? '?';
  return `${first}${last}`.toUpperCase();
};
