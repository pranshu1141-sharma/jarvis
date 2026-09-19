export async function localAnswer(prompt, {
  baseUrl = 'http://127.0.0.1:11434',
  model = process.env.JARVIS_LOCAL_MODEL || 'gemma3:4b',
} = {}) {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: 'You are JARVIS. Answer concisely and accurately. You cannot use live tools, inspect the desktop, open apps, or change files in local fallback mode. If asked to do those things, say they are unavailable until Claude account credit is restored.',
      stream: false,
      options: { num_predict: 250 },
    }),
    signal: AbortSignal.timeout(90_000),
  })
  if (!response.ok) throw new Error(`Local model returned HTTP ${response.status}`)
  const body = await response.json()
  const answer = String(body.response ?? '').trim()
  if (!answer) throw new Error('Local model returned an empty answer')
  return answer
}
