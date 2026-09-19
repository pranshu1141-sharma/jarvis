import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Load bridge-only settings from the same ignored .env.local file Vite reads.
 * Values already supplied by the shell win, and only valid environment names
 * are accepted. The values are never returned or logged.
 */
export function loadLocalEnv({ cwd = process.cwd(), env = process.env } = {}) {
  let source
  try {
    source = readFileSync(join(cwd, '.env.local'), 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }

  const loaded = []
  for (const rawLine of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!match) continue
    const [, name, rawValue] = match
    if (env[name] !== undefined) continue

    let value = rawValue.trim()
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    } else {
      value = value.replace(/\s+#.*$/, '').trim()
    }
    env[name] = value
    loaded.push(name)
  }
  return loaded
}
