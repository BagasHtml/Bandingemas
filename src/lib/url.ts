// Hanya http(s) yang boleh dirender sebagai tautan; skema seperti javascript:
// akan tereksekusi saat diklik bila lolos dari data API.
export function safeExternalUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined

  try {
    const { protocol, href } = new URL(value)
    return protocol === 'https:' || protocol === 'http:' ? href : undefined
  } catch {
    return undefined
  }
}
