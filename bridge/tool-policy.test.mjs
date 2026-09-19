import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise the bridge's actual policy without starting its HTTP server or an
// agent session. Configuration discovery sees an empty, isolated test home.
const source = readFileSync(new URL('./server.mjs', import.meta.url), 'utf8')
const policy = source.slice(
  source.indexOf('const READ_ONLY_BUILTINS ='),
  source.indexOf('const SYSTEM_PROMPT ='),
)
function decide(name, allowWrites = false, input = {}) {
  return runInNewContext(`${policy}\ndecideTool(toolName, input)`, {
    ALLOW_WRITES: allowWrites,
    toolName: name,
    input,
    readFileSync: () => '{}',
    join: (...parts) => parts.join('/'),
    homedir: () => '/test-home',
  })
}

test('configured Playwright inspection tools work in read-only mode', () => {
  for (const name of [
    'browser_snapshot', 'browser_find', 'browser_console_messages',
    'browser_network_requests', 'browser_network_request', 'browser_wait_for',
  ]) {
    assert.equal(decide(`mcp__jarvis-playwright__${name}`), true, name)
  }
})

test('explicit browser output files require action mode', () => {
  for (const name of ['browser_snapshot', 'browser_console_messages', 'browser_network_requests', 'browser_network_request']) {
    const input = { filename: 'C:/Users/HP/Documents/output.txt' }
    assert.equal(decide(`mcp__jarvis-playwright__${name}`, false, input), false, name)
    assert.equal(decide(`mcp__jarvis-playwright__${name}`, true, input), true, name)
  }
  assert.equal(decide('mcp__jarvis-playwright__browser_network_request', false, { part: 'response-body' }), false)
  assert.equal(decide('mcp__jarvis-playwright__browser_network_request', true, { part: 'response-body' }), true)
})

test('desktop inspection works but desktop actions remain gated', () => {
  for (const name of ['Snapshot', 'Screenshot', 'DisplayInventory', 'Wait', 'WaitFor']) {
    assert.equal(decide(`mcp__jarvis-windows__${name}`), true, name)
  }
  for (const name of ['App', 'Click', 'Type', 'PowerShell', 'FileSystem', 'Registry', 'Process', 'Clipboard']) {
    assert.equal(decide(`mcp__jarvis-windows__${name}`), false, name)
    assert.equal(decide(`mcp__jarvis-windows__${name}`, true), true, name)
  }
  assert.equal(decide('mcp__unknown__Snapshot'), false)
})

test('browser actions and delegated Codex sessions still require action mode', () => {
  for (const name of [
    'mcp__jarvis-playwright__browser_click',
    'mcp__jarvis-playwright__browser_tabs',
    'mcp__jarvis-playwright__browser_evaluate',
    'mcp__jarvis-playwright__browser_run_code_unsafe',
    'mcp__jarvis-playwright__browser_file_upload',
    'mcp__jarvis-codex__codex',
    'mcp__jarvis-codex__codex-reply',
    'Bash', 'Write',
  ]) {
    assert.equal(decide(name), false, name)
    assert.equal(decide(name, true), true, name)
  }
})

test('inspection exceptions cannot grant permissions to other servers', () => {
  assert.equal(decide('mcp__unknown__browser_snapshot'), false)
  assert.equal(decide('mcp__jarvis-playwright__browser_snapshot_and_delete'), false)
  assert.equal(decide('Read'), true)
  assert.equal(decide('mcp__jarvis_ui__ui_theme'), true)
})
