import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { loadLocalEnv } from './env.mjs'

test('loads server secrets from .env.local without replacing shell values', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'jarvis-env-'))
  const env = { JARVIS_VOICE_ID: 'from-shell' }
  await writeFile(
    join(cwd, '.env.local'),
    [
      '# local JARVIS configuration',
      'ELEVENLABS_API_KEY="free-test-key"',
      'JARVIS_VOICE_ID=from-file',
      'VITE_TTS_ENGINE=kokoro',
    ].join('\n'),
  )

  try {
    const loaded = loadLocalEnv({ cwd, env })
    assert.deepEqual(loaded.sort(), ['ELEVENLABS_API_KEY', 'VITE_TTS_ENGINE'])
    assert.equal(env.ELEVENLABS_API_KEY, 'free-test-key')
    assert.equal(env.JARVIS_VOICE_ID, 'from-shell')
    assert.equal(env.VITE_TTS_ENGINE, 'kokoro')
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})

test('an absent .env.local is a harmless no-op', () => {
  const env = {}
  assert.deepEqual(loadLocalEnv({ cwd: join(tmpdir(), 'jarvis-env-missing'), env }), [])
  assert.deepEqual(env, {})
})
