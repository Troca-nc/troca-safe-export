const assert = require('node:assert/strict')
const test = require('node:test')
const { calculateTrocBalance, roundTrocComplement } = require('./trocBalance.ts')

test('considère une différence de 10 % comme équilibrée', () => {
  assert.equal(calculateTrocBalance({ offeredValue: 90000, requestedValue: 100000 }).isBalanced, true)
  assert.equal(calculateTrocBalance({ offeredValue: 89000, requestedValue: 100000 }).isBalanced, false)
})

test('arrondit le complément au palier de 500 F le plus proche', () => {
  assert.equal(roundTrocComplement(12260), 12500)
  assert.equal(roundTrocComplement(12240), 12000)
})

test('borne l’angle de la balance', () => {
  assert.equal(calculateTrocBalance({ offeredValue: 0, requestedValue: 100000 }).angle, 14)
  assert.equal(calculateTrocBalance({ offeredValue: 100000, requestedValue: 0 }).angle, -14)
})

test('applique le complément du bon côté', () => {
  const result = calculateTrocBalance({ offeredValue: 60000, requestedValue: 70000, complement: 10000 })
  assert.equal(result.offeredTotal, 70000)
  assert.equal(result.requestedTotal, 70000)
  assert.equal(result.isBalanced, true)
})
