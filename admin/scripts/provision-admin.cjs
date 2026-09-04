'use strict';

const crypto = require('node:crypto');
const readline = require('node:readline/promises');
const bcrypt = require('bcryptjs');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(bytes = crypto.randomBytes(20)) {
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let result = '';
  for (let offset = 0; offset < bits.length; offset += 5) {
    result += BASE32_ALPHABET[Number.parseInt(bits.slice(offset, offset + 5).padEnd(5, '0'), 2)];
  }
  return result;
}

function base32ToBuffer(secret) {
  const normalized = String(secret).replace(/=+$/g, '').toUpperCase();
  if (!normalized || /[^A-Z2-7]/.test(normalized)) throw new Error('Secret TOTP Base32 invalide.');
  let bits = '';
  for (const char of normalized) bits += BASE32_ALPHABET.indexOf(char).toString(2).padStart(5, '0');
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret, counter) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32ToBuffer(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(value % 1_000_000).padStart(6, '0');
}

function verifyTotpToken(secret, token, epoch = Date.now(), window = 1) {
  const candidate = String(token || '').trim();
  if (!/^\d{6}$/.test(candidate)) return false;
  const counter = Math.floor(epoch / 30_000);
  for (let drift = -window; drift <= window; drift += 1) {
    if (counter + drift < 0) continue;
    const expected = hotp(secret, counter + drift);
    if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))) return true;
  }
  return false;
}

function generateTotpToken(secret, epoch = Date.now()) {
  return hotp(secret, Math.floor(epoch / 30_000));
}

function createOtpAuthUrl(secret, email) {
  const label = `Kalico Admin:${email}`;
  const params = new URLSearchParams({ secret, issuer: 'Kalico Admin', algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

function validateEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    throw new Error('Adresse email ASCII invalide.');
  }
  return email;
}

function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 14) throw new Error('Le mot de passe doit contenir au moins 14 caractères.');
  if (value.length > 200) throw new Error('Le mot de passe est trop long.');
  return value;
}

function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Cette commande exige un terminal interactif.');
  }
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error); else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u0003') return finish(new Error('Provisionnement annulé.'));
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Cette commande exige un terminal interactif local.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let email;
  try { email = validateEmail(await rl.question('Email administrateur : ')); } finally { rl.close(); }

  const password = validatePassword(await readHidden('Mot de passe (14 caractères minimum) : '));
  const confirmation = await readHidden('Confirmez le mot de passe : ');
  if (password !== confirmation) throw new Error('Les mots de passe ne correspondent pas.');

  const totpSecret = generateBase32Secret();
  const sessionSecret = crypto.randomBytes(48).toString('base64url');
  const apiToken = crypto.randomBytes(48).toString('base64url');
  process.stdout.write('\nAjoutez manuellement cette clé dans votre application TOTP :\n');
  process.stdout.write(`${totpSecret}\n\nURI compatible avec les applications TOTP :\n${createOtpAuthUrl(totpSecret, email)}\n`);

  let verified = false;
  for (let attempt = 0; attempt < 3 && !verified; attempt += 1) {
    const codeReader = readline.createInterface({ input: process.stdin, output: process.stdout });
    let code;
    try { code = await codeReader.question('Code TOTP affiché par l’application : '); } finally { codeReader.close(); }
    verified = verifyTotpToken(totpSecret, code);
    if (!verified) process.stdout.write('Code invalide.\n');
  }
  if (!verified) throw new Error('Le secret TOTP n’a pas été validé ; aucune configuration ne doit être déployée.');

  const passwordHash = await bcrypt.hash(password, 12);
  process.stdout.write('\nValidation réussie. Copiez une seule fois ces valeurs dans le gestionnaire de secrets de l’environnement :\n\n');
  process.stdout.write(`ADMIN_EMAIL='${email}'\n`);
  process.stdout.write(`ADMIN_PASSWORD_HASH='${passwordHash}'\n`);
  process.stdout.write(`ADMIN_TOTP_SECRET='${totpSecret}'\n`);
  process.stdout.write("TOTP_CONFIGURED='true'\n");
  process.stdout.write(`NEXTAUTH_SECRET='${sessionSecret}'\n`);
  process.stdout.write(`ADMIN_API_TOKEN='${apiToken}'\n`);
  process.stdout.write('\nNe placez jamais ce bloc dans Git, une PR, un ticket ou une conversation. Fermez le terminal après stockage.\n');
}

module.exports = { createOtpAuthUrl, generateBase32Secret, generateTotpToken, validateEmail, validatePassword, verifyTotpToken };

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Erreur : ${error.message}\n`);
    process.exitCode = 1;
  });
}
