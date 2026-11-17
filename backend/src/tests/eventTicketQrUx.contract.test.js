'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..', '..');
const scanPage = fs.readFileSync(path.join(root, 'frontend', 'src', 'app', 'scan', '[token]', 'page.tsx'), 'utf8');

assert.match(scanPage, /Billet validé avec succès\./);
assert.match(scanPage, /Déjà utilisé/);
assert.match(scanPage, /Ce billet est prêt à être contrôlé\./);
assert.doesNotMatch(scanPage, /ï¿½|\uFFFD/);

console.log('Event ticket QR UX contract passed.');
