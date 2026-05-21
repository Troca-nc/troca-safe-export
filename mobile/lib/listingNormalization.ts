export type MobileListing = {
  id: string;
  titre: string;
  title: string;
  prix_xpf: number | null;
  price: number | null;
  commune: string | null;
  commune_name: string | null;
  image_url: string | null;
  cover_image: string | null;
  is_boosted: boolean;
  boosted_until: string | null;
  created_at?: string;
  published_at?: string;
  is_pro: boolean;
  trust_score: number | null;
  trust_level: string | null;
  user: { is_pro?: boolean };
};

export function normalizeListing(item: any): MobileListing {
  return {
    id: String(item.id),
    titre: item.titre ?? item.title ?? '',
    title: item.title ?? item.titre ?? '',
    prix_xpf: item.prix_xpf ?? item.price ?? null,
    price: item.price ?? item.prix_xpf ?? null,
    commune: item.commune ?? item.commune_name ?? null,
    commune_name: item.commune_name ?? item.commune ?? null,
    image_url: item.image_url ?? item.cover_image ?? item.images?.[0]?.url ?? null,
    cover_image: item.cover_image ?? item.image_url ?? item.images?.[0]?.url ?? null,
    is_boosted: item.is_boosted ?? Boolean(item.boosted_until),
    boosted_until: item.boosted_until ?? null,
    created_at: item.created_at ?? item.published_at,
    published_at: item.published_at ?? item.created_at,
    is_pro: item.is_pro ?? item.user?.is_pro ?? false,
    trust_score: item.trust_score ?? item.seller_trust_score ?? null,
    trust_level: item.trust_level ?? item.seller_trust_level ?? null,
    user: item.user ?? { is_pro: item.is_pro ?? false },
  };
}
