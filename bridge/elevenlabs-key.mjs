/** ElevenLabs distinguishes secret API keys from visible key IDs by prefix. */
export function isElevenLabsKey(value) {
  return typeof value === 'string' && value.trim().startsWith('sk_')
}
