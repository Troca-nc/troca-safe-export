function toInt(value, fallback) {
  const parsed = parseInt(String(value), 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function buildListingSearchContext(rawQuery = {}) {
  const {
    q,
    category,
    category_id,
    commune_id,
    price_min,
    price_max,
    province_id,
    condition,
    troc,
    sort = 'date',
    page = 1,
    limit = 20,
  } = rawQuery

  const pageNum = Math.max(1, toInt(page, 1))
  const pageSize = Math.min(50, Math.max(1, toInt(limit, 20)))
  const offset = (pageNum - 1) * pageSize

  const conditions = [`a.status = 'active'`, `a.deleted_at IS NULL`]
  const params = []
  let p = 1

  if (q) {
    conditions.push(
      `(a.search_vector @@ plainto_tsquery('french', $${p})
        OR a.titre ILIKE $${p + 1})`
    )
    params.push(q, `%${q}%`)
    p += 2
  }

  if (category_id) {
    conditions.push(`a.category_id = $${p}`)
    params.push(parseInt(category_id, 10))
    p += 1
  } else if (category) {
    conditions.push(`(cat.slug = $${p} OR parent.slug = $${p})`)
    params.push(category)
    p += 1
  }

  if (commune_id) {
    conditions.push(`a.commune_id = $${p}`)
    params.push(parseInt(commune_id, 10))
    p += 1
  }

  if (province_id) {
    conditions.push(`prov.id = $${p}`)
    params.push(parseInt(province_id, 10))
    p += 1
  }

  if (price_min) {
    conditions.push(`a.prix >= $${p}`)
    params.push(parseFloat(price_min))
    p += 1
  }

  if (price_max) {
    conditions.push(`a.prix <= $${p}`)
    params.push(parseFloat(price_max))
    p += 1
  }

  if (condition) {
    conditions.push(`a.condition = $${p}`)
    params.push(condition)
    p += 1
  }

  if (String(troc) === 'true') {
    conditions.push(`a.contre_quoi IS NOT NULL AND a.contre_quoi <> ''`)
  }

  const sortMap = {
    date: 'a.boost_expires_at DESC NULLS LAST, a.created_at DESC',
    price_asc: 'a.prix ASC',
    price_desc: 'a.prix DESC',
    views: 'a.nb_vues DESC',
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
    orderBy: sortMap[sort] || sortMap.date,
    pageNum,
    pageSize,
    offset,
  }
}

module.exports = {
  buildListingSearchContext,
}
