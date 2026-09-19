import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { localAnswer } from './local-answer.mjs'

export function extractCodexAnswer(events) {
  return events
    .filter((event) => event.type === 'item.completed' && event.item?.type === 'agent_message')
    .map((event) => event.item.text?.trim())
    .filter(Boolean)
    .at(-1) ?? ''
}

function codexCommand() {
  if (process.env.JARVIS_CODEX_PATH) return process.env.JARVIS_CODEX_PATH
  if (process.platform !== 'win32') return 'codex'
  const root = join(process.env.LOCALAPPDATA ?? '', 'OpenAI', 'Codex', 'bin')
  try {
    for (const folder of readdirSync(root).sort().reverse()) {
      const candidate = join(root, folder, 'codex.exe')
      if (existsSync(candidate)) return candidate
    }
  } catch { /* Codex may instead be on PATH. */ }
  return 'codex'
}

function codexPrompt(question, history) {
  const conversation = history.map(({ role, text }) => `${role}: ${text}`).join('\n')
  return [
    'You are JARVIS, a spoken assistant. Answer the latest user message directly and concisely, unless detail is requested. Use available tools when needed. Do not claim to have used a tool you could not access.',
    conversation && `Previous conversation:\n${conversation}`,
    `User: ${question}`,
  ].filter(Boolean).join('\n\n')
}

function runCodex(question, history, signal) {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd()
    const sandbox = process.env.JARVIS_ALLOW_WRITES === '1' ? 'workspace-write' : 'read-only'
    const args = [
      'exec', '--json', '--ephemeral', '--skip-git-repo-check',
      '-s', sandbox, '-C', cwd, '-c', 'approval_policy="never"',
    ]
    if (process.env.JARVIS_CODEX_MODEL) args.push('-m', process.env.JARVIS_CODEX_MODEL)
    args.push('-')
    const child = spawn(codexCommand(), args, {
      cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], signal,
    })
    const events = []
    let output = ''
    let stderr = ''
    let settled = false
    const timer = setTimeout(() => child.kill(), 110_000)
    const finish = (error, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(value)
    }
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      output += chunk
      let newline
      while ((newline = output.indexOf('\n')) !== -1) {
        const line = output.slice(0, newline).trim()
        output = output.slice(newline + 1)
        try { events.push(JSON.parse(line)) } catch { /* CLI status text. */ }
      }
    })
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-3000) })
    child.on('error', (error) => finish(error))
    child.on('close', (code) => {
      if (output.trim()) {
        try { events.push(JSON.parse(output.trim())) } catch { /* Partial line. */ }
      }
      const answer = extractCodexAnswer(events)
      if (code === 0 && answer) finish(null, answer)
      else finish(new Error(`Codex exited ${code}: ${stderr.slice(-300) || 'no answer'}`))
    })
    child.stdin.end(codexPrompt(question, history))
  })
}

export function serveCodexSocket(socket) {
  socket.send(JSON.stringify({ type: 'ready', servers: ['codex'] }))
  const history = []
  let active = null
  let generation = 0
  const send = (frame, id) => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ ...frame, ask: id }))
  }
  socket.on('message', (raw) => {
    let message
    try { message = JSON.parse(raw.toString()) } catch { return }
    if (message.type === 'interrupt') {
      generation++
      active?.abort()
      return
    }
    if (message.type !== 'ask' || typeof message.text !== 'string') return
    active?.abort()
    const own = ++generation
    const controller = new AbortController()
    active = controller
    const question = message.text
    const id = typeof message.id === 'string' ? message.id : null
    void (async () => {
      let answer
      try {
        answer = await runCodex(question, history, controller.signal)
        console.log('[jarvis] answered with ChatGPT/Codex')
      } catch (error) {
        if (controller.signal.aborted || own !== generation) return
        console.error('[jarvis] Codex unavailable; trying local model:', error)
        try {
          answer = await localAnswer(question)
        } catch (fallbackError) {
          if (own === generation) send({ type: 'error', message: `Codex and the local model are unavailable: ${fallbackError.message}` }, id)
          return
        }
      }
      if (own !== generation || controller.signal.aborted) return
      history.push({ role: 'User', text: question }, { role: 'JARVIS', text: answer })
      if (history.length > 12) history.splice(0, history.length - 12)
      send({ type: 'text', delta: answer }, id)
      send({ type: 'done', text: answer }, id)
    })()
  })
  socket.on('close', () => active?.abort())
}
