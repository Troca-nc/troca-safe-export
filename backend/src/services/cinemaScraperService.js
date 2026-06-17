'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const { query, withTransaction } = require('../config/database');
const { logger } = require('../utils/logger');
const { CINEMAS } = require('../config/cinemaConfig');

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
}

function findCommuneId(communeName) {
  if (!communeName) return Promise.resolve(null);
  return query(
    `SELECT id FROM communes WHERE LOWER(name) = LOWER($1) OR LOWER(slug) = LOWER($2) LIMIT 1`,
    [communeName, slugify(communeName)]
  ).then((result) => result.rows[0]?.id || null).catch(() => null);
}

function cleanPrice(value) {
  const digits = String(value ?? '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  const amount = Number(digits);
  return Number.isFinite(amount) ? amount : null;
}

function extractSessions(html, cinema) {
  const $ = cheerio.load(html);
  const sessions = [];

  const nodes = [
    '[data-session]',
    '[data-showtime]',
    '.session',
    '.showtime',
    '.movie',
    'article',
    'li',
  ];

  $(nodes.join(',')).each((_, element) => {
    const node = $(element);
    const title = node.attr('data-title')
      || node.attr('data-movie-title')
      || node.find('[data-title], .title, .movie-title, h1, h2, h3').first().text()
      || node.text();
    const movieTitle = String(title || '').trim();
    if (movieTitle.length < 2) return;

    const rawDate = node.attr('data-date') || node.find('[data-date]').attr('data-date') || '';
    const rawTime = node.attr('data-time') || node.find('[data-time]').attr('data-time') || '';
    const dateMatch = String(rawDate || node.text()).match(/(\d{4}-\d{2}-\d{2})/);
    const timeMatch = String(rawTime || node.text()).match(/(\d{1,2}:\d{2})/);
    const sessionDate = dateMatch ? dateMatch[1] : null;
    const sessionTime = timeMatch ? timeMatch[1].padStart(5, '0') : null;
    if (!sessionDate || !sessionTime) return;

    const version = String(node.attr('data-version') || node.find('[data-version]').attr('data-version') || node.text())
      .match(/\b(VO|VF|VOST|VOSTFR|VF3D|3D)\b/i)?.[1] || 'VF';
    const is3d = /3D/i.test(node.text()) || /3D/i.test(String(node.attr('data-format') || ''));
    const bookingUrl = node.find('a[href*="ticket"], a[href*="billet"], a[href*="reservation"]').first().attr('href')
      || node.attr('data-booking-url')
      || cinema.website
      || null;

    sessions.push({
      movie_title: movieTitle,
      movie_poster_url: node.find('img').first().attr('src') || node.attr('data-poster') || null,
      session_date: sessionDate,
      session_time: sessionTime,
      room: node.attr('data-room') || node.find('[data-room]').attr('data-room') || null,
      version: String(version || 'VF').toUpperCase(),
      is_3d: Boolean(is3d),
      price_normal_xpf: cleanPrice(node.attr('data-price') || node.text()),
      price_reduced_xpf: cleanPrice(node.attr('data-price-reduced') || ''),
      booking_url: bookingUrl ? String(bookingUrl) : null,
    });
  });

  if (!sessions.length) {
    $('script[type="application/ld+json"]').each((_, script) => {
      const raw = $(script).text();
      if (!raw) return;
      try {
        const json = JSON.parse(raw);
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (String(item?.['@type'] || '').toLowerCase() !== 'event') continue;
          const title = item.name || item.workFeatured?.name || item.headline;
          const startDate = item.startDate ? new Date(item.startDate) : null;
          if (!title || !startDate || Number.isNaN(startDate.getTime())) continue;
          sessions.push({
            movie_title: String(title),
            movie_poster_url: item.image || null,
            session_date: startDate.toISOString().slice(0, 10),
            session_time: startDate.toISOString().slice(11, 16),
            room: item.location?.name || null,
            version: item.inLanguage || 'VF',
            is_3d: false,
            price_normal_xpf: cleanPrice(item.offers?.price),
            price_reduced_xpf: null,
            booking_url: item.url || cinema.website || null,
          });
        }
      } catch {
        // Ignore malformed structured data
      }
    });
  }

  return sessions.filter((session, index, array) => {
    const key = `${normalizeText(session.movie_title)}|${session.session_date}|${session.session_time}`;
    return array.findIndex((item) => `${normalizeText(item.movie_title)}|${item.session_date}|${item.session_time}` === key) === index;
  });
}

async function scrapeMovieSessions(cinema) {
  if (!cinema || cinema.scrape_type !== 'html' || !cinema.scrape_url) {
    return [];
  }

  try {
    const response = await axios.get(cinema.scrape_url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'KalicoCinemaBot/1.0 (+https://kalico.nc)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    return extractSessions(response.data, cinema);
  } catch (error) {
    logger.warn('cinema_scrape_failed', {
      cinema_id: cinema.id,
      cinema_name: cinema.name,
      error: error?.message || String(error),
    });
    return [];
  }
}

async function saveOrUpdateSessions(sessions, cinema) {
  const summary = { imported: 0, updated: 0, errors: 0 };
  const communeId = await findCommuneId(cinema.commune);

  for (const session of sessions) {
    try {
      const externalId = `${cinema.id}-${slugify(session.movie_title)}-${session.session_date}-${session.session_time}`;
      const existing = await query(`SELECT id FROM events WHERE external_id = $1 LIMIT 1`, [externalId]);
      const eventPayload = {
        title: `Film : ${session.movie_title}`,
        description: `${cinema.name} · ${session.room || 'Séance cinéma'} · ${session.version || 'VF'}`,
        venue_name: cinema.name,
        venue_address: cinema.address,
        commune_id: communeId,
        event_date: session.session_date,
        event_time: session.session_time,
        end_time: null,
        cover_image_url: session.movie_poster_url,
        photos: JSON.stringify(session.movie_poster_url ? [session.movie_poster_url] : []),
        category: 'cinema',
        status: 'published',
        has_ticketing: false,
        max_capacity: null,
        is_free: false,
        organizer_name: cinema.name,
        organizer_email: null,
        organizer_phone: null,
        booking_url: session.booking_url || cinema.website || null,
        room: session.room,
        version: session.version,
        is_3d: Boolean(session.is_3d),
        price_normal_xpf: session.price_normal_xpf,
        price_reduced_xpf: session.price_reduced_xpf,
        external_id: externalId,
      };

      if (existing.rows[0]) {
        await query(
          `UPDATE events
             SET title = $2,
                 description = $3,
                 venue_name = $4,
                 venue_address = $5,
                 commune_id = $6,
                 event_date = $7::date,
                 event_time = $8::time,
                 cover_image_url = $9,
                 photos = $10::jsonb,
                 status = $11,
                 booking_url = $12,
                 room = $13,
                 version = $14,
                 is_3d = $15,
                 price_normal_xpf = $16,
                 price_reduced_xpf = $17,
                 updated_at = NOW()
           WHERE id = $1`,
          [
            existing.rows[0].id,
            eventPayload.title,
            eventPayload.description,
            eventPayload.venue_name,
            eventPayload.venue_address,
            eventPayload.commune_id,
            eventPayload.event_date,
            eventPayload.event_time,
            eventPayload.cover_image_url,
            eventPayload.photos,
            eventPayload.status,
            eventPayload.booking_url,
            eventPayload.room,
            eventPayload.version,
            eventPayload.is_3d,
            eventPayload.price_normal_xpf,
            eventPayload.price_reduced_xpf,
          ]
        );
        summary.updated += 1;
        continue;
      }

      await query(
        `INSERT INTO events
           (title, description, venue_name, venue_address, commune_id, event_date, event_time, cover_image_url, photos,
            category, status, has_ticketing, max_capacity, is_free, organizer_name, organizer_email, organizer_phone,
            booking_url, room, version, is_3d, price_normal_xpf, price_reduced_xpf, external_id, organizer_id)
         VALUES
           ($1, $2, $3, $4, $5, $6::date, $7::time, $8, $9::jsonb,
            $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, NULL)`,
        [
          eventPayload.title,
          eventPayload.description,
          eventPayload.venue_name,
          eventPayload.venue_address,
          eventPayload.commune_id,
          eventPayload.event_date,
          eventPayload.event_time,
          eventPayload.cover_image_url,
          eventPayload.photos,
          eventPayload.category,
          eventPayload.status,
          eventPayload.has_ticketing,
          eventPayload.max_capacity,
          eventPayload.is_free,
          eventPayload.organizer_name,
          eventPayload.organizer_email,
          eventPayload.organizer_phone,
          eventPayload.booking_url,
          eventPayload.room,
          eventPayload.version,
          eventPayload.is_3d,
          eventPayload.price_normal_xpf,
          eventPayload.price_reduced_xpf,
          eventPayload.external_id,
        ]
      );
      summary.imported += 1;
    } catch (error) {
      summary.errors += 1;
      logger.warn('cinema_session_save_failed', {
        cinema_id: cinema.id,
        cinema_name: cinema.name,
        session: `${session.movie_title} ${session.session_date} ${session.session_time}`,
        error: error?.message || String(error),
      });
    }
  }

  return summary;
}

async function runCinemaScraper() {
  const report = [];
  for (const cinema of CINEMAS.filter((entry) => entry.active)) {
    try {
      const sessions = await scrapeMovieSessions(cinema);
      const summary = await saveOrUpdateSessions(sessions, cinema);
      report.push({
        cinema_id: cinema.id,
        cinema_name: cinema.name,
        sessions: sessions.length,
        ...summary,
      });
      logger.info('cinema_scraper_summary', {
        cinema_id: cinema.id,
        cinema_name: cinema.name,
        ...summary,
        sessions: sessions.length,
      });
    } catch (error) {
      report.push({
        cinema_id: cinema.id,
        cinema_name: cinema.name,
        sessions: 0,
        imported: 0,
        updated: 0,
        errors: 1,
      });
      logger.error('cinema_scraper_failed', {
        cinema_id: cinema.id,
        cinema_name: cinema.name,
        error: error?.message || String(error),
      });
    }
  }

  return report;
}

module.exports = {
  CINEMAS,
  extractSessions,
  scrapeMovieSessions,
  saveOrUpdateSessions,
  runCinemaScraper,
};
