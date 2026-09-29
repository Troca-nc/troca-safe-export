#!/usr/bin/env node
// Contrôles de la refonte Kalico v2. Sans dépendance.
//   node scripts/check-design.mjs            → tout src/
//   node scripts/check-design.mjs --changed  → fichiers modifiés depuis main
//   node scripts/check-design.mjs --launch   → contrôles de mise en production
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const EXT = /\.(tsx?|jsx?|css)$/;
const TOKENS_FILES = [/src\/styles\/kalico-tokens\.css$/, /tailwind\.config\.js$/, /src\/demo\//];

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (f === 'node_modules' || f.startsWith('.')) return [];
    return statSync(p).isDirectory() ? walk(p) : EXT.test(f) ? [p] : [];
  });
}

let files;
if (args.has('--changed')) {
  const base = execSync('git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main', { encoding: 'utf8' }).trim();
  files = execSync(`git diff --name-only --diff-filter=AM ${base}`, { encoding: 'utf8' })
    .split('\n').filter((f) => f && EXT.test(f) && f.startsWith('src/')).map((f) => join(ROOT, f));
} else {
  files = walk(join(ROOT, 'src'));
}

const errors = [];
const warnings = [];
const add = (list, file, line, msg) => list.push(`${relative(ROOT, file)}:${line}  ${msg}`);

const RULES = [
  { re: /#b85c00/i, msg: '#B85C00 interdit : accent-strong (fond) ou accent-text (texte)', level: 'error', skipTokens: true },
  { re: /\bbg-white\b|#fbfcfc|#ffffff\b|#fff\b/i, msg: 'blanc pur interdit : bg-cream ou bg-cream-surface', level: 'error', skipTokens: true },
  { re: /\bnc-(lagon|emeraude|corail|sable)\b|--coral\b|--ocean\b|--lagoon\b|--night\b|--jungle\b/, msg: 'ancienne palette', level: 'error', skipTokens: true },
  { re: /['"`]#[0-9a-f]{3,8}['"`]|\[#[0-9a-f]{3,8}\]/i, msg: 'couleur en dur : utiliser un token', level: 'error', skipTokens: true },
  { re: /from ['"](@\/|\.\.?\/)+demo\//, msg: 'import de fixture hors de src/lib/data', level: 'error', onlyOutside: /src\/lib\/data\//, skipTokens: false },
  { re: /style=\{\{/, msg: 'style en ligne : réservé aux valeurs dynamiques', level: 'warning', skipTokens: true },
  { re: /text-\[(1[0-4])px\]/, msg: 'texte sous 15 px : vérifier que c\u2019est une légende', level: 'warning', skipTokens: true },
];

for (const file of files) {
  const rel = relative(ROOT, file);
  const isTokens = TOKENS_FILES.some((r) => r.test(rel));
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((l, i) => {
    for (const r of RULES) {
      if (r.skipTokens && isTokens) continue;
      if (r.onlyOutside && r.onlyOutside.test(rel)) continue;
      if (r.onlyOutside && /src\/demo\//.test(rel)) continue;
      if (r.re.test(l)) add(r.level === 'error' ? errors : warnings, file, i + 1, r.msg);
    }
  });
}

if (args.has('--launch')) {
  const envProd = join(ROOT, '.env.production');
  if (existsSync(envProd) && /NEXT_PUBLIC_DEMO_DATA\s*=\s*true/.test(readFileSync(envProd, 'utf8'))) errors.push('.env.production  NEXT_PUBLIC_DEMO_DATA=true');
  const ph = join(ROOT, 'src/content/placeholders.ts');
  if (existsSync(ph)) readFileSync(ph, 'utf8').split('\n').forEach((l, i) => { if (/provisional:\s*true/.test(l)) add(errors, ph, i + 1, 'chiffre encore provisoire'); });
  for (const f of walk(join(ROOT, 'src'))) readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/TODO-LANCEMENT/.test(l)) add(errors, f, i + 1, 'TODO-LANCEMENT'); });
}

for (const w of warnings) console.log(`avertissement  ${w}`);
for (const e of errors) console.log(`ERREUR         ${e}`);
console.log(`\n${files.length} fichiers · ${errors.length} erreur(s) · ${warnings.length} avertissement(s)`);
process.exit(errors.length ? 1 : 0);
