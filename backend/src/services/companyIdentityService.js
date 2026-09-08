'use strict';

function normalizeRidet(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
}

function identityError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function bindVerifiedCompanyIdentity(client, { userId, ridet, legalName }) {
  const normalizedRidet = normalizeRidet(ridet);
  if (!normalizedRidet) {
    throw identityError(400, 'Le numéro RIDET doit contenir exactement 10 chiffres.');
  }
  const normalizedName = String(legalName || '').trim();
  if (normalizedName.length < 2) {
    throw identityError(400, "Le nom légal de l'entreprise est requis.");
  }
  const rid = normalizedRidet.slice(0, 7);

  const current = await client.query(
    `SELECT c.id, c.rid
       FROM company_members cm
       JOIN companies c ON c.id = cm.company_id
      WHERE cm.user_id = $1
      FOR UPDATE OF cm, c`,
    [userId],
  );
  if (current.rows[0] && current.rows[0].rid !== rid) {
    throw identityError(409, 'Ce compte est déjà rattaché à une autre entreprise vérifiée.');
  }

  const company = await client.query(
    `INSERT INTO companies (rid, ridet, legal_name, ridet_verified_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (rid) DO UPDATE
       SET ridet_verified_at = COALESCE(companies.ridet_verified_at, NOW()),
           updated_at = NOW()
     RETURNING id, rid, ridet, legal_name, ridet_verified_at`,
    [rid, normalizedRidet, normalizedName],
  );

  const membership = await client.query(
    `INSERT INTO company_members (company_id, user_id, role)
     VALUES ($1, $2, 'owner')
     ON CONFLICT (user_id) DO NOTHING
     RETURNING company_id`,
    [company.rows[0].id, userId],
  );
  if (!membership.rows[0] && !current.rows[0]) {
    const raced = await client.query(
      'SELECT company_id FROM company_members WHERE user_id = $1',
      [userId],
    );
    if (raced.rows[0]?.company_id !== company.rows[0].id) {
      throw identityError(409, 'Ce compte est déjà rattaché à une autre entreprise vérifiée.');
    }
  }

  return company.rows[0];
}

module.exports = { normalizeRidet, bindVerifiedCompanyIdentity };
