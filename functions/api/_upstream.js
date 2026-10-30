// Proxy same-origin untuk API saham ihsg. Browser tidak bisa memanggil
// upstream langsung karena tidak ada header CORS dan endpoint-nya beda.

const UPSTREAM = 'https://ihsg.midoriresearch.com'
const TIMEOUT_MS = 15_000

export async function upstreamJson(path, params) {
  const url = new URL(path, UPSTREAM)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  const body = await response.json().catch(() => null)

  if (!response.ok || !body || body.error) {
    const message = body?.error?.message ?? `API saham membalas ${response.status}`
    const error = new Error(message)
    error.status = response.status === 404 ? 404 : 502
    throw error
  }

  return body
}

export function json(body, status = 200, maxAge = 60) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${maxAge}`,
    },
  })
}

export function errorResponse(error) {
  const status = error?.status ?? 502
  return json(
    { error: error instanceof Error ? error.message : 'Gagal memuat data saham' },
    status,
    0,
  )
}
