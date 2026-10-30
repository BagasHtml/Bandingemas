import { errorResponse, json, upstreamJson } from './_upstream.js'

export async function onRequestGet() {
  try {
    const body = await upstreamJson('/api/universe')
    const rows = Array.isArray(body.data) ? body.data : []

    return json(
      rows
        .filter((row) => typeof row?.symbol === 'string' && row.symbol !== '')
        .map((row) => ({
          code: row.symbol,
          name: typeof row.name === 'string' ? row.name : row.symbol,
          sector: '',
        })),
      200,
      3600,
    )
  } catch (error) {
    return errorResponse(error)
  }
}
