function toInt(value, fallback) {
  const parsed = parseInt(String(value), 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function toFloat(value, fallback) {
  const parsed = parseFloat(String(value))
  return Number.isNaN(parsed) ? fallback : parsed
}

function toCursorEpoch(value) {
  if (!value) return 0
  const date = new Date(value)
  const ts = date.getTime()
  return Number.isNaN(ts) ? 0 : Math.floor(ts / 1000)
}

function encodeListingCursor(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function decodeListingCursor(token) {
  if (!token) return null
  try {
    const raw = Buffer.from(String(token), 'base64url').toString('utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.v !== 1 || typeof parsed.sort !== 'string' || !Array.isArray(parsed.values)) return null
    return parsed
  } catch {
    return null
  }
}

function getSortConfig(sort) {
  switch (sort) {
    case 'price_asc':
      return {
        orderBy: '-COALESCE(a.prix, 999999999) ASC, -EXTRACT(EPOCH FROM a.created_at) ASC, -a.id ASC',
        tupleSql: ['COALESCE(a.prix, 999999999)', '-EXTRACT(EPOCH FROM a.created_at)', '-a.id'],
        tupleFromRow: (row) => [
          Number(row.prix ?? row.price ?? 999999999),
          -toCursorEpoch(row.published_at ?? row.created_at),
          -Number(row.id),
        ],
      }
    case 'price_desc':
      return {
        orderBy: '-COALESCE(a.prix, 0) ASC, -EXTRACT(EPOCH FROM a.created_at) ASC, -a.id ASC',
        tupleSql: ['-COALESCE(a.prix, 0)', '-EXTRACT(EPOCH FROM a.created_at)', '-a.id'],
        tupleFromRow: (row) => [
          -Number(row.prix ?? row.price ?? 0),
          -toCursorEpoch(row.published_at ?? row.created_at),
          -Number(row.id),
        ],
      }
    case 'views':
      return {
        orderBy: '-COALESCE(a.nb_vues, 0) ASC, -EXTRACT(EPOCH FROM a.created_at) ASC, -a.id ASC',
        tupleSql: ['-COALESCE(a.nb_vues, 0)', '-EXTRACT(EPOCH FROM a.created_at)', '-a.id'],
        tupleFromRow: (row) => [
          -Number(row.nb_vues ?? 0),
          -toCursorEpoch(row.published_at ?? row.created_at),
          -Number(row.id),
        ],
      }
    case 'date':
    default:
      return {
        orderBy: '-COALESCE(EXTRACT(EPOCH FROM a.boost_expires_at), 0) ASC, -EXTRACT(EPOCH FROM a.created_at) ASC, -a.id ASC',
        tupleSql: ['-COALESCE(EXTRACT(EPOCH FROM a.boost_expires_at), 0)', '-EXTRACT(EPOCH FROM a.created_at)', '-a.id'],
        tupleFromRow: (row) => [
          -toCursorEpoch(row.boosted_until ?? row.boost_expires_at),
          -toCursorEpoch(row.published_at ?? row.created_at),
          -Number(row.id),
        ],
      }
  }
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
    lat,
    lng,
    radius,
    sort = 'date',
    page = 1,
    limit = 20,
    after,
  } = rawQuery

  const pageNum = Math.max(1, toInt(page, 1))
  const pageSize = Math.min(50, Math.max(1, toInt(limit, 20)))
  const offset = (pageNum - 1) * pageSize

  const conditions = [`a.status = 'active'`, `a.deleted_at IS NULL`]
  const params = []
  let p = 1
  const hasGeo = Number.isFinite(toFloat(lat, NaN)) && Number.isFinite(toFloat(lng, NaN))
  const radiusKm = Math.min(100, Math.max(5, toFloat(radius, 20)))
  let geo = null
  const sortConfig = getSortConfig(sort)
  const decodedCursor = decodeListingCursor(after)
  const cursorValues = decodedCursor?.sort === sort ? decodedCursor.values : null

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

  if (hasGeo) {
    const userLng = toFloat(lng, 0)
    const userLat = toFloat(lat, 0)
    conditions.push(`com.latitude IS NOT NULL AND com.longitude IS NOT NULL`)
    conditions.push(
      `ST_DWithin(
        ST_SetSRID(ST_MakePoint(com.longitude, com.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint($${p}, $${p + 1}), 4326)::geography,
        $${p + 2} * 1000
      )`
    )
    params.push(userLng, userLat, radiusKm)
    geo = {
      enabled: true,
      lngParam: p,
      latParam: p + 1,
      radiusParam: p + 2,
      radiusKm,
    }
    p += 3
  }

  const cursorWhere = cursorValues && cursorValues.length === 3
    ? `(${sortConfig.tupleSql.join(', ')}) > ($${p}, $${p + 1}, $${p + 2})`
    : ''
  const cursorParams = cursorValues && cursorValues.length === 3 ? cursorValues : []

  return {
    whereClause: conditions.join(' AND '),
    params,
    orderBy: sortConfig.orderBy,
    cursorWhere,
    cursorParams,
    sort,
    pageNum,
    pageSize,
    offset,
    geo,
    sortConfig,
    cursorValues,
  }
}

module.exports = {
  buildListingSearchContext,
  decodeListingCursor,
  encodeListingCursor,
  getSortConfig,
}
