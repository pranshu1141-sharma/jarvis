import assert from 'node:assert/strict'
import test from 'node:test'
import { billingError } from './billing-result.mjs'

test('surfaces an insufficient-credit result as an actionable error', () => {
  assert.equal(
    billingError('Credit balance is too low'),
    'Claude account credit balance is too low. Check your Claude billing and try again.',
  )
})

test('keeps ordinary successful answers unchanged', () => {
  assert.equal(billingError('Four.'), null)
  assert.equal(billingError(''), null)
})
