'use strict';

const { query, withTransaction } = require('../config/database');
const { isConfiguredValue } = require('../config/env');
const { generateTicketToken } = require('./qrCodeService');

const EVENT_CATEGORIES = new Set([
  'concert',
  'festival',
  'sport',
  'marche',
  'conference',
  'exposition',
  'cinema',
  'spectacle',
  'autre',
]);

function normalizeMaybeText(value) {
  const text = String(value ?? '').trim();
  return text.length ? text : null;
}

function normalizeTicketType(value, index = 0) {
  const priceXpf = Number(value?.price_xpf ?? 0);
  const quantityTotal = Math.max(1, Number(value?.quantity_total ?? 0) || 1);
  return {
    name: normalizeMaybeText(value?.name) || `Billet ${index + 1}`,
    description: normalizeMaybeText(value?.description),
    price_xpf: Number.isFinite(priceXpf) && priceXpf >= 0 ? Math.round(priceXpf) : 0,
    quantity_total: Math.round(quantityTotal),
    sale_starts_at: value?.sale_starts_at ? new Date(value.sale_starts_at) : null,
    sale_ends_at: value?.sale_ends_at ? new Date(value.sale_ends_at) : null,
    is_active: value?.is_active !== false,
    position: Number.isFinite(Number(value?.position)) ? Number(value.position) : index,
  };
}

function serializeTicketType(row) {
  return {
    id: Number(row.id),
    event_id: Number(row.event_id),
    name: row.name,
    description: row.description ?? null,
    price_xpf: Number(row.price_xpf ?? 0),
    quantity_total: Number(row.quantity_total ?? 0),
    quantity_sold: Number(row.quantity_sold ?? 0),
    quantity_reserved: Number(row.quantity_reserved ?? 0),
    remaining: Math.max(0, Number(row.quantity_total ?? 0) - Number(row.quantity_sold ?? 0) - Number(row.quantity_reserved ?? 0)),
    sale_starts_at: row.sale_starts_at ?? null,
    sale_ends_at: row.sale_ends_at ?? null,
    is_active: Boolean(row.is_active),
    position: Number(row.position ?? 0),
  };
}

function serializeEventRow(row, ticketTypes = []) {
  return {
    id: Number(row.id),
    bon_plan_id: row.bon_plan_id == null ? null : Number(row.bon_plan_id),
    organizer_id: row.organizer_id == null ? null : Number(row.organizer_id),
    title: row.title,
    description: row.description ?? null,
    venue_name: row.venue_name ?? null,
    venue_address: row.venue_address ?? null,
    commune_id: row.commune_id == null ? null : Number(row.commune_id),
    event_date: row.event_date ?? null,
    event_time: row.event_time ?? null,
    end_time: row.end_time ?? null,
    cover_image_url: row.cover_image_url ?? null,
    photos: Array.isArray(row.photos) ? row.photos : [],
    category: row.category ?? 'autre',
    booking_url: row.booking_url ?? null,
    room: row.room ?? null,
    version: row.version ?? null,
    is_3d: Boolean(row.is_3d),
    price_normal_xpf: row.price_normal_xpf == null ? null : Number(row.price_normal_xpf),
    price_reduced_xpf: row.price_reduced_xpf == null ? null : Number(row.price_reduced_xpf),
    external_id: row.external_id ?? null,
    status: row.status ?? 'draft',
    has_ticketing: Boolean(row.has_ticketing),
    max_capacity: row.max_capacity == null ? null : Number(row.max_capacity),
    tickets_sold: row.tickets_sold == null ? 0 : Number(row.tickets_sold),
    is_free: Boolean(row.is_free),
    organizer_name: row.organizer_name ?? null,
    organizer_email: row.organizer_email ?? null,
    organizer_phone: row.organizer_phone ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    commune_name: row.commune_name ?? null,
    ticket_types: ticketTypes,
  };
}

async function loadEventTicketTypes(eventId) {
  const { rows } = await query(
    `SELECT id, event_id, name, description, price_xpf, quantity_total, quantity_sold, quantity_reserved,
            sale_starts_at, sale_ends_at, is_active, position
       FROM ticket_types
      WHERE event_id = $1
      ORDER BY position ASC, id ASC`,
    [eventId]
  );
  return rows.map(serializeTicketType);
}

async function listPublicEvents({ limit = 24, category = '', commune = '' } = {}) {
  const params = [];
  const where = [`e.status = 'published'`];

  if (category) {
    params.push(String(category).split(',').map((value) => value.trim()).filter(Boolean));
    where.push(`e.category = ANY($${params.length}::text[])`);
  }
  if (commune) {
    params.push(String(commune).split(',').map((value) => value.trim()).filter(Boolean));
    where.push(`(c.name = ANY($${params.length}::text[]) OR e.venue_name = ANY($${params.length}::text[]))`);
  }

  params.push(Math.min(Math.max(Number(limit) || 24, 1), 100));

  const { rows } = await query(
    `SELECT e.*, c.name AS commune_name
       FROM events e
       LEFT JOIN communes c ON c.id = e.commune_id
      WHERE ${where.join(' AND ')}
      ORDER BY e.event_date ASC, e.event_time ASC, e.id DESC
      LIMIT $${params.length}`,
    params
  );

  const events = await Promise.all(rows.map(async (row) => serializeEventRow(row, await loadEventTicketTypes(row.id))));
  return events;
}

async function getPublicEventById(id) {
  // Historical cancelled/completed rows have no verified publication history.
  // Fail closed until a server-owned publication record permits public archives.
  const { rows } = await query(
    `SELECT e.*, c.name AS commune_name
       FROM events e
       LEFT JOIN communes c ON c.id = e.commune_id
      WHERE e.id = $1 AND e.status = 'published'
      LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  return serializeEventRow(row, await loadEventTicketTypes(row.id));
}

async function createEventAndBonPlan({ user, payload }) {
  const ticketTypes = Array.isArray(payload.ticket_types) ? payload.ticket_types.map(normalizeTicketType) : [];
  const hasTicketing = Boolean(payload.has_ticketing || ticketTypes.length);
  const isFree = Boolean(payload.is_free);
  const maxCapacity = payload.max_capacity == null
    ? (ticketTypes.length ? ticketTypes.reduce((sum, ticket) => sum + Number(ticket.quantity_total || 0), 0) : null)
    : Number(payload.max_capacity);

  if (ticketTypes.length && !hasTicketing) {
    throw Object.assign(new Error('Les types de billets nécessitent `has_ticketing = true`.'), { status: 400 });
  }

  if (!EVENT_CATEGORIES.has(String(payload.category || 'autre'))) {
    throw Object.assign(new Error('Catégorie d’événement invalide.'), { status: 400 });
  }

  return withTransaction(async (client) => {
    const bonPlanResult = await client.query(
      `INSERT INTO bon_plans
         (user_id, title, description, kind, target_audience, commune_id, location_name, event_date,
          duration_days, price_xpf, is_free_included, contact_name, contact_phone, contact_email,
          website_url, photos, status, expires_at)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8::date, 7, $9, $10, $11, $12, $13, $14, $15::jsonb, 'active', NOW() + INTERVAL '365 days')
       RETURNING id`,
      [
        user.id,
        payload.title,
        payload.description || null,
        payload.kind || 'event',
        payload.target_audience || 'particulier',
        payload.commune_id || null,
        payload.venue_name || null,
        payload.event_date,
        Number(payload.price_xpf ?? 0),
        isFree,
        payload.organizer_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || null,
        payload.organizer_phone || null,
        payload.organizer_email || user.email || null,
        payload.website_url || null,
        JSON.stringify(Array.isArray(payload.photos) ? payload.photos.filter(Boolean) : []),
      ]
    );

    const bonPlanId = bonPlanResult.rows[0]?.id || null;
    const eventResult = await client.query(
      `INSERT INTO events
         (bon_plan_id, organizer_id, title, description, venue_name, venue_address, commune_id, event_date, event_time,
          end_time, cover_image_url, photos, category, status, has_ticketing, max_capacity, tickets_sold, is_free,
          organizer_name, organizer_email, organizer_phone, booking_url, room, version, is_3d, price_normal_xpf, price_reduced_xpf)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8::date, $9::time, $10::time, $11, $12::jsonb, $13, $14, $15, $16, 0, $17, $18, $19, $20, $21, $22, $23, $24, $25)
       RETURNING *`,
      [
        bonPlanId,
        user.id,
        payload.title,
        payload.description || null,
        payload.venue_name || null,
        payload.venue_address || null,
        payload.commune_id || null,
        payload.event_date,
        payload.event_time,
        payload.end_time || null,
        payload.cover_image_url || null,
        JSON.stringify(Array.isArray(payload.photos) ? payload.photos.filter(Boolean) : []),
        payload.category,
        payload.status || 'published',
        hasTicketing,
        Number.isFinite(maxCapacity) ? Math.max(0, Math.round(maxCapacity)) : null,
        isFree,
        payload.organizer_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || null,
        payload.organizer_email || user.email || null,
        payload.organizer_phone || null,
        payload.booking_url || null,
        payload.room || null,
        payload.version || null,
        Boolean(payload.is_3d),
        payload.price_normal_xpf == null ? null : Number(payload.price_normal_xpf),
        payload.price_reduced_xpf == null ? null : Number(payload.price_reduced_xpf),
      ]
    );

    const event = eventResult.rows[0];
    if (!event) {
      throw new Error('Impossible de créer l’événement');
    }

    const createdTicketTypes = [];
    for (const ticketType of ticketTypes) {
      const ticketResult = await client.query(
        `INSERT INTO ticket_types
           (event_id, name, description, price_xpf, quantity_total, quantity_sold, quantity_reserved,
            sale_starts_at, sale_ends_at, is_active, position)
         VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, $8, $9)
         RETURNING *`,
        [
          event.id,
          ticketType.name,
          ticketType.description,
          ticketType.price_xpf,
          ticketType.quantity_total,
          ticketType.sale_starts_at,
          ticketType.sale_ends_at,
          ticketType.is_active,
          ticketType.position,
        ]
      );
      createdTicketTypes.push(serializeTicketType(ticketResult.rows[0]));
    }

    return serializeEventRow(event, createdTicketTypes);
  });
}

async function createOrderTickets(eventId, orderId, buyer, selectedTickets, status = 'reserved') {
  const tickets = [];
  for (const item of selectedTickets) {
    const ticketType = item.ticketType;
    for (let index = 0; index < item.quantity; index += 1) {
      const token = generateTicketToken();
      const qrCodeUrl = null;
      const ticketStatus = status === 'paid' ? 'active' : 'reserved';
      const { rows } = await query(
        `INSERT INTO tickets
           (order_id, event_id, ticket_type_id, buyer_name, buyer_email, price_xpf, token, qr_code_url, is_scanned, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9)
         RETURNING *`,
        [
          orderId,
          eventId,
          ticketType.id,
          buyer.name,
          buyer.email,
          ticketType.price_xpf,
          token,
          qrCodeUrl,
          ticketStatus,
        ]
      );
      tickets.push(rows[0]);
    }
  }
  return tickets;
}

async function reserveEventTickets({ eventId, buyer, items, provider = 'stripe', demoMode = false }) {
  const event = await getPublicEventById(eventId);
  if (!event) {
    throw Object.assign(new Error('Événement introuvable.'), { status: 404 });
  }
  if (event.status !== 'published') {
    throw Object.assign(new Error('Événement non publié.'), { status: 409 });
  }

  const requested = Array.isArray(items) ? items : [];
  if (!requested.length) {
    throw Object.assign(new Error('Aucun billet sélectionné.'), { status: 400 });
  }

  const orderBuyer = {
    name: normalizeMaybeText(buyer?.name) || 'Acheteur',
    email: normalizeMaybeText(buyer?.email),
    phone: normalizeMaybeText(buyer?.phone),
  };
  if (!orderBuyer.email) {
    throw Object.assign(new Error('Email acheteur requis.'), { status: 400 });
  }

  const ticketTypes = new Map(event.ticket_types.map((ticketType) => [Number(ticketType.id), ticketType]));
  const selectedTickets = requested.map((item) => {
    const ticketType = ticketTypes.get(Number(item.ticket_type_id));
    const quantity = Math.max(1, Number(item.quantity || 0) || 1);
    if (!ticketType) {
      throw Object.assign(new Error('Type de billet introuvable.'), { status: 404 });
    }
    const remaining = Number(ticketType.remaining ?? 0);
    if (remaining < quantity) {
      throw Object.assign(new Error(`Stock insuffisant pour ${ticketType.name}.`), { status: 409 });
    }
    return { ticketType, quantity };
  });

  const totalXpf = selectedTickets.reduce((sum, item) => sum + item.quantity * Number(item.ticketType.price_xpf || 0), 0);

  if (totalXpf > 0 && provider !== 'stripe') {
    throw Object.assign(new Error('Ce moyen de paiement n’est pas encore disponible pour la billetterie.'), { status: 503 });
  }

  return withTransaction(async (client) => {
    const orderResult = await client.query(
      `INSERT INTO ticket_orders
         (event_id, buyer_id, buyer_email, buyer_name, buyer_phone, status, total_xpf, reserved_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'reserved', $6, NOW(), NOW() + INTERVAL '10 minutes')
       RETURNING *`,
      [
        eventId,
        buyer.userId || null,
        orderBuyer.email,
        orderBuyer.name,
        orderBuyer.phone,
        totalXpf,
      ]
    );
    const order = orderResult.rows[0];

    for (const item of selectedTickets) {
      await client.query(
        `UPDATE ticket_types
            SET quantity_reserved = quantity_reserved + $2,
                updated_at = NOW()
          WHERE id = $1`,
        [item.ticketType.id, item.quantity]
      );
    }

    const tickets = [];
    for (const item of selectedTickets) {
      for (let index = 0; index < item.quantity; index += 1) {
        const token = generateTicketToken();
        const qrCodeUrl = null;
        const ticketResult = await client.query(
          `INSERT INTO tickets
             (order_id, event_id, ticket_type_id, buyer_name, buyer_email, price_xpf, token, qr_code_url, is_scanned, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, 'reserved')
           RETURNING *`,
          [
            order.id,
            eventId,
            item.ticketType.id,
            orderBuyer.name,
            orderBuyer.email,
            item.ticketType.price_xpf,
            token,
            qrCodeUrl,
          ]
        );
        tickets.push(ticketResult.rows[0]);
      }
    }

    if (totalXpf <= 0 || demoMode) {
      await client.query(
        `UPDATE ticket_orders
            SET status = 'paid',
                paid_at = NOW(),
                stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, $2),
                updated_at = NOW()
          WHERE id = $1`,
        [order.id, demoMode ? `demo_${order.id}` : null]
      );

      for (const item of selectedTickets) {
        await client.query(
          `UPDATE ticket_types
              SET quantity_reserved = GREATEST(quantity_reserved - $2, 0),
                  quantity_sold = quantity_sold + $2,
                  updated_at = NOW()
            WHERE id = $1`,
          [item.ticketType.id, item.quantity]
        );
      }

      await client.query(
        `UPDATE events
            SET tickets_sold = tickets_sold + $2,
                updated_at = NOW()
          WHERE id = $1`,
        [eventId, tickets.length]
      );

      await client.query(
        `UPDATE tickets
            SET status = 'active'
          WHERE order_id = $1`,
        [order.id]
      );

      return {
        order: { ...order, status: 'paid', total_xpf: totalXpf, event_title: event.title },
        tickets: tickets.map((ticket) => ({ ...ticket, status: 'active' })),
        checkout_url: null,
        demo: true,
      };
    }

    if (!isConfiguredValue(process.env.STRIPE_SECRET_KEY)) {
      throw Object.assign(new Error('Stripe non configuré'), { status: 503 });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: '2023-10-16' });
    const amountEurCents = selectedTickets.reduce(
      (sum, item) => sum + item.quantity * Math.max(50, Math.round((item.ticketType.price_xpf / 119.3317) * 100)),
      0
    );
    const paymentMetadata = {
      payment_type: 'event_ticket',
      event_id: String(eventId),
      order_id: String(order.id),
      user_id: String(buyer.userId || ''),
      amount_xpf: String(totalXpf),
      amount_eur_cents: String(amountEurCents),
    };
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: orderBuyer.email,
      line_items: selectedTickets.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.ticketType.name,
            description: item.ticketType.description || event.title,
          },
          unit_amount: Math.max(50, Math.round((item.ticketType.price_xpf / 119.3317) * 100)),
        },
      })),
      success_url: `${process.env.BASE_URL || 'https://kalico.nc'}/evenements/${eventId}?paid=1&session_id={CHECKOUT_SESSION_ID}&order=${order.id}`,
      cancel_url: `${process.env.BASE_URL || 'https://kalico.nc'}/evenements/${eventId}?cancelled=1&order=${order.id}`,
      metadata: paymentMetadata,
      payment_intent_data: {
        metadata: paymentMetadata,
      },
    });

    await client.query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'event_ticket', 'stripe', $2, $3, 'pending', $4)`,
      [
        buyer.userId || null,
        session.id,
        totalXpf,
        JSON.stringify({
          payment_type: 'event_ticket',
          event_id: String(eventId),
          order_id: String(order.id),
          buyer_email: orderBuyer.email,
          amount_xpf: String(totalXpf),
          amount_eur_cents: String(amountEurCents),
        }),
      ]
    );

    await client.query(
      `UPDATE ticket_orders
          SET stripe_payment_intent_id = $2,
              stripe_client_secret = $3,
              updated_at = NOW()
        WHERE id = $1`,
      [order.id, session.payment_intent || session.id, session.client_secret || null]
    );

    return {
      order: { ...order, event_title: event.title },
      tickets: [],
      checkout_url: session.url || null,
      client_secret: session.payment_intent ? session.client_secret || null : null,
      session_id: session.id,
      provider: 'stripe',
    };
  });
}

// When a client is supplied, the caller owns BEGIN/COMMIT/ROLLBACK and release.
async function finalizeEventTicketPayment({ providerRef, paymentStatus = 'succeeded', client = null }) {
  if (paymentStatus !== 'succeeded') return null;
  if (client !== null && typeof client?.query !== 'function') {
    throw new TypeError('A transaction client with query is required');
  }
  const finalize = async (client) => {
    const { rows: paymentRows } = await client.query(
      `SELECT id, user_id, metadata, status
         FROM payments
        WHERE provider = 'stripe' AND provider_ref = $1
        LIMIT 1
        FOR UPDATE`,
      [providerRef]
    );
    const payment = paymentRows[0];
    if (!payment) return null;

    const meta = payment.metadata || {};
    if (meta.payment_type !== 'event_ticket') return null;
    const orderId = Number(meta.order_id || 0);
    const eventId = Number(meta.event_id || 0);
    if (!orderId || !eventId) return null;

    const { rows: orderRows } = await client.query(
      `SELECT id, status, expires_at
         FROM ticket_orders
        WHERE id = $1 AND event_id = $2
        LIMIT 1
        FOR UPDATE`,
      [orderId, eventId]
    );
    const order = orderRows[0];
    if (!order) return null;

    if (order.status === 'paid') {
      const existing = await client.query(
        `SELECT t.id, t.token, t.qr_code_url, t.status, t.price_xpf, e.title AS event_title,
                o.buyer_email, o.buyer_name, o.total_xpf
           FROM tickets t
           JOIN ticket_orders o ON o.id = t.order_id
           JOIN events e ON e.id = t.event_id
          WHERE t.order_id = $1
          ORDER BY t.id ASC`,
        [orderId]
      );
      return { order_id: orderId, event_id: eventId, status: 'already_paid', order, tickets: existing.rows };
    }
    if (order.status !== 'reserved') {
      return null;
    }

    const ticketsRows = await client.query(
      `SELECT id, ticket_type_id, price_xpf
         FROM tickets
        WHERE order_id = $1 AND status = 'reserved'
        FOR UPDATE`,
      [orderId]
    );
    if (!ticketsRows.rows.length) return null;

    const grouped = new Map();
    for (const row of ticketsRows.rows) {
      grouped.set(Number(row.ticket_type_id), (grouped.get(Number(row.ticket_type_id)) || 0) + 1);
    }
    for (const [ticketTypeId, count] of grouped.entries()) {
      await client.query(
        `UPDATE ticket_types
            SET quantity_reserved = GREATEST(quantity_reserved - $2, 0),
                quantity_sold = quantity_sold + $2,
                updated_at = NOW()
          WHERE id = $1`,
        [ticketTypeId, count]
      );
    }

    await client.query(`UPDATE tickets SET status = 'active' WHERE order_id = $1 AND status = 'reserved'`, [orderId]);
    await client.query(
      `UPDATE ticket_orders
          SET status = 'paid', paid_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND status = 'reserved'`,
      [orderId]
    );
    await client.query(
      `UPDATE events SET tickets_sold = tickets_sold + $2, updated_at = NOW() WHERE id = $1`,
      [eventId, ticketsRows.rows.length]
    );
    await client.query(
      `UPDATE payments SET status = 'succeeded', updated_at = NOW() WHERE id = $1`,
      [payment.id]
    );

    const finalOrder = await client.query(
      `SELECT o.*, e.title AS event_title
         FROM ticket_orders o JOIN events e ON e.id = o.event_id
        WHERE o.id = $1 LIMIT 1`,
      [orderId]
    );
    const finalTickets = await client.query(
      `SELECT t.id, t.token, t.qr_code_url, t.status, t.price_xpf, e.title AS event_title,
              o.buyer_email, o.buyer_name, o.total_xpf
         FROM tickets t
         JOIN ticket_orders o ON o.id = t.order_id
         JOIN events e ON e.id = t.event_id
        WHERE t.order_id = $1 ORDER BY t.id ASC`,
      [orderId]
    );
    return { order_id: orderId, event_id: eventId, status: 'paid', order: finalOrder.rows[0], tickets: finalTickets.rows };
  };
  return client === null ? withTransaction(finalize) : finalize(client);
}

async function expireEventTicketReservations() {
  const { rows } = await query(
    `SELECT id, event_id
       FROM ticket_orders
      WHERE status = 'reserved'
        AND expires_at <= NOW()
      ORDER BY expires_at ASC
      LIMIT 100`
  );

  for (const order of rows) {
    const ticketsRows = await query(
      `SELECT ticket_type_id, COUNT(*)::int AS count
         FROM tickets
        WHERE order_id = $1
        GROUP BY ticket_type_id`,
      [order.id]
    );

    for (const row of ticketsRows.rows) {
      await query(
        `UPDATE ticket_types
            SET quantity_reserved = GREATEST(quantity_reserved - $2, 0),
                updated_at = NOW()
          WHERE id = $1`,
        [row.ticket_type_id, Number(row.count || 0)]
      );
    }

    await query(`UPDATE tickets SET status = 'cancelled' WHERE order_id = $1`, [order.id]);
    await query(
      `UPDATE ticket_orders
          SET status = 'expired',
              cancelled_at = NOW(),
              cancellation_reason = 'reservation_expired',
              updated_at = NOW()
        WHERE id = $1`,
      [order.id]
    );
  }

  return { expired: rows.length };
}

async function getTicketByToken(token) {
  const { rows } = await query(
    `SELECT t.*, e.title AS event_title, e.event_date, e.event_time, e.status AS event_status,
            tt.name AS ticket_type_name, tt.price_xpf AS ticket_price_xpf,
            e.organizer_id, o.buyer_id, o.buyer_name, o.buyer_email, o.status AS order_status
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       LEFT JOIN ticket_types tt ON tt.id = t.ticket_type_id
       LEFT JOIN ticket_orders o ON o.id = t.order_id
      WHERE t.token = $1
      LIMIT 1`,
    [token]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    token: row.token,
    qr_code_url: null,
    status: row.status,
    is_scanned: Boolean(row.is_scanned),
    scanned_at: row.scanned_at ?? null,
    scan_location: row.scan_location ?? null,
    event_title: row.event_title,
    event_date: row.event_date ?? null,
    event_time: row.event_time ?? null,
    event_status: row.event_status,
    ticket_type_name: row.ticket_type_name ?? null,
    ticket_price_xpf: row.ticket_price_xpf == null ? null : Number(row.ticket_price_xpf),
    buyer_name: row.buyer_name ?? null,
    buyer_email: row.buyer_email ?? null,
    order_status: row.order_status ?? null,
    organizer_id: row.organizer_id == null ? null : Number(row.organizer_id),
    buyer_id: row.buyer_id == null ? null : Number(row.buyer_id),
  };
}

function canManageTicket(user, ticket) {
  if (!user || !ticket) return false;
  if (user.is_admin) return true;
  const userId = Number(user.id || 0);
  const organizerId = Number(ticket.organizer_id || 0);
  return userId > 0 && organizerId > 0 && userId === organizerId;
}

function serializeTicketForViewer(ticket, user = null) {
  if (!ticket) return null;
  const publicTicket = {
    id: ticket.id,
    can_manage: false,
    status: ticket.status,
    is_scanned: ticket.is_scanned,
    event_title: ticket.event_title,
    event_date: ticket.event_date,
    event_time: ticket.event_time,
    event_status: ticket.event_status,
    ticket_type_name: ticket.ticket_type_name,
  };
  if (!canManageTicket(user, ticket)) return publicTicket;
  return {
    ...publicTicket,
    can_manage: true,
    token: ticket.token,
    scanned_at: ticket.scanned_at,
    scan_location: ticket.scan_location,
    ticket_price_xpf: ticket.ticket_price_xpf,
    buyer_name: ticket.buyer_name,
    buyer_email: ticket.buyer_email,
    order_status: ticket.order_status,
  };
}

async function scanTicket({ token, scannerUser, location = null }) {
  const ticket = await getTicketByToken(token);
  if (!ticket) {
    throw Object.assign(new Error('Billet introuvable.'), { status: 404 });
  }
  if (!canManageTicket(scannerUser, ticket)) {
    throw Object.assign(new Error('Accès réservé à l’organisateur de cet événement.'), { status: 403 });
  }
  if (ticket.status === 'used') {
    return { ticket, already_scanned: true };
  }
  if (ticket.status !== 'active' || ticket.order_status !== 'paid') {
    throw Object.assign(new Error('Ce billet n’est pas valide.'), { status: 409 });
  }

  const updated = await query(
    `UPDATE tickets
        SET status = 'used',
            is_scanned = TRUE,
            scanned_at = NOW(),
            scanned_by = $2,
            scan_location = $3
      WHERE token = $1
        AND status = 'active'
        AND is_scanned = FALSE
      RETURNING id`,
    [token, scannerUser.id, location]
  );

  return {
    ticket: await getTicketByToken(token),
    already_scanned: updated.rows.length === 0,
  };
}

module.exports = {
  createEventAndBonPlan,
  expireEventTicketReservations,
  finalizeEventTicketPayment,
  getTicketByToken,
  canManageTicket,
  serializeTicketForViewer,
  getPublicEventById,
  listPublicEvents,
  reserveEventTickets,
  scanTicket,
  serializeEventRow,
  serializeTicketType,
  loadEventTicketTypes,
};
