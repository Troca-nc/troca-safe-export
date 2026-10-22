import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import tailwindConfig from '../../../tailwind.config.js'

const colors = tailwindConfig.theme.extend.colors
const globals = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8')
const tokens = readFileSync(new URL('../../styles/kalico-tokens.css', import.meta.url), 'utf8')
const listingDetail = readFileSync(new URL('../annonces/AnnonceDetail.tsx', import.meta.url), 'utf8')

test('les couleurs v2 Tailwind utilisent les canaux du thème', () => {
  assert.equal(colors.cream.DEFAULT, 'rgb(var(--color-bg-rgb) / <alpha-value>)')
  assert.equal(colors.cream.surface, 'rgb(var(--color-surface-rgb) / <alpha-value>)')
  assert.equal(colors.ink.DEFAULT, 'rgb(var(--color-text-rgb) / <alpha-value>)')
  assert.equal(colors['warm-border'].DEFAULT, 'rgb(var(--color-border-rgb) / calc(<alpha-value> * var(--color-border-alpha)))')
})

test('les thèmes clair et sombre définissent tous les canaux structurants', () => {
  for (const channel of [
    '--color-bg-rgb',
    '--color-surface-rgb',
    '--color-surface-sunken-rgb',
    '--color-text-rgb',
    '--color-border-rgb',
  ]) {
    assert.match(tokens, new RegExp(`${channel}:`))
    assert.match(globals, new RegExp(`${channel}:`))
  }
})

test('les panneaux pétrole conservent leur contraste en thème sombre', () => {
  assert.match(globals, /\.dark \.bg-ink,/)
  assert.match(globals, /--color-text-rgb: 14 42 49;/)
  assert.match(globals, /--color-bg-rgb: 251 246 236;/)
})

test('les initiales du vendeur restent lisibles sur le fond information', () => {
  assert.match(listingDetail, /bg-info\/15 font-display text-xl text-info-text/)
  assert.doesNotMatch(listingDetail, /bg-info\/15 font-display text-xl text-ink-deep/)
})
