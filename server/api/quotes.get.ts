/**
 * Fetch latest market prices from Yahoo Finance for a comma-separated list of symbols.
 * Prefers real-time extended-hours (pre/post market) prices when available.
 * Query: /api/quotes?symbols=MSFT,VICI,VHYA.L
 */

type MarketSession = 'pre' | 'regular' | 'post' | 'closed' | 'unknown'

interface TradingPeriod {
  timezone?: string
  start?: number
  end?: number
  gmtoffset?: number
}

interface ChartMeta {
  symbol?: string
  regularMarketPrice?: number
  previousClose?: number
  chartPreviousClose?: number
  currency?: string
  regularMarketTime?: number
  currentTradingPeriod?: {
    pre?: TradingPeriod
    regular?: TradingPeriod
    post?: TradingPeriod
  }
  hasPrePostMarketData?: boolean
}

interface ChartResult {
  meta?: ChartMeta
  timestamp?: number[]
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>
      open?: Array<number | null>
      high?: Array<number | null>
      low?: Array<number | null>
      volume?: Array<number | null>
    }>
  }
}

function resolveSession(
  priceTime: number | null,
  meta: ChartMeta | undefined,
): MarketSession {
  const periods = meta?.currentTradingPeriod
  if (!periods || priceTime == null) return 'unknown'

  const { pre, regular, post } = periods
  if (pre?.start != null && pre?.end != null && priceTime >= pre.start && priceTime < pre.end) {
    return 'pre'
  }
  if (regular?.start != null && regular?.end != null && priceTime >= regular.start && priceTime < regular.end) {
    return 'regular'
  }
  if (post?.start != null && post?.end != null && priceTime >= post.start && priceTime <= post.end) {
    return 'post'
  }
  return 'closed'
}

/** Last non-null close from the 1m series (includes pre/post when includePrePost=true). */
function latestExtendedPrice(result: ChartResult): { price: number; time: number | null } | null {
  const closes = result.indicators?.quote?.[0]?.close
  const timestamps = result.timestamp
  if (!closes?.length) return null

  for (let i = closes.length - 1; i >= 0; i--) {
    const close = closes[i]
    if (close != null && Number.isFinite(close)) {
      return {
        price: close,
        time: timestamps?.[i] ?? null,
      }
    }
  }
  return null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbolsParam = typeof query.symbols === 'string' ? query.symbols : ''
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (symbols.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing symbols query parameter' })
  }

  const results: Record<
    string,
    {
      symbol: string
      /** Best available price: extended-hours when present, else regular market */
      price: number | null
      regularMarketPrice: number | null
      currency: string | null
      previousClose: number | null
      /** pre | regular | post | closed | unknown */
      session: MarketSession
      /** Unix seconds for the price used */
      priceTime: number | null
      error?: string
    }
  > = {}

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        // 1-minute bars with pre/post market so the last close is the live extended-hours print
        const url =
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
          `?interval=1m&range=1d&includePrePost=true`

        const data = await $fetch<{
          chart?: {
            result?: ChartResult[]
            error?: { description?: string } | null
          }
        }>(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
        })

        const result = data?.chart?.result?.[0]
        const meta = result?.meta
        const regularMarketPrice = meta?.regularMarketPrice ?? null
        const extended = result ? latestExtendedPrice(result) : null

        // Prefer latest extended-hours / intraday bar; fall back to regular market price
        const price = extended?.price ?? regularMarketPrice
        const priceTime = extended?.time ?? meta?.regularMarketTime ?? null

        if (price == null) {
          results[symbol] = {
            symbol,
            price: null,
            regularMarketPrice: null,
            currency: null,
            previousClose: null,
            session: 'unknown',
            priceTime: null,
            error: data?.chart?.error?.description ?? 'No price data',
          }
          return
        }

        results[symbol] = {
          symbol: meta?.symbol ?? symbol,
          price,
          regularMarketPrice,
          currency: meta?.currency ?? null,
          previousClose: meta?.previousClose ?? meta?.chartPreviousClose ?? null,
          session: resolveSession(priceTime, meta),
          priceTime,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch quote'
        results[symbol] = {
          symbol,
          price: null,
          regularMarketPrice: null,
          currency: null,
          previousClose: null,
          session: 'unknown',
          priceTime: null,
          error: message,
        }
      }
    }),
  )

  return { quotes: results }
})
