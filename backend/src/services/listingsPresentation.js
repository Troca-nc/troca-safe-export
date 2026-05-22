const { buildUploadPublicUrl, normalizeImageVariants } = require('./imageService')

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

function toBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function mapListingSearchRow(row) {
  const coverImage = row.cover_image_thumbnail ?? row.cover_image ?? null
  return {
    id: row.id,
    titre: row.titre ?? row.title ?? '',
    title: row.title ?? row.titre ?? '',
    prix: row.prix ?? row.price ?? null,
    price: row.price ?? row.prix ?? null,
    condition: row.condition ?? null,
    price_negotiable: toBoolean(row.price_negotiable),
    is_free: toBoolean(row.is_free),
    contre_quoi: row.contre_quoi ?? null,
    published_at: row.published_at ?? row.created_at ?? null,
    nb_vues: toNumber(row.nb_vues, 0),
    boosted_until: row.boosted_until ?? null,
    distance_km: toNumber(row.distance_km, null),
    commune_id: row.commune_id ?? null,
    category_id: row.category_id ?? null,
    category_name: row.category_name ?? null,
    category_slug: row.category_slug ?? null,
    category_icon: row.category_icon ?? null,
    commune_name: row.commune_name ?? null,
    seller_id: row.seller_id ?? null,
    seller_prenom: row.seller_prenom ?? null,
    seller_nom: row.seller_nom ?? null,
    is_pro: toBoolean(row.is_pro),
    seller_email_verified: toBoolean(row.seller_email_verified),
    seller_phone_verified: toBoolean(row.seller_phone_verified),
    seller_trust_score: toNumber(row.seller_trust_score, null),
    seller_trust_level: row.seller_trust_level ?? null,
    user_rating: toNumber(row.user_rating, null),
    cover_image: coverImage && /^data:|^https?:\/\//i.test(String(coverImage))
      ? coverImage
      : row.cover_image_id
        ? buildUploadPublicUrl(row.cover_image_id, 'thumb_400')
        : coverImage,
  }
}

function buildSellerPayload(listing) {
  return {
    id: listing.seller_id,
    prenom: listing.seller_prenom,
    nom: listing.seller_nom,
    avatar_url: listing.seller_avatar,
    is_pro: listing.seller_is_pro,
    trust_score: listing.seller_trust_score,
    trust_level: listing.seller_trust_level,
    note_moyenne: listing.seller_note,
    nb_avis: listing.seller_nb_avis,
    nb_annonces: listing.seller_nb_annonces,
    created_at: listing.seller_since,
    commune_name: listing.seller_commune_name,
    province_name: listing.seller_province_name,
    telephone_verifie: listing.seller_phone_verified,
    email_verified: listing.seller_email_verified,
  }
}

function mapListingDetailResponse(listing, isFavorited = false) {
  const images = Array.isArray(listing.images)
    ? listing.images.map((img) => {
        const variants = normalizeImageVariants(img) || {}
        const original = variants.original?.url || img.url || null
        const thumb400 = variants.thumb_400?.url || img.thumbnail_url || null
        const thumb800 = variants.thumb_800?.url || img.medium_url || null

        const resolvedOriginal = original && /^data:|^https?:\/\//i.test(String(original))
          ? original
          : img.id
            ? buildUploadPublicUrl(img.id, 'original')
            : original
        const resolvedThumb400 = thumb400
          ? /^data:|^https?:\/\//i.test(String(thumb400))
            ? thumb400
            : img.id
              ? buildUploadPublicUrl(img.id, 'thumb_400')
              : thumb400
          : img.id
            ? buildUploadPublicUrl(img.id, 'thumb_400')
            : resolvedOriginal
        const resolvedThumb800 = thumb800
          ? /^data:|^https?:\/\//i.test(String(thumb800))
            ? thumb800
            : img.id
              ? buildUploadPublicUrl(img.id, 'thumb_800')
              : thumb800
          : img.id
            ? buildUploadPublicUrl(img.id, 'thumb_800')
            : resolvedOriginal

        return {
          id: img.id,
          url: resolvedOriginal,
          thumbnail_url: resolvedThumb400,
          medium_url: resolvedThumb800,
          original_url: resolvedOriginal,
          is_cover: Boolean(img.is_cover),
        }
      })
    : []

  return {
    data: {
      id: listing.id,
      titre: listing.titre,
      title: listing.titre,
      prix: listing.prix,
      price: listing.prix,
      price_negotiable: listing.is_negotiable,
      is_free: listing.prix == null,
      description: listing.description,
      condition: listing.condition,
      status: listing.status,
      is_featured: listing.is_featured,
      is_urgent: listing.is_urgent,
      nb_vues: listing.nb_vues,
      nb_favoris: listing.nb_favoris,
      commune_id: listing.commune_id,
      commune_name: listing.commune_name,
      commune_slug: listing.commune_slug,
      category_id: listing.category_id,
      category_name: listing.category_name,
      category_slug: listing.category_slug,
      category_icon: listing.category_icon,
      published_at: listing.created_at,
      contre_quoi: listing.contre_quoi,
      images,
      user: buildSellerPayload(listing),
      is_favorited: isFavorited,
    },
  }
}

function mapUserListingRow(row) {
  return {
    id: row.id,
    titre: row.titre ?? row.title ?? '',
    title: row.title ?? row.titre ?? '',
    prix: row.prix ?? row.price ?? null,
    price: row.price ?? row.prix ?? null,
    condition: row.condition ?? null,
    created_at: row.created_at ?? null,
    view_count: toNumber(row.view_count, 0),
    status: row.status ?? null,
    price_negotiable: toBoolean(row.price_negotiable),
    is_free: toBoolean(row.is_free),
    category_name: row.category_name ?? null,
    commune_name: row.commune_name ?? null,
    cover_image: row.cover_image ?? null,
  }
}

module.exports = {
  mapListingSearchRow,
  mapListingDetailResponse,
  mapUserListingRow,
}
