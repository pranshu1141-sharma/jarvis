import assert from 'node:assert/strict'
import test from 'node:test'
import { isElevenLabsKey } from './elevenlabs-key.mjs'

test('accepts ElevenLabs secret keys', () => {
  assert.equal(isElevenLabsKey('sk_example-secret-value'), true)
})

test('rejects an ElevenLabs key ID mistaken for the secret', () => {
  assert.equal(
    isElevenLabsKey('d53dc86ab9f2dee3b90611839e156c855ea1ac36b8ea14154cbaf0fef4d4178c'),
    false,
  )
  assert.equal(isElevenLabsKey(''), false)
})
