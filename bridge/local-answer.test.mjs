import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { localAnswer } from './local-answer.mjs'

test('asks the installed local model without offering unavailable tools', async () => {
  let request
  const server = createServer(async (req, res) => {
    assert.equal(req.url, '/api/generate')
    request = JSON.parse(await new Response(req).text())
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ response: '4\n' }))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const answer = await localAnswer('What is two plus two?', {
      baseUrl: `http://127.0.0.1:${server.address().port}`,
    })
    assert.equal(answer, '4')
    assert.equal(request.model, 'gemma3:4b')
    assert.equal(request.stream, false)
    assert.match(request.prompt, /What is two plus two\?/)
    assert.match(request.system, /cannot use live tools/i)
  } finally {
    server.close()
  }
})

test('rejects an empty local-model response', async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ response: '   ' }))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    await assert.rejects(
      localAnswer('Hello', { baseUrl: `http://127.0.0.1:${server.address().port}` }),
      /empty/i,
    )
  } finally {
    server.close()
  }
})
