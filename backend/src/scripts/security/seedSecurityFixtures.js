'use strict';

const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');
const { pool, withTransaction } = require('../../config/database');

const TEST_FLAG = 'KALICO_SECURITY_TEST_ONLY';
const TEST_PASSWORD = 'SecurityTest123!';
const TEST_MARKER = 'KALICO_TEST_ONLY';

function assertSafeEnvironment() {
  if (process.env.NODE_ENV !== 'test' || process.env[TEST_FLAG] !== 'true') {
    throw new Error('Security fixtures require NODE_ENV=test and KALICO_SECURITY_TEST_ONLY=true');
  }
  if (!String(process.env.DB_NAME || '').endsWith('_security_test')) {
    throw new Error('Refusing to seed a database whose name does not end with _security_test');
  }
  const root = path.resolve(process.env.STORAGE_LOCAL_PATH || '');
  if (root !== '/app/uploads' && !root.toLowerCase().includes('security')) {
    throw new Error('Refusing to write outside the security-test storage root');
  }
  return root;
}

async function writeFixture(root, relativePath, content) {
  const destination = path.resolve(root, relativePath);
  const prefix = `${root}${path.sep}`;
  if (!destination.startsWith(prefix)) throw new Error('Fixture path escaped storage root');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, content);
  return destination;
}

async function seedDatabase() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  return withTransaction(async (client) => {
    const users = {};
    for (const account of [
      ['a', 'security-a@invalid.example', false, false],
      ['b', 'security-b@invalid.example', false, false],
      ['c', 'security-c@invalid.example', false, false],
      ['proA', 'security-pro-a@invalid.example', true, false],
      ['proB', 'security-pro-b@invalid.example', true, false],
      ['admin', 'security-admin@invalid.example', true, true],
    ]) {
      const [key, email, isPro, isAdmin] = account;
      const result = await client.query(
        `INSERT INTO users (email, password_hash, prenom, nom, email_verified, is_pro, is_admin, pro_verified)
         VALUES ($1, $2, $3, 'Security', TRUE, $4, $5, $4)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [email, passwordHash, key, isPro, isAdmin]
      );
      users[key] = result.rows[0].id;
    }

    const existingListing = await client.query(
      `SELECT id FROM annonces WHERE titre = $1 ORDER BY id LIMIT 1`,
      [`${TEST_MARKER} listing`]
    );
    if (existingListing.rowCount) {
      return { users, listingId: existingListing.rows[0].id, reused: true };
    }

    const category = await client.query(`SELECT id FROM categories ORDER BY id LIMIT 1`);
    const listing = await client.query(
      `INSERT INTO annonces (user_id, category_id, titre, description, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
      [users.b, category.rows[0].id, `${TEST_MARKER} listing`, `${TEST_MARKER} description`]
    );
    const listingId = listing.rows[0].id;
    const image = await client.query(
      `INSERT INTO annonce_images (annonce_id, url, thumbnail_url, variants, is_cover)
       VALUES ($1, '', '', '{}'::jsonb, TRUE) RETURNING id`,
      [listingId]
    );
    const imageId = image.rows[0].id;
    await client.query(
      `UPDATE annonce_images SET url=$1::text, thumbnail_url=$2::text,
       variants=jsonb_build_object('original', jsonb_build_object('path', $3::text, 'url', $1::text)) WHERE id=$4`,
      [`/uploads/${imageId}`, `/uploads/${imageId}?w=400`, `listings/${listingId}/security-public.webp`, imageId]
    );

    const conversation = await client.query(
      `INSERT INTO conversations (annonce_id, buyer_id, seller_id) VALUES ($1,$2,$3) RETURNING id`,
      [listingId, users.a, users.b]
    );
    const convId = conversation.rows[0].id;
    await client.query(
      `INSERT INTO messages (conv_id, sender_id, type, photo_url) VALUES
       ($1,$2,'photo','/uploads/chat/security-a/security-photo.webp'),
       ($1,$2,'audio','/uploads/chat/security-a/security-audio.webm')`,
      [convId, users.a]
    );
    await client.query(
      `INSERT INTO messages (conv_id, sender_id, type, attachment_url, attachment_name, attachment_mime_type, attachment_size_bytes)
       VALUES ($1,$2,'document','/uploads/chat/security-a/security-document.pdf','security-document.pdf','application/pdf',32)`,
      [convId, users.a]
    );

    await client.query(
      `INSERT INTO pro_documents (pro_id, document_type, file_url, file_name, file_size, status)
       VALUES ($1,'extrait_ridet','/uploads/pro-documents/security-pro-a/security-ridet.pdf','security-ridet.pdf',32,'pending')`,
      [users.proA]
    );
    await client.query(
      `INSERT INTO import_jobs
       (pro_id, original_filename, stored_filename, file_path, file_url, mime_type, file_size_bytes, file_format)
       VALUES ($1,'security-import.csv','security-import.csv','/app/uploads/imports/security-import.csv',
       '/uploads/imports/security-import.csv','text/csv',32,'csv')`,
      [users.proA]
    );

    const event = await client.query(
      `INSERT INTO events (organizer_id,title,event_date,event_time,status,has_ticketing)
       VALUES ($1,$2,CURRENT_DATE + 7,'18:00','published',TRUE) RETURNING id`,
      [users.proA, `${TEST_MARKER} event`]
    );
    const eventId = event.rows[0].id;
    const ticketType = await client.query(
      `INSERT INTO ticket_types (event_id,name,price_xpf,quantity_total) VALUES ($1,'Security',1000,10) RETURNING id`,
      [eventId]
    );
    for (const status of ['paid', 'pending']) {
      const order = await client.query(
        `INSERT INTO ticket_orders (event_id,buyer_id,buyer_email,buyer_name,status,total_xpf)
         VALUES ($1,$2,'security-a@invalid.example','Security A',$3,1000) RETURNING id`,
        [eventId, users.a, status]
      );
      await client.query(
        `INSERT INTO tickets (order_id,event_id,ticket_type_id,buyer_name,buyer_email,price_xpf,token,qr_code_url,status)
         VALUES ($1,$2,$3,'Security A','security-a@invalid.example',1000,$4,$5,'active')`,
        [order.rows[0].id, eventId, ticketType.rows[0].id, `KALICO_TEST_TICKET_${status.toUpperCase()}`, `/uploads/qr-tickets/security-ticket-${status}.png`]
      );
    }
    await client.query(
      `INSERT INTO coupons (pro_id,code,label,discount_type,is_active,qr_code_url)
       VALUES ($1,'SECURITY-ACTIVE','Security coupon','percent',TRUE,'/uploads/qr-tickets/security-coupon-active.png')`,
      [users.proA]
    );

    return { users, listingId, imageId, convId, eventId };
  });
}

async function main() {
  const root = assertSafeEnvironment();
  await writeFixture(root, 'listings/1/security-public.webp', Buffer.from(TEST_MARKER));
  await writeFixture(root, 'chat/security-a/security-photo.webp', Buffer.from(TEST_MARKER));
  await writeFixture(root, 'chat/security-a/security-audio.webm', Buffer.from(TEST_MARKER));
  await writeFixture(root, 'chat/security-a/security-document.pdf', Buffer.from(`%PDF-1.4\n${TEST_MARKER}\n%%EOF`));
  await writeFixture(root, 'pro-documents/security-pro-a/security-ridet.pdf', Buffer.from(`%PDF-1.4\n${TEST_MARKER}\n%%EOF`));
  await writeFixture(root, 'imports/security-import.csv', Buffer.from(`title,price_xpf\n${TEST_MARKER},1000\n`));
  await writeFixture(root, 'qr-tickets/security-ticket-paid.png', Buffer.from(TEST_MARKER));
  await writeFixture(root, 'qr-tickets/security-ticket-pending.png', Buffer.from(TEST_MARKER));
  await writeFixture(root, 'qr-tickets/security-coupon-active.png', Buffer.from(TEST_MARKER));
  await writeFixture(root, 'orphan/security-orphan.bin', Buffer.from(TEST_MARKER));
  const summary = await seedDatabase();
  console.log(JSON.stringify({ ok: true, marker: TEST_MARKER, counts: { users: Object.keys(summary.users).length, conversations: 1, tickets: 2, coupons: 1 } }));
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[security-seed]', error.message);
    process.exitCode = 1;
  }).finally(() => pool.end());
}

module.exports = { assertSafeEnvironment, main, writeFixture };
