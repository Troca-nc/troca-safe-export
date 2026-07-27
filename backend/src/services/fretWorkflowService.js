'use strict';

const twilio = require('twilio');

const { isConfiguredValue } = require('../config/env');
const { query, withTransaction } = require('../config/database');
const { createNotification } = require('./notificationService');
const { sendPushToUser, sendPushToUsers } = require('./pushService');
const { sendMail } = require('./emailService');
const { estimateFreightQuote, VOLUME_BUCKETS, WEIGHT_BUCKETS, URGENCY_BUCKETS } = require('../shared-copy/envoi-livraisonPricing');

const PICKUP_SLOT_LABELS = {
  morning: 'Matin',
  midday: 'Midi',
  afternoon: 'Après-midi',
  evening: 'Fin de journée',
};

function getBaseUrl() {
  return (process.env.BASE_URL || 'https://kalico.nc').replace(/\/+$/, '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`;
}

function formatDateLabel(value) {
  if (!value) return 'Non précisée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non précisée';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

function formatUserName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Utilisateur Kalico';
}

function getSmsFromNumber() {
  const raw = process.env.TWILIO_SMS_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_FROM;
  return isConfiguredValue(raw) ? String(raw).trim() : '';
}

function buildTwilioClient() {
  if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
    return null;
  }
  if (!isConfiguredValue(process.env.TWILIO_ACCOUNT_SID) || !isConfiguredValue(process.env.TWILIO_AUTH_TOKEN)) {
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID.trim(), process.env.TWILIO_AUTH_TOKEN.trim());
}

const twilioClient = buildTwilioClient();

async function sendSms({ to, body }) {
  const normalized = String(to || '').trim();
  const from = getSmsFromNumber();
  if (!normalized || !from || !twilioClient) return { skipped: true };

  await twilioClient.messages.create({
    from,
    to: normalized,
    body,
  });

  return { sent: true };
}

function mapRequestStatusLabel(request) {
  if (!request) return 'En attente';
  if (request.status === 'cancelled') return 'Annulée';
  if (request.delivered_at) return 'Livré';
  if (request.selected_offer_id || request.status === 'closed') {
    const pickup = request.pickup_date ? new Date(`${request.pickup_date}T00:00:00`) : null;
    if (pickup && !Number.isNaN(pickup.getTime()) && pickup <= new Date()) {
      return 'En cours';
    }
    return 'Confirmé';
  }
  return 'En attente';
}

function mapOfferStatusLabel(status) {
  if (status === 'selected') return 'Sélectionné';
  if (status === 'rejected') return 'Non retenu';
  return 'En attente';
}

function mapVolumeBucket(bucket) {
  return VOLUME_BUCKETS[bucket] || null;
}

function mapWeightBucket(bucket) {
  return WEIGHT_BUCKETS[bucket] || null;
}

function mapUrgencyBucket(bucket) {
  return URGENCY_BUCKETS[bucket] || null;
}

function normalizeServiceType(value) {
  if (value === 'colis' || value === 'demenagement' || value === 'fret_pro') return value;
  return 'fret_pro';
}

function getServiceTypeLabel(value) {
  switch (normalizeServiceType(value)) {
    case 'colis':
      return 'Colis';
    case 'demenagement':
      return 'D�m�nagement';
    default:
      return 'Fret Pro';
  }
}

function getTransporterSpecialtyFilter(serviceType) {
  switch (normalizeServiceType(serviceType)) {
    case 'colis':
      return `(COALESCE(pt.specialite_colis, FALSE) = TRUE)`;
    case 'demenagement':
      return `(COALESCE(pt.specialite_demenagement, FALSE) = TRUE)`;
    default:
      return `((COALESCE(pt.specialite_fret_pro, FALSE) = TRUE) OR (COALESCE(pt.has_fret, FALSE) = TRUE))`;
  }
}

async function loadRequestById(client, requestId) {
  const result = await client.query(
    `SELECT
       fr.*,
       cd.name AS departure_commune_name,
       cd.slug AS departure_commune_slug,
       ca.name AS destination_commune_name,
       ca.slug AS destination_commune_slug,
       author.prenom AS author_prenom,
       author.nom AS author_nom,
       author.email AS author_email,
       author.telephone AS author_phone,
       selected.company_name AS selected_company_name,
       selected_user.prenom AS selected_prenom,
       selected_user.nom AS selected_nom,
       selected_user.email AS selected_email,
       selected_user.telephone AS selected_phone,
       selected_user.pro_phone AS selected_pro_phone,
       selected_user.pro_company_name AS selected_pro_company_name
     FROM delivery_requests fr
     LEFT JOIN communes cd ON cd.id = fr.departure_commune_id
     LEFT JOIN communes ca ON ca.id = fr.destination_commune_id
     LEFT JOIN users author ON author.id = fr.author_id
     LEFT JOIN pro_transporters selected ON selected.id = fr.selected_transporter_id
     LEFT JOIN users selected_user ON selected_user.id = selected.user_id
     WHERE fr.id = $1
     LIMIT 1`,
    [requestId]
  );

  return result.rows[0] || null;
}

async function loadRequestOffers(client, requestIds) {
  const ids = (Array.isArray(requestIds) ? requestIds : [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!ids.length) return [];

  const result = await client.query(
    `SELECT
       o.*,
       pt.company_name,
       pt.rating,
       pt.is_verified,
       pt.pro_phone,
       pt.pro_commune,
       pt.vehicle_description,
       u.prenom,
       u.nom,
       u.email,
       u.telephone,
       u.pro_company_name,
       u.pro_logo_url
     FROM delivery_offers o
     JOIN pro_transporters pt ON pt.id = o.transporter_id
     JOIN users u ON u.id = pt.user_id
     WHERE o.request_id = ANY($1::bigint[])
     ORDER BY o.created_at ASC`,
    [ids]
  );

  return result.rows;
}

function buildRequestPayload(row, offers = []) {
  return {
    id: Number(row.id),
    author_id: row.author_id == null ? null : Number(row.author_id),
    departure_commune_id: row.departure_commune_id == null ? null : Number(row.departure_commune_id),
    destination_commune_id: row.destination_commune_id == null ? null : Number(row.destination_commune_id),
    departure_commune: row.departure_commune_name
      ? {
        id: row.departure_commune_id == null ? null : Number(row.departure_commune_id),
        name: row.departure_commune_name,
        slug: row.departure_commune_slug || null,
      }
      : null,
    destination_commune: row.destination_commune_name
      ? {
        id: row.destination_commune_id == null ? null : Number(row.destination_commune_id),
        name: row.destination_commune_name,
        slug: row.destination_commune_slug || null,
      }
      : null,
    departure: row.departure_commune_name || row.departure || '',
    destination: row.destination_commune_name || row.destination || '',
    service_type: normalizeServiceType(row.service_type),
    cargo_type: row.cargo_type || '',
    type_marchandise: row.type_marchandise || row.cargo_type || '',
    poids: row.poids || null,
    fragile: Boolean(row.fragile),
    volume: row.volume || null,
    etage_depart: row.etage_depart || null,
    etage_arrivee: row.etage_arrivee || null,
    manutention: Boolean(row.manutention),
    nb_pieces: row.nb_pieces || null,
    volume_bucket: row.volume_bucket || '',
    weight_bucket: row.weight_bucket || '',
    urgency: row.urgency || '',
    description: row.description || '',
    budget_max_xpf: row.budget_max_xpf == null ? null : Number(row.budget_max_xpf),
    contact_email: row.contact_email || row.author_email || '',
    contact_phone: row.contact_phone || row.author_phone || '',
    estimated_min_xpf: row.estimated_min_xpf == null ? null : Number(row.estimated_min_xpf),
    estimated_max_xpf: row.estimated_max_xpf == null ? null : Number(row.estimated_max_xpf),
    response_deadline_at: row.response_deadline_at || null,
    status: row.status,
    selected_offer_id: row.selected_offer_id == null ? null : Number(row.selected_offer_id),
    selected_transporter_id: row.selected_transporter_id == null ? null : Number(row.selected_transporter_id),
    selected_at: row.selected_at || null,
    selection_change_deadline_at: row.selection_change_deadline_at || null,
    selection_method: row.selection_method || null,
    confirmed_at: row.confirmed_at || null,
    delivered_at: row.delivered_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_name: formatUserName(row.author_prenom, row.author_nom),
    author_email: row.author_email || '',
    author_phone: row.author_phone || '',
    selected_transporter: row.selected_company_name || row.selected_pro_company_name || null,
    status_label: mapRequestStatusLabel(row),
    offers: offers
      .filter((offer) => Number(offer.request_id) === Number(row.id))
      .map(mapOfferPayload),
    offers_count: offers.filter((offer) => Number(offer.request_id) === Number(row.id)).length,
  };
}

function mapOfferPayload(row) {
  return {
    id: Number(row.id),
    request_id: Number(row.request_id),
    transporter_id: Number(row.transporter_id),
    transporter_user_id: Number(row.transporter_user_id),
    request_departure: row.request_departure || row.departure || null,
    request_destination: row.request_destination || row.destination || null,
    request_status: row.request_status || null,
    request_response_deadline_at: row.response_deadline_at || null,
    request_selected_offer_id: row.selected_offer_id == null ? null : Number(row.selected_offer_id),
    request_selected_transporter_id: row.selected_transporter_id == null ? null : Number(row.selected_transporter_id),
    request_confirmed_at: row.confirmed_at || null,
    request_delivered_at: row.delivered_at || null,
    amount_xpf: Number(row.amount_xpf),
    pickup_date: row.pickup_date,
    pickup_slot: row.pickup_slot,
    pickup_slot_label: PICKUP_SLOT_LABELS[row.pickup_slot] || row.pickup_slot || 'Créneau à confirmer',
    message: row.message || '',
    status: row.status,
    score: row.score == null ? null : Number(row.score),
    created_at: row.created_at,
    updated_at: row.updated_at,
    responded_at: row.responded_at || null,
    selected_at: row.selected_at || null,
    status_label: mapOfferStatusLabel(row.status),
    transporter: {
      id: Number(row.transporter_id),
      user_id: Number(row.transporter_user_id),
      company_name: row.company_name || row.pro_company_name || 'Transporteur',
      display_name: row.pro_company_name || row.company_name || 'Transporteur',
      rating: row.rating == null ? 0 : Number(row.rating),
      is_verified: Boolean(row.is_verified),
      pro_phone: row.pro_phone || null,
      pro_commune: row.pro_commune || null,
      vehicle_description: row.vehicle_description || null,
      prenom: row.prenom || null,
      nom: row.nom || null,
      email: row.email || null,
      telephone: row.telephone || null,
      pro_logo_url: row.pro_logo_url || null,
    },
  };
}

async function loadEligibleTransporters(client, serviceType = 'fret_pro') {
  const specialtyFilter = getTransporterSpecialtyFilter(serviceType);
  const result = await client.query(
    `SELECT
       pt.id AS transporter_id,
       pt.user_id,
       pt.company_name,
       pt.rating,
       pt.is_verified,
       pt.is_available,
       pt.service_zones,
       pt.fret_description,
       pt.fret_vehicle_type,
       pt.fret_volume_m3,
       pt.fret_max_weight_kg,
       pt.fret_price_per_m3_xpf,
       u.prenom,
       u.nom,
       u.email,
       u.telephone,
       u.expo_push_token,
       u.pro_phone,
       u.pro_commune,
       u.pro_company_name,
       u.pro_logo_url
     FROM pro_transporters pt
     JOIN users u ON u.id = pt.user_id
     WHERE ${specialtyFilter}
       AND pt.is_verified = TRUE
       AND pt.is_available = TRUE
       AND (u.has_fret_plan = TRUE OR u.is_pro = TRUE)
       AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())
       AND u.deleted_at IS NULL
     ORDER BY COALESCE(pt.rating, 0) DESC, pt.created_at DESC`
  );

  return result.rows;
}

async function notifyTransportersOfRequest(requestRow, estimate, transporters) {
  const requestLabel = `${requestRow.departure_commune_name || requestRow.departure} → ${requestRow.destination_commune_name || requestRow.destination}`;
  const subject = `Nouvelle demande Envoi & Livraison : ${requestLabel}`;
  const budgetLabel = requestRow.budget_max_xpf == null ? 'Non précisé' : formatMoney(requestRow.budget_max_xpf);
  const bodyText = `${requestLabel} · ${requestRow.volume_label || requestRow.volume_bucket || 'Volume'} · ${requestRow.urgency_label || requestRow.urgency || 'Date flexible'} · Budget max : ${budgetLabel}`;
  const href = `${getBaseUrl()}/pro/dashboard/envoi-livraison?request_id=${requestRow.id}`;

  await Promise.allSettled(transporters.map(async (transporter) => {
    const transporterName = formatUserName(transporter.prenom, transporter.nom) || transporter.pro_company_name || transporter.company_name || 'Transporteur';
    const recipientEmail = transporter.email || null;
    const recipientPhone = transporter.telephone || null;

    await createNotification(transporter.user_id, {
      type: 'fret_request_received',
      title: subject,
      body: bodyText,
      href,
    }).catch(() => {});

    if (recipientEmail) {
      await sendMail({
        to: recipientEmail,
        subject,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <p>Bonjour ${escapeHtml(transporterName)},</p>
            <p>Une nouvelle demande Envoi &amp; Livraison est disponible sur Kalico.</p>
            <div style="border:1px solid #dbeafe;border-radius:16px;padding:16px 18px;background:#f8fafc;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;">Demande Envoi &amp; Livraison</p>
              <p style="margin:0;font-size:18px;font-weight:700;">${escapeHtml(requestLabel)}</p>
              <p style="margin:8px 0 0;">Type : ${escapeHtml(requestRow.cargo_type || 'Marchandise')}</p>
              <p style="margin:0;">Volume : ${escapeHtml(requestRow.volume_label || requestRow.volume_bucket || 'À préciser')}</p>
              <p style="margin:0;">Poids : ${escapeHtml(requestRow.weight_label || requestRow.weight_bucket || 'À préciser')}</p>
              <p style="margin:0;">Urgence : ${escapeHtml(requestRow.urgency_label || requestRow.urgency || 'À préciser')}</p>
              <p style="margin:0;">Budget max : ${escapeHtml(budgetLabel)}</p>
              <p style="margin:0;">Référence indicative : ${escapeHtml(formatMoney(estimate.recommended_total_xpf))}</p>
            </div>
            <p style="margin-top:16px;">
              <a href="${href}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0a7ea4;color:#fff;text-decoration:none;font-weight:700;">Voir la demande</a>
            </p>
          <p style="color:#64748b;font-size:12px;">Connectez-vous pour soumettre votre offre.</p>
          </div>
        `,
      }).catch(() => {});
    }

    if (recipientPhone) {
      const smsBody = `Nouvelle demande Envoi & Livraison : ${requestLabel} · ${requestRow.volume_label || requestRow.volume_bucket} · ${requestRow.urgency_label || requestRow.urgency} · Budget max : ${budgetLabel}. Connectez-vous pour soumettre votre offre.`;
      await sendSms({ to: recipientPhone, body: smsBody }).catch(() => {});
    }

    if (transporter.expo_push_token) {
      await sendPushToUser(transporter.user_id, {
        title: subject,
        body: bodyText,
        data: {
          type: 'fret_request_received',
          request_id: requestRow.id,
        },
      }).catch(() => {});
    }
  }));
}

async function notifyRequesterOfferReceived(requestRow, offerRow, transporter = offerRow?.transporter || {}) {
  const title = 'Nouvelle offre reçue pour votre demande Envoi & Livraison';
  const label = (requestRow.departure_commune_name || requestRow.departure) + ' \u2192 ' + (requestRow.destination_commune_name || requestRow.destination);
  const transporterName = transporter.display_name || transporter.company_name || offerRow?.transporter?.display_name || offerRow?.transporter?.company_name || 'Transporteur';
  const pickupLabel = formatDateLabel(offerRow.pickup_date);
  const body = transporterName + ' propose ' + formatMoney(offerRow.amount_xpf) + ' pour le ' + pickupLabel + '. Vous pouvez comparer les offres et choisir librement le transporteur.';
  const href = getBaseUrl() + '/envoi-livraison';
  const emailTarget = requestRow.contact_email || requestRow.author_email || null;
  const phoneTarget = requestRow.contact_phone || requestRow.author_phone || null;

  await createNotification(requestRow.author_id, {
    type: 'fret_offer_received',
    title,
    body,
    href,
  }).catch(() => {});

  if (emailTarget) {
    await sendMail({
      to: emailTarget,
      subject: title,
      html: [
        '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">',
        '<p>Bonjour ' + escapeHtml(requestRow.author_name || 'Bonjour') + ',</p>',
        '<p>Vous avez reçu une nouvelle offre pour votre demande Envoi &amp; Livraison.</p>',
        '<div style="border:1px solid #dbeafe;border-radius:16px;padding:16px 18px;background:#f8fafc;">',
        '<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;">Offre re�ue</p>',
        '<p style="margin:0;font-size:18px;font-weight:700;">' + escapeHtml(transporterName) + '</p>',
        '<p style="margin:8px 0 0;">Prix propos� : ' + escapeHtml(formatMoney(offerRow.amount_xpf)) + '</p>',
        '<p style="margin:0;">Prise en charge : ' + escapeHtml(pickupLabel) + ' � ' + escapeHtml(offerRow.pickup_slot_label || 'Cr�neau � confirmer') + '</p>',
        '<p style="margin:0;">Vous pouvez comparer les offres et choisir librement le transporteur.</p>',
        '</div>',
        '<p style="margin-top:16px;"><a href="' + href + '" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0a7ea4;color:#fff;text-decoration:none;font-weight:700;">Voir les offres</a></p>',
        '</div>',
      ].join(''),
    }).catch(() => {});
  }

  if (phoneTarget) {
    await sendSms({
      to: phoneTarget,
      body: 'Nouvelle offre reçue pour votre demande Envoi & Livraison : ' + transporterName + ' propose ' + formatMoney(offerRow.amount_xpf) + ' pour le ' + pickupLabel + '. Vous pouvez comparer les offres et choisir librement le transporteur.',
    }).catch(() => {});
  }
}

async function notifySelectionOutcome(requestRow, selectedOffer, rejectedOffers = [], mode = 'manual') {
  const label = `${requestRow.departure_commune_name || requestRow.departure} → ${requestRow.destination_commune_name || requestRow.destination}`;
  const selectedTransporter = selectedOffer.transporter;
  const selectedName = selectedTransporter.display_name || selectedTransporter.company_name || 'Transporteur';
  const requesterEmail = requestRow.contact_email || requestRow.author_email || null;
  const requesterPhone = requestRow.contact_phone || requestRow.author_phone || null;
  const transporterEmail = selectedTransporter.email || null;
  const transporterPhone = selectedTransporter.telephone || selectedTransporter.pro_phone || null;
  const requestDate = formatDateLabel(selectedOffer.pickup_date);

  const requesterMessage = `Votre transport est confirmé avec ${selectedName}. Prise en charge le ${requestDate} depuis ${requestRow.departure_commune_name || requestRow.departure}. Prix convenu : ${formatMoney(selectedOffer.amount_xpf)}. Contact : ${transporterPhone || 'Non renseigné'}`;
  const transporterMessage = `Vous avez été sélectionné pour un transport ${label} le ${requestDate}. Contact demandeur : ${requesterPhone || requesterEmail || 'Non renseigné'}`;

  await createNotification(requestRow.author_id, {
    type: 'fret_request_confirmed',
    title: 'Votre transport est confirmé',
    body: requesterMessage,
    href: `${getBaseUrl()}/envoi-livraison`,
  }).catch(() => {});

  await createNotification(selectedTransporter.user_id, {
    type: 'fret_offer_selected',
    title: 'Vous avez été sélectionné',
    body: transporterMessage,
    href: `${getBaseUrl()}/pro/dashboard/envoi-livraison`,
  }).catch(() => {});

  if (requesterEmail) {
    await sendMail({
      to: requesterEmail,
      subject: 'Votre transport est confirmé',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <p>Bonjour ${escapeHtml(requestRow.author_name || 'Bonjour')},</p>
          <p>Votre transport est confirmé avec <strong>${escapeHtml(selectedName)}</strong>.</p>
          <div style="border:1px solid #dbeafe;border-radius:16px;padding:16px 18px;background:#f8fafc;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;">Détails</p>
            <p style="margin:0;">Trajet : ${escapeHtml(label)}</p>
            <p style="margin:0;">Prise en charge : ${escapeHtml(requestDate)}</p>
            <p style="margin:0;">Prix convenu : ${escapeHtml(formatMoney(selectedOffer.amount_xpf))}</p>
            <p style="margin:0;">Contact transporteur : ${escapeHtml(transporterPhone || selectedTransporter.email || 'Non renseigné')}</p>
          </div>
        </div>
      `,
    }).catch(() => {});
  }

  if (requesterPhone) {
    await sendSms({
      to: requesterPhone,
      body: requesterMessage,
    }).catch(() => {});
  }

  if (transporterEmail) {
    await sendMail({
      to: transporterEmail,
      subject: 'Vous avez été sélectionné pour un transport',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <p>Bonjour ${escapeHtml(formatUserName(selectedTransporter.prenom, selectedTransporter.nom))},</p>
          <p>Vous avez été sélectionné pour un transport Envoi &amp; Livraison.</p>
          <div style="border:1px solid #dbeafe;border-radius:16px;padding:16px 18px;background:#f8fafc;">
            <p style="margin:0;">Trajet : ${escapeHtml(label)}</p>
            <p style="margin:0;">Prise en charge : ${escapeHtml(requestDate)}</p>
            <p style="margin:0;">Contact demandeur : ${escapeHtml(requesterPhone || requesterEmail || 'Non renseigné')}</p>
            <p style="margin:0;">Prix convenu : ${escapeHtml(formatMoney(selectedOffer.amount_xpf))}</p>
          </div>
          <p style="margin-top:16px;">
            <a href="${getBaseUrl()}/pro/dashboard/envoi-livraison" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0a7ea4;color:#fff;text-decoration:none;font-weight:700;">Ouvrir le dashboard</a>
          </p>
        </div>
      `,
    }).catch(() => {});
  }

  if (transporterPhone) {
    await sendSms({
      to: transporterPhone,
      body: transporterMessage,
    }).catch(() => {});
  }

  if (rejectedOffers.length) {
    await Promise.allSettled(rejectedOffers.map(async (offer) => {
      await createNotification(offer.transporter.user_id, {
        type: 'fret_offer_rejected',
        title: 'Cette demande a été attribuée à un autre transporteur',
        body: `La demande ${label} a été attribuée à un autre transporteur.`,
        href: `${getBaseUrl()}/pro/dashboard/envoi-livraison`,
      }).catch(() => {});

      if (offer.transporter.email) {
        await sendMail({
          to: offer.transporter.email,
          subject: 'Demande Envoi & Livraison attribuée à un autre transporteur',
          html: `
            <p>Bonjour ${escapeHtml(formatUserName(offer.transporter.prenom, offer.transporter.nom))},</p>
            <p>Cette demande a été attribuée à un autre transporteur.</p>
          `,
        }).catch(() => {});
      }

      if (offer.transporter.telephone || offer.transporter.pro_phone) {
        await sendSms({
          to: offer.transporter.telephone || offer.transporter.pro_phone,
          body: `Kalico Envoi & Livraison : la demande ${label} a été attribuée à un autre transporteur.`,
        }).catch(() => {});
      }
    }));
  }

  await sendPushToUser(requestRow.author_id, {
    title: 'Votre transport est confirmé',
    body: requesterMessage,
    data: { type: `fret_request_${mode === 'auto' ? 'auto_selected' : 'selected'}`, request_id: requestRow.id },
  }).catch(() => {});

  await sendPushToUser(selectedTransporter.user_id, {
    title: 'Vous avez été sélectionné',
    body: transporterMessage,
    data: { type: 'fret_offer_selected', request_id: requestRow.id, offer_id: selectedOffer.id },
  }).catch(() => {});

  if (rejectedOffers.length) {
    await sendPushToUsers(
      rejectedOffers.map((offer) => offer.transporter.user_id),
      {
        title: 'Demande Envoi & Livraison attribuée',
        body: 'Cette demande a été attribuée à un autre transporteur.',
        data: { type: 'fret_offer_rejected', request_id: requestRow.id },
      }
    ).catch(() => {});
  }
}

function computeOfferScore(amountXpf, minAmountXpf, maxAmountXpf, transporterRating) {
  const ratingScore = Math.max(0, Math.min(5, Number(transporterRating || 0))) / 5;
  const priceScore = maxAmountXpf <= minAmountXpf
    ? 1
    : 1 - ((Number(amountXpf) - minAmountXpf) / (maxAmountXpf - minAmountXpf));
  const normalizedPrice = Math.max(0, Math.min(1, priceScore));
  return (ratingScore * 0.6) + (normalizedPrice * 0.4);
}

async function createFretRequest({ user, payload }) {
  return withTransaction(async (client) => {
    const communeRes = await client.query(
      `SELECT id, name, slug
       FROM communes
       WHERE id = ANY($1::int[])`,
      [[payload.departure_commune_id, payload.destination_commune_id].map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)]
    );
    const communeMap = new Map(communeRes.rows.map((row) => [Number(row.id), row]));

    const departure = communeMap.get(Number(payload.departure_commune_id));
    const destination = communeMap.get(Number(payload.destination_commune_id));
    if (!departure || !destination) {
      const error = new Error('Commune inconnue.');
      error.status = 400;
      throw error;
    }

    const serviceType = normalizeServiceType(payload.service_type);
    const estimate = estimateFreightQuote({
      departureSlug: departure.slug,
      destinationSlug: destination.slug,
      volumeBucket: payload.volume_bucket,
      weightBucket: payload.weight_bucket,
      urgency: payload.urgency,
    });

    const contactEmail = String(payload.contact_email || user?.email || '').trim();
    const contactPhone = String(payload.contact_phone || user?.telephone || '').trim();
    const requestInsert = await client.query(
      `INSERT INTO delivery_requests (
         author_id, service_type, departure, destination, departure_commune_id, destination_commune_id,
         cargo_type, type_marchandise, poids, fragile, volume, etage_depart, etage_arrivee, manutention, nb_pieces,
         volume_bucket, weight_bucket, urgency, description,
         budget_max_xpf, contact_email, contact_phone,
         status, estimated_min_xpf, estimated_max_xpf,
         quote_amount_xpf, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
               $16, $17, $18, $19, $20, $21, $22,
               'open', $23, $24, $25, NOW())
       RETURNING *`,
      [
        user.id,
        serviceType,
        departure.name,
        destination.name,
        departure.id,
        destination.id,
        payload.cargo_type,
        payload.type_marchandise || payload.cargo_type || null,
        payload.poids || null,
        Boolean(payload.fragile),
        payload.volume || null,
        payload.etage_depart || null,
        payload.etage_arrivee || null,
        Boolean(payload.manutention),
        payload.nb_pieces || null,
        payload.volume_bucket,
        payload.weight_bucket,
        payload.urgency,
        payload.description || '',
        payload.budget_max_xpf == null ? null : Number(payload.budget_max_xpf),
        contactEmail || null,
        contactPhone || null,
        estimate.estimated_min_xpf,
        estimate.estimated_max_xpf,
        estimate.recommended_total_xpf,
      ]
    );

    const requestRow = requestInsert.rows[0];
    const transporters = await loadEligibleTransporters(client, serviceType);
    await notifyTransportersOfRequest({
      ...requestRow,
      service_type: serviceType,
      departure_commune_name: departure.name,
      destination_commune_name: destination.name,
      volume_label: mapVolumeBucket(payload.volume_bucket)?.label || payload.volume_bucket,
      weight_label: mapWeightBucket(payload.weight_bucket)?.label || payload.weight_bucket,
      urgency_label: mapUrgencyBucket(payload.urgency)?.label || payload.urgency,
      budget_max_xpf: payload.budget_max_xpf == null ? null : Number(payload.budget_max_xpf),
    }, estimate, transporters);

    return {
      request: buildRequestPayload({
        ...requestRow,
        departure_commune_name: departure.name,
        departure_commune_slug: departure.slug,
        destination_commune_name: destination.name,
        destination_commune_slug: destination.slug,
        author_prenom: user.prenom,
        author_nom: user.nom,
        author_email: contactEmail,
        author_phone: contactPhone,
      }, []),
      estimate,
      transporters_notified: transporters.length,
    };
  });
}

async function listMyFretRequests(userId) {
  const result = await query(
    `SELECT
       fr.*,
       cd.name AS departure_commune_name,
       cd.slug AS departure_commune_slug,
       ca.name AS destination_commune_name,
       ca.slug AS destination_commune_slug,
       author.prenom AS author_prenom,
       author.nom AS author_nom,
       author.email AS author_email,
       author.telephone AS author_phone,
       selected.company_name AS selected_company_name,
       selected_user.prenom AS selected_prenom,
       selected_user.nom AS selected_nom,
       selected_user.email AS selected_email,
       selected_user.telephone AS selected_phone,
       selected_user.pro_phone AS selected_pro_phone,
       selected_user.pro_company_name AS selected_pro_company_name
     FROM delivery_requests fr
     LEFT JOIN communes cd ON cd.id = fr.departure_commune_id
     LEFT JOIN communes ca ON ca.id = fr.destination_commune_id
     LEFT JOIN users author ON author.id = fr.author_id
     LEFT JOIN pro_transporters selected ON selected.id = fr.selected_transporter_id
     LEFT JOIN users selected_user ON selected_user.id = selected.user_id
     WHERE fr.author_id = $1
     ORDER BY fr.created_at DESC
     LIMIT 50`,
    [userId]
  );

  const requestRows = result.rows;
  const offers = await loadRequestOffers(
    { query: (...args) => query(...args) },
    requestRows.map((row) => row.id)
  ).catch(() => []);

  return requestRows.map((row) => buildRequestPayload(row, offers));
}

async function loadTransporterProfile(client, userId) {
  const result = await client.query(
    `SELECT
       pt.*,
       u.prenom,
       u.nom,
       u.email,
       u.telephone,
       u.expo_push_token,
       u.pro_phone,
       u.pro_commune,
       u.pro_company_name,
       u.pro_logo_url
     FROM pro_transporters pt
     JOIN users u ON u.id = pt.user_id
     WHERE pt.user_id = $1
       AND (
         COALESCE(pt.specialite_colis, FALSE) = TRUE
         OR COALESCE(pt.specialite_demenagement, FALSE) = TRUE
         OR COALESCE(pt.specialite_fret_pro, FALSE) = TRUE
         OR COALESCE(pt.has_fret, FALSE) = TRUE
       )
       AND pt.is_verified = TRUE
       AND pt.is_available = TRUE
       AND u.is_pro = TRUE
       AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
}

async function listTransporterDashboard(userId) {
  return withTransaction(async (client) => {
    const transporter = await loadTransporterProfile(client, userId);
    if (!transporter) {
      const error = new Error('Espace réservé aux transporteurs Envoi & Livraison actifs.');
      error.status = 403;
      throw error;
    }

    const availableRequestsRes = await client.query(
      `SELECT
         fr.*,
         cd.name AS departure_commune_name,
         cd.slug AS departure_commune_slug,
         ca.name AS destination_commune_name,
         ca.slug AS destination_commune_slug,
         requester.prenom AS author_prenom,
         requester.nom AS author_nom,
         requester.email AS author_email,
         requester.telephone AS author_phone,
         my_offer.id AS my_offer_id,
         my_offer.amount_xpf AS my_offer_amount_xpf,
         my_offer.pickup_date AS my_offer_pickup_date,
         my_offer.pickup_slot AS my_offer_pickup_slot,
         my_offer.status AS my_offer_status,
         my_offer.message AS my_offer_message,
         my_offer.created_at AS my_offer_created_at
       FROM delivery_requests fr
       LEFT JOIN communes cd ON cd.id = fr.departure_commune_id
       LEFT JOIN communes ca ON ca.id = fr.destination_commune_id
       LEFT JOIN users requester ON requester.id = fr.author_id
       LEFT JOIN delivery_offers my_offer
         ON my_offer.request_id = fr.id
        AND my_offer.transporter_user_id = $1
       WHERE fr.status = 'open'
       ORDER BY fr.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const offersRes = await client.query(
      `SELECT
         o.*,
         fr.departure AS request_departure,
         fr.destination AS request_destination,
         fr.response_deadline_at,
         fr.status AS request_status,
         fr.selected_offer_id,
         fr.selected_transporter_id,
         fr.confirmed_at,
         fr.delivered_at,
         cd.name AS departure_commune_name,
         ca.name AS destination_commune_name
       FROM delivery_offers o
       JOIN delivery_requests fr ON fr.id = o.request_id
       LEFT JOIN communes cd ON cd.id = fr.departure_commune_id
       LEFT JOIN communes ca ON ca.id = fr.destination_commune_id
       WHERE o.transporter_user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const confirmedRes = await client.query(
      `SELECT
         fr.*,
         cd.name AS departure_commune_name,
         ca.name AS destination_commune_name,
         fo.amount_xpf AS offer_amount_xpf,
         fo.pickup_date AS offer_pickup_date,
         fo.pickup_slot AS offer_pickup_slot,
         fo.status AS offer_status,
         requester.prenom AS author_prenom,
         requester.nom AS author_nom,
         requester.email AS author_email,
         requester.telephone AS author_phone
       FROM delivery_requests fr
       JOIN delivery_offers fo ON fo.id = fr.selected_offer_id
       LEFT JOIN communes cd ON cd.id = fr.departure_commune_id
       LEFT JOIN communes ca ON ca.id = fr.destination_commune_id
       LEFT JOIN users requester ON requester.id = fr.author_id
       WHERE fr.selected_transporter_id = (
         SELECT pt.id FROM pro_transporters pt WHERE pt.user_id = $1 LIMIT 1
       )
       ORDER BY COALESCE(fr.selected_at, fr.created_at) DESC
       LIMIT 50`,
      [userId]
    );

    const canHandleService = (serviceType) => {
      const normalized = normalizeServiceType(serviceType);
      if (normalized === 'colis') return Boolean(transporter.specialite_colis);
      if (normalized === 'demenagement') return Boolean(transporter.specialite_demenagement);
      return Boolean(transporter.specialite_fret_pro || transporter.has_fret);
    };

    const availableRequests = availableRequestsRes.rows
      .filter((row) => canHandleService(row.service_type))
      .map((row) => buildRequestPayload(row, []));
    const myOffers = offersRes.rows.map(mapOfferPayload);
    const confirmedTransports = confirmedRes.rows.map((row) => buildRequestPayload({
      ...row,
      selected_company_name: transporter.company_name,
      selected_prenom: transporter.prenom,
      selected_nom: transporter.nom,
      selected_email: transporter.email,
      selected_phone: transporter.telephone,
      selected_pro_phone: transporter.pro_phone,
      selected_pro_company_name: transporter.pro_company_name,
    }, []))
      .map((request) => ({
        ...request,
        selected_offer: myOffers.find((offer) => Number(offer.request_id) === Number(request.id)) || null,
        status_label: mapRequestStatusLabel(request),
      }));

    return {
      transporter: {
        id: Number(transporter.id),
        user_id: Number(transporter.user_id),
        company_name: transporter.company_name,
        display_name: transporter.pro_company_name || transporter.company_name,
        rating: transporter.rating == null ? 0 : Number(transporter.rating),
        is_verified: Boolean(transporter.is_verified),
        pro_commune: transporter.pro_commune || null,
        pro_phone: transporter.pro_phone || null,
        pro_logo_url: transporter.pro_logo_url || null,
        service_zones: Array.isArray(transporter.service_zones) ? transporter.service_zones : [],
        fret_description: transporter.fret_description || null,
        fret_vehicle_type: transporter.fret_vehicle_type || null,
        fret_volume_m3: transporter.fret_volume_m3 == null ? null : Number(transporter.fret_volume_m3),
        fret_max_weight_kg: transporter.fret_max_weight_kg == null ? null : Number(transporter.fret_max_weight_kg),
        fret_price_per_m3_xpf: transporter.fret_price_per_m3_xpf == null ? null : Number(transporter.fret_price_per_m3_xpf),
      },
      available_requests: availableRequests.map((request) => ({
        ...request,
        my_offer: myOffers.find((offer) => Number(offer.request_id) === Number(request.id)) || null,
      })),
      my_offers: myOffers,
      confirmed_transports: confirmedTransports.map((request) => ({
        ...request,
        status_label: mapRequestStatusLabel(request),
        selected_offer: {
          amount_xpf: request.offer_amount_xpf == null ? null : Number(request.offer_amount_xpf),
          pickup_date: request.offer_pickup_date || null,
          pickup_slot: request.offer_pickup_slot || null,
          status: request.offer_status || null,
        },
      })),
    };
  });
}

async function submitFretOffer({ userId, requestId, payload }) {
  return withTransaction(async (client) => {
    const transporter = await loadTransporterProfile(client, userId);
    if (!transporter) {
      const error = new Error('Espace réservé aux transporteurs Envoi & Livraison actifs.');
      error.status = 403;
      throw error;
    }

    const requestRow = await loadRequestById(client, requestId);
    if (!requestRow) {
      const error = new Error('Demande introuvable.');
      error.status = 404;
      throw error;
    }
    if (requestRow.status !== 'open') {
      const error = new Error('Cette demande n’est plus ouverte.');
      error.status = 409;
      throw error;
    }

    const existing = await client.query(
      `SELECT id
       FROM delivery_offers
       WHERE request_id = $1 AND transporter_user_id = $2
       LIMIT 1`,
      [requestId, userId]
    );
    if (existing.rows[0]) {
      const error = new Error('Vous avez déjà soumis une offre pour cette demande.');
      error.status = 409;
      throw error;
    }

    const insert = await client.query(
      `INSERT INTO delivery_offers (
         request_id, transporter_id, transporter_user_id,
         amount_xpf, pickup_date, pickup_slot, message,
         status, score, responded_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW())
       RETURNING *`,
      [
        requestId,
        transporter.id,
        userId,
        Number(payload.amount_xpf),
        payload.pickup_date,
        payload.pickup_slot,
        payload.message || null,
        null,
      ]
    );

    await client.query(
      `UPDATE delivery_requests
       SET status = 'open',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [requestId]
    );

    const offerRow = insert.rows[0];
    const requesterOffer = await loadRequestById(client, requestId);
    const offerPayload = mapOfferPayload({
      ...offerRow,
      company_name: transporter.company_name,
      rating: transporter.rating,
      is_verified: transporter.is_verified,
      pro_phone: transporter.pro_phone,
      pro_commune: transporter.pro_commune,
      prenom: transporter.prenom,
      nom: transporter.nom,
      email: transporter.email,
      telephone: transporter.telephone,
      pro_company_name: transporter.pro_company_name,
      pro_logo_url: transporter.pro_logo_url,
    });
    await notifyRequesterOfferReceived(requesterOffer, offerPayload, transporter);

    return {
      request: buildRequestPayload(requesterOffer, [offerRow]),
      offer: offerPayload,
    };
  });
}

async function selectFretOffer({ userId, requestId, offerId, mode = 'manual' }) {
  return withTransaction(async (client) => {
    const requestRow = await loadRequestById(client, requestId);
    if (!requestRow) {
      const error = new Error('Demande introuvable.');
      error.status = 404;
      throw error;
    }
    if (Number(requestRow.author_id) !== Number(userId)) {
      const error = new Error('Seul le demandeur peut choisir une offre.');
      error.status = 403;
      throw error;
    }

    const offerRes = await client.query(
      `SELECT
         o.*,
         pt.company_name,
         pt.rating,
         pt.is_verified,
         pt.pro_phone,
         pt.pro_commune,
         pt.vehicle_description,
         u.prenom,
         u.nom,
         u.email,
         u.telephone,
         u.pro_company_name,
         u.pro_logo_url
       FROM delivery_offers o
       JOIN pro_transporters pt ON pt.id = o.transporter_id
       JOIN users u ON u.id = pt.user_id
       WHERE o.id = $1 AND o.request_id = $2
       LIMIT 1`,
      [offerId, requestId]
    );

    const selectedOfferRow = offerRes.rows[0];
    if (!selectedOfferRow) {
      const error = new Error('Offre introuvable.');
      error.status = 404;
      throw error;
    }

    const allOffersRes = await client.query(
      `SELECT
         o.*,
         pt.company_name,
         pt.rating,
         pt.is_verified,
         pt.pro_phone,
         pt.pro_commune,
         pt.vehicle_description,
         u.prenom,
         u.nom,
         u.email,
         u.telephone,
         u.pro_company_name,
         u.pro_logo_url
       FROM delivery_offers o
       JOIN pro_transporters pt ON pt.id = o.transporter_id
       JOIN users u ON u.id = pt.user_id
       WHERE o.request_id = $1
       ORDER BY o.created_at ASC`,
      [requestId]
    );

    const allOffers = allOffersRes.rows.map(mapOfferPayload);
    const selectedOffer = mapOfferPayload(selectedOfferRow);
    const rejectedOffers = allOffers.filter((offer) => Number(offer.id) !== Number(selectedOffer.id));

    await client.query(
      `UPDATE delivery_offers
       SET status = CASE WHEN id = $2 THEN 'selected' ELSE 'rejected' END,
           selected_at = CASE WHEN id = $2 THEN NOW() ELSE selected_at END,
           updated_at = NOW()
       WHERE request_id = $1`,
      [requestId, offerId]
    );

    await client.query(
      `UPDATE delivery_requests
       SET selected_offer_id = $2,
           selected_transporter_id = $3,
           selected_at = NOW(),
           selection_method = $4,
           status = 'closed',
           confirmed_at = COALESCE(confirmed_at, NOW()),
           updated_at = NOW()
       WHERE id = $1`,
      [requestId, offerId, selectedOffer.transporter_id, mode]
    );

    const refreshedRequest = await loadRequestById(client, requestId);
    const selectedOfferFull = {
      ...selectedOffer,
      status: 'selected',
      status_label: 'Sélectionné',
    };

    await notifySelectionOutcome(refreshedRequest, selectedOfferFull, rejectedOffers, mode);

    return {
      request: buildRequestPayload(refreshedRequest, allOffers),
      selected_offer: selectedOfferFull,
      rejected_offers: rejectedOffers,
    };
  });
}

async function markFretDelivered({ userId, requestId }) {
  return withTransaction(async (client) => {
    const transporter = await loadTransporterProfile(client, userId);
    if (!transporter) {
      const error = new Error('Espace réservé aux transporteurs Envoi & Livraison actifs.');
      error.status = 403;
      throw error;
    }

    const requestRow = await loadRequestById(client, requestId);
    if (!requestRow) {
      const error = new Error('Demande introuvable.');
      error.status = 404;
      throw error;
    }
    if (Number(requestRow.selected_transporter_id) !== Number(transporter.id)) {
      const error = new Error('Vous n’êtes pas assigné à ce transport.');
      error.status = 403;
      throw error;
    }

    await client.query(
      `UPDATE delivery_requests
       SET status = 'delivered',
           delivered_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [requestId]
    );

    await client.query(
      `UPDATE delivery_offers
       SET status = CASE WHEN id = $2 THEN 'selected' ELSE status END,
           updated_at = NOW()
       WHERE request_id = $1`,
      [requestId, requestRow.selected_offer_id]
    );

    const refreshedRequest = await loadRequestById(client, requestId);

    if (refreshedRequest?.author_id) {
      await createNotification(refreshedRequest.author_id, {
        type: 'fret_request_delivered',
        title: 'Transport livré',
        body: `Votre transport ${refreshedRequest.departure_commune_name || refreshedRequest.departure} → ${refreshedRequest.destination_commune_name || refreshedRequest.destination} a été marqué comme livré.`,
        href: `${getBaseUrl()}/envoi-livraison`,
      }).catch(() => {});
    }

    if (transporter?.user_id) {
      await createNotification(transporter.user_id, {
        type: 'fret_transport_delivered',
        title: 'Transport marqué comme livré',
        body: `Le transport ${refreshedRequest.departure_commune_name || refreshedRequest.departure} → ${refreshedRequest.destination_commune_name || refreshedRequest.destination} est passé en livré.`,
        href: `${getBaseUrl()}/pro/dashboard/envoi-livraison`,
      }).catch(() => {});
    }

    return {
      request: buildRequestPayload(refreshedRequest, []),
    };
  });
}

async function withdrawMyFretOffer({ userId, requestId }) {
  return withTransaction(async (client) => {
    const transporter = await loadTransporterProfile(client, userId);
    if (!transporter) {
      const error = new Error('Espace réservé aux transporteurs Envoi & Livraison actifs.');
      error.status = 403;
      throw error;
    }

    const requestRow = await loadRequestById(client, requestId);
    if (!requestRow) {
      const error = new Error('Demande introuvable.');
      error.status = 404;
      throw error;
    }
    if (requestRow.status === 'closed') {
      const error = new Error('Cette demande est déjà fermée.');
      error.status = 409;
      throw error;
    }

    const offerRes = await client.query(
      `SELECT id
       FROM delivery_offers
       WHERE request_id = $1
         AND transporter_user_id = $2
       LIMIT 1`,
      [requestId, userId]
    );

    const offerRow = offerRes.rows[0];
    if (!offerRow) {
      const error = new Error('Offre introuvable.');
      error.status = 404;
      throw error;
    }

    await client.query(
      `UPDATE delivery_offers
       SET status = 'withdrawn',
           updated_at = NOW()
       WHERE id = $1`,
      [offerRow.id]
    );

    return { ok: true };
  });
}

async function autoResolveExpiredFretRequests() {
  return {
    auto_selected: 0,
    expired_without_offer: 0,
  };
}

module.exports = {
  sendSms,
  VOLUME_BUCKETS,
  WEIGHT_BUCKETS,
  URGENCY_BUCKETS,
  PICKUP_SLOT_LABELS,
  estimateFreightQuote,
  loadRequestById,
  loadRequestOffers,
  createFretRequest,
  listMyFretRequests,
  listTransporterDashboard,
  submitFretOffer,
  selectFretOffer,
  markFretDelivered,
  withdrawMyFretOffer,
  autoResolveExpiredFretRequests,
  mapRequestStatusLabel,
  mapOfferStatusLabel,
};



