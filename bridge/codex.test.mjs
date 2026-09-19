import assert from 'node:assert/strict'
import test from 'node:test'
import { extractCodexAnswer } from './codex.mjs'

test('takes the final spoken answer from Codex JSON events', () => {
  assert.equal(extractCodexAnswer([
    { type: 'thread.started', thread_id: 'temporary' },
    { type: 'item.completed', item: { type: 'agent_message', text: 'Four.' } },
    { type: 'turn.completed', usage: {} },
  ]), 'Four.')
})

test('reports no answer when Codex only emits status events', () => {
  assert.equal(extractCodexAnswer([
    { type: 'thread.started', thread_id: 'temporary' },
    { type: 'turn.failed', error: { message: 'unavailable' } },
  ]), '')
})
