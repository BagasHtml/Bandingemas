import { errorResponse, json, upstreamJson } from '../_upstream.js'

const number = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

function limitOf(value) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return 120
  return Math.min(Math.max(parsed, 1), 500)
}

export async function onRequestGet({ params, request }) {
  const ticker = String(params.ticker ?? '').toUpperCase()
  if (!/^[A-Z0-9.-]{1,10}$/.test(ticker)) {
    return errorResponse(Object.assign(new Error('Kode tiketan tidak valid'), { status: 400 }))
  }

  try {
    const limit = limitOf(new URL(request.url).searchParams.get('limit'))
    const body = await upstreamJson('/api/history', {
      symbol: ticker,
      period: '1y',
      interval: '1d',
      limit,
    })
    const data = body.data ?? {}
    const candles = Array.isArray(data.candles) ? data.candles : []
    const symbol = typeof data.symbol === 'string' ? data.symbol.toUpperCase() : ticker

    const records = candles
      .filter((candle) => typeof candle?.time === 'string')
      .map((candle) => ({
        Date: candle.time.slice(0, 10),
        StockCode: symbol,
        StockName: typeof data.name === 'string' ? data.name : undefined,
        open: number(candle.open),
        high: number(candle.high),
        low: number(candle.low),
        close: number(candle.close),
        volume: number(candle.volume),
      }))

    return json({ ticker: symbol, records, latest: records.at(-1) ?? null })
  } catch (error) {
    return errorResponse(error)
  }
}
