<script setup lang="ts">
useHead({
  title: 'Simulate Portfolio',
})

interface Holding {
  ticker: string
  /** Yahoo Finance symbol used for live quotes */
  yahooSymbol: string
  position: number
  averageCost: number
  /** True when added via the planned-purchase form */
  isPlanned?: boolean
}

interface Quote {
  symbol: string
  price: number | null
  regularMarketPrice: number | null
  currency: string | null
  previousClose: number | null
  session: 'pre' | 'regular' | 'post' | 'closed' | 'unknown'
  priceTime: number | null
  error?: string
}

const CHART_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#ec4899', // pink
  '#14b8a6', // teal
  '#a855f7', // purple
  '#eab308', // yellow
]

const holdings = ref<Holding[]>([
  { ticker: 'VHYA.L', yahooSymbol: 'VHYA.L', position: 75.9858, averageCost: 104.08 },
  { ticker: 'VICI', yahooSymbol: 'VICI', position: 209.8176, averageCost: 27.4 },
  // iShares S&P 500 Swap UCITS ETF on Euronext Amsterdam (AEB)
  { ticker: 'I500 (AEB)', yahooSymbol: 'I500.AS', position: 3420.9373, averageCost: 11.1961 },
  { ticker: 'QQQM', yahooSymbol: 'QQQM', position: 19.021, averageCost: 298.39 },
  { ticker: 'SPMO', yahooSymbol: 'SPMO', position: 35.6255, averageCost: 156.92 },
  { ticker: 'MSFT', yahooSymbol: 'MSFT', position: 5.2996, averageCost: 377.45 },
])

const symbols = computed(() =>
  holdings.value.map((h) => h.yahooSymbol).join(','),
)

const {
  data: quotesData,
  pending: quotesPending,
  error: quotesError,
  refresh: refreshQuotes,
} = await useFetch<{ quotes: Record<string, Quote> }>('/api/quotes', {
  query: computed(() => ({ symbols: symbols.value })),
  watch: [symbols],
  server: true,
})

const lastUpdated = ref<Date | null>(null)

watch(
  quotesData,
  (val) => {
    if (val?.quotes) lastUpdated.value = new Date()
  },
  { immediate: true },
)

async function onRefresh() {
  await refreshQuotes()
  lastUpdated.value = new Date()
}

// --- Planned purchase form (multi-stock) ---
interface PlanRow {
  id: number
  ticker: string
  amount: string
}

let planRowId = 0
function createPlanRow(): PlanRow {
  return { id: ++planRowId, ticker: '', amount: '' }
}

const planRows = ref<PlanRow[]>([createPlanRow(), createPlanRow()])
const planPending = ref(false)
const planError = ref<string | null>(null)
const planSuccess = ref<string | null>(null)

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase()
}

function addPlanRow() {
  planRows.value.push(createPlanRow())
}

function removePlanRow(id: number) {
  if (planRows.value.length <= 1) {
    planRows.value = [createPlanRow()]
    return
  }
  planRows.value = planRows.value.filter((r) => r.id !== id)
}

function applyPurchase(
  ticker: string,
  amount: number,
  price: number,
  currency: string | null,
): string {
  const shares = amount / price
  const existingIdx = holdings.value.findIndex(
    (h) => h.yahooSymbol.toUpperCase() === ticker || h.ticker.toUpperCase() === ticker,
  )

  if (existingIdx >= 0) {
    const existing = holdings.value[existingIdx]!
    const oldCost = existing.position * existing.averageCost
    const newPosition = existing.position + shares
    const newAvgCost = newPosition > 0 ? (oldCost + amount) / newPosition : price

    holdings.value[existingIdx] = {
      ...existing,
      position: newPosition,
      averageCost: newAvgCost,
      isPlanned: existing.isPlanned ?? false,
    }

    return `${existing.ticker}: +${formatNumber(shares, 4)} sh @ ${formatPrice(price, currency)} → ${formatNumber(newPosition, 4)} sh`
  }

  holdings.value.push({
    ticker,
    yahooSymbol: ticker,
    position: shares,
    averageCost: price,
    isPlanned: true,
  })

  return `${ticker}: ${formatNumber(shares, 4)} sh for $${formatNumber(amount, 2)} @ ${formatPrice(price, currency)}`
}

async function onAddPlannedPurchase() {
  planError.value = null
  planSuccess.value = null

  const merged = new Map<string, number>()
  const emptyOrInvalid: string[] = []

  for (const row of planRows.value) {
    const ticker = normalizeTicker(row.ticker)
    // number inputs can bind as number; coerce before trim
    const amountRaw = String(row.amount ?? '').trim()

    if (!ticker && !amountRaw) continue

    if (!ticker) {
      emptyOrInvalid.push('A row is missing a ticker symbol.')
      continue
    }
    const amount = Number(amountRaw)
    if (!Number.isFinite(amount) || amount <= 0) {
      emptyOrInvalid.push(`${ticker}: enter a valid amount greater than zero.`)
      continue
    }
    merged.set(ticker, (merged.get(ticker) ?? 0) + amount)
  }

  if (emptyOrInvalid.length > 0) {
    planError.value = emptyOrInvalid[0] ?? 'Invalid input.'
    return
  }

  if (merged.size === 0) {
    planError.value = 'Add at least one ticker and purchase amount.'
    return
  }

  planPending.value = true
  try {
    const tickers = [...merged.keys()]
    const data = await $fetch<{ quotes: Record<string, Quote> }>('/api/quotes', {
      query: { symbols: tickers.join(',') },
    })

    const successes: string[] = []
    const failures: string[] = []

    for (const [ticker, amount] of merged) {
      const quote =
        data.quotes?.[ticker] ??
        data.quotes?.[Object.keys(data.quotes ?? {}).find((k) => k.toUpperCase() === ticker) ?? '']
      const price = quote?.price ?? null

      if (price == null || price <= 0) {
        failures.push(
          quote?.error
            ? `${ticker}: ${quote.error}`
            : `${ticker}: no live price found`,
        )
        continue
      }

      successes.push(applyPurchase(ticker, amount, price, quote?.currency ?? 'USD'))
    }

    if (successes.length > 0) {
      planSuccess.value = `Added ${successes.length} purchase${successes.length > 1 ? 's' : ''}: ${successes.join(' · ')}`
      planRows.value = [createPlanRow(), createPlanRow()]
      await refreshQuotes()
      lastUpdated.value = new Date()
    }

    if (failures.length > 0) {
      planError.value = failures.join(' · ')
    }
  } catch (err) {
    planError.value = err instanceof Error ? err.message : 'Failed to look up ticker prices.'
  } finally {
    planPending.value = false
  }
}

function removeHolding(ticker: string) {
  holdings.value = holdings.value.filter((h) => h.ticker !== ticker)
}

const holdingsWithMetrics = computed(() =>
  holdings.value.map((h, i) => {
    const quote = quotesData.value?.quotes?.[h.yahooSymbol]
    const currentPrice = quote?.price ?? null
    const costBasis = h.position * h.averageCost
    const marketValue = currentPrice != null ? h.position * currentPrice : null
    const unrealizedPl = marketValue != null ? marketValue - costBasis : null
    const unrealizedPlPct =
      unrealizedPl != null && costBasis !== 0 ? (unrealizedPl / costBasis) * 100 : null

    return {
      ...h,
      color: CHART_COLORS[i % CHART_COLORS.length] as string,
      currentPrice,
      regularMarketPrice: quote?.regularMarketPrice ?? null,
      session: (quote?.session ?? 'unknown') as Quote['session'],
      currency: quote?.currency ?? null,
      costBasis,
      marketValue,
      unrealizedPl,
      unrealizedPlPct,
      quoteError: quote?.error,
    }
  }),
)

const totalMarketValue = computed(() =>
  holdingsWithMetrics.value.reduce((sum, h) => sum + (h.marketValue ?? 0), 0),
)

const totalCostBasis = computed(() =>
  holdingsWithMetrics.value.reduce((sum, h) => sum + h.costBasis, 0),
)

const totalUnrealizedPl = computed(() => totalMarketValue.value - totalCostBasis.value)

const totalUnrealizedPlPct = computed(() =>
  totalCostBasis.value !== 0 ? (totalUnrealizedPl.value / totalCostBasis.value) * 100 : 0,
)

const pricesReady = computed(() =>
  holdingsWithMetrics.value.some((h) => h.marketValue != null),
)

const holdingsWithShare = computed(() => {
  const total = totalMarketValue.value
  return holdingsWithMetrics.value.map((h) => ({
    ...h,
    share: total > 0 && h.marketValue != null ? (h.marketValue / total) * 100 : 0,
  }))
})

/** Build SVG pie path for a slice from startAngle to endAngle (degrees, 0 = top). */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180
  const start = {
    x: cx + r * Math.cos(toRad(startAngle)),
    y: cy + r * Math.sin(toRad(startAngle)),
  }
  const end = {
    x: cx + r * Math.cos(toRad(endAngle)),
    y: cy + r * Math.sin(toRad(endAngle)),
  }
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

const pieSlices = computed(() => {
  let angle = 0
  const cx = 100
  const cy = 100
  const r = 90
  const withValue = holdingsWithShare.value.filter((h) => h.marketValue != null && h.marketValue > 0)
  return withValue.map((h) => {
    const sweep = (h.share / 100) * 360
    const path =
      sweep >= 359.99
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
        : describeArc(cx, cy, r, angle, angle + Math.max(sweep, 0.01))
    const slice = {
      ...h,
      path,
      startAngle: angle,
      endAngle: angle + sweep,
    }
    angle += sweep
    return slice
  })
})

// --- Interactive pie chart state ---
const activeSliceTicker = ref<string | null>(null)
const tooltipVisible = ref(false)
const tooltipX = ref(0)
const tooltipY = ref(0)
const pieChartContainerRef = ref<HTMLElement | null>(null)

const activeSlice = computed(
  () => pieSlices.value.find((s) => s.ticker === activeSliceTicker.value) ?? null,
)

function updateTooltipPosition(clientX: number, clientY: number) {
  const el = pieChartContainerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  tooltipX.value = clientX - rect.left
  tooltipY.value = clientY - rect.top
}

function onSliceEnter(ticker: string, event: MouseEvent) {
  activeSliceTicker.value = ticker
  tooltipVisible.value = true
  updateTooltipPosition(event.clientX, event.clientY)
}

function onSliceMove(event: MouseEvent) {
  if (!tooltipVisible.value) return
  updateTooltipPosition(event.clientX, event.clientY)
}

function onSliceLeave() {
  activeSliceTicker.value = null
  tooltipVisible.value = false
}

function onSliceTap(ticker: string, event: MouseEvent | TouchEvent) {
  if (activeSliceTicker.value === ticker && tooltipVisible.value) {
    activeSliceTicker.value = null
    tooltipVisible.value = false
    return
  }
  activeSliceTicker.value = ticker
  tooltipVisible.value = true

  if ('touches' in event && event.touches[0]) {
    updateTooltipPosition(event.touches[0].clientX, event.touches[0].clientY)
  } else if ('clientX' in event) {
    updateTooltipPosition(event.clientX, event.clientY)
  }
}

function onChartLeave() {
  activeSliceTicker.value = null
  tooltipVisible.value = false
}

function onLegendEnter(ticker: string) {
  activeSliceTicker.value = ticker
  tooltipVisible.value = false
}

function onLegendLeave() {
  activeSliceTicker.value = null
}

function onLegendClick(ticker: string) {
  activeSliceTicker.value = activeSliceTicker.value === ticker ? null : ticker
  tooltipVisible.value = false
}

const largestTicker = computed(() => {
  const withValue = holdingsWithShare.value.filter((h) => h.marketValue != null)
  if (withValue.length === 0) return '—'
  const sorted = [...withValue].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
  return sorted[0]?.ticker ?? '—'
})

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatCurrency(n: number, currency = 'USD'): string {
  try {
    return n.toLocaleString(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } catch {
    return `${currency} ${formatNumber(n, 2)}`
  }
}

function formatPrice(n: number | null, currency: string | null): string {
  if (n == null) return '—'
  return formatCurrency(n, currency ?? 'USD')
}

function formatPl(n: number | null, currency: string | null = 'USD'): string {
  if (n == null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${formatCurrency(n, currency ?? 'USD')}`
}

function formatPlPct(n: number | null): string {
  if (n == null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${formatNumber(n, 2)}%`
}

function plClass(n: number | null): string {
  if (n == null || n === 0) return 'text-slate-500'
  return n > 0 ? 'text-emerald-600' : 'text-rose-600'
}

function plBadgeClass(n: number | null): string {
  if (n == null || n === 0) return 'bg-slate-100 text-slate-600'
  return n > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
}

function formatTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function sessionLabel(session: Quote['session']): string | null {
  if (session === 'pre') return 'PRE'
  if (session === 'post') return 'POST'
  return null
}

function sessionBadgeClass(session: Quote['session']): string {
  if (session === 'pre') return 'bg-amber-50 text-amber-700'
  if (session === 'post') return 'bg-violet-50 text-violet-700'
  return 'bg-slate-100 text-slate-600'
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
      <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
        Simulate Portfolio
      </h1>
      <div class="flex items-center gap-4">
        <div class="text-xs text-slate-400 hidden sm:block">
          Updated {{ formatTime(lastUpdated) }}
          <span class="text-slate-300">·</span>
          Yahoo Finance
        </div>
        <button
          type="button"
          class="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
          :disabled="quotesPending"
          @click="onRefresh"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3.5 w-3.5"
            :class="{ 'animate-spin': quotesPending }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
        <div class="text-sm text-slate-500">
          Total value
          <span class="ml-2 font-semibold text-slate-900 tabular-nums">
            {{ pricesReady ? formatCurrency(totalMarketValue) : '—' }}
          </span>
        </div>
      </div>
    </div>

    <div class="w-full p-6 space-y-6">
      <!-- Error banner -->
      <div
        v-if="quotesError"
        class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        Failed to load live prices from Yahoo Finance. {{ quotesError.message }}
      </div>

      <!-- Planned purchase form (multi-stock) -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Plan purchases</h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Add one or more tickers with dollar amounts. Shares are calculated from live / extended-hours prices.
            </p>
          </div>
          <button
            type="button"
            class="self-start sm:self-auto px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
            :disabled="planPending"
            @click="addPlanRow"
          >
            + Add row
          </button>
        </div>

        <form class="space-y-3" @submit.prevent="onAddPlannedPurchase">
          <div class="hidden sm:grid sm:grid-cols-12 gap-3 px-0.5">
            <div class="sm:col-span-5 text-xs font-medium text-slate-500">Ticker symbol</div>
            <div class="sm:col-span-5 text-xs font-medium text-slate-500">Amount to invest ($)</div>
            <div class="sm:col-span-2" />
          </div>

          <div
            v-for="(row, index) in planRows"
            :key="row.id"
            class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
          >
            <div class="sm:col-span-5">
              <label :for="`plan-ticker-${row.id}`" class="sm:hidden block text-xs font-medium text-slate-600 mb-1.5">
                Ticker symbol
              </label>
              <input
                :id="`plan-ticker-${row.id}`"
                v-model="row.ticker"
                type="text"
                autocomplete="off"
                spellcheck="false"
                :placeholder="index === 0 ? 'e.g. AAPL' : 'Ticker'"
                class="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                :disabled="planPending"
              />
            </div>
            <div class="sm:col-span-5">
              <label :for="`plan-amount-${row.id}`" class="sm:hidden block text-xs font-medium text-slate-600 mb-1.5">
                Amount to invest ($)
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  :id="`plan-amount-${row.id}`"
                  v-model="row.amount"
                  type="number"
                  min="0"
                  step="any"
                  inputmode="decimal"
                  :placeholder="index === 0 ? '1000' : 'Amount'"
                  class="w-full pl-7 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  :disabled="planPending"
                />
              </div>
            </div>
            <div class="sm:col-span-2 flex sm:justify-end">
              <button
                type="button"
                class="w-full sm:w-auto px-3 py-2 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                :disabled="planPending || planRows.length <= 1"
                title="Remove row"
                @click="removePlanRow(row.id)"
              >
                Remove
              </button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <p class="text-xs text-slate-400">
              Empty rows are ignored. Duplicate tickers in the form are combined.
            </p>
            <button
              type="submit"
              class="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              :disabled="planPending"
            >
              <svg
                v-if="planPending"
                class="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>{{ planPending ? 'Looking up prices…' : 'Add all to holdings' }}</span>
            </button>
          </div>
        </form>

        <p v-if="planError" class="mt-3 text-sm text-rose-600">{{ planError }}</p>
        <p v-if="planSuccess" class="mt-3 text-sm text-emerald-600">{{ planSuccess }}</p>
      </div>


      <!-- Summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Holdings</p>
          <p class="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{{ holdings.length }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Market value</p>
          <p class="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {{ pricesReady ? formatCurrency(totalMarketValue) : '—' }}
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Unrealized P/L</p>
          <p class="mt-1 text-2xl font-bold tabular-nums" :class="plClass(pricesReady ? totalUnrealizedPl : null)">
            {{ pricesReady ? formatPl(totalUnrealizedPl) : '—' }}
          </p>
          <p v-if="pricesReady" class="mt-0.5 text-xs font-medium tabular-nums" :class="plClass(totalUnrealizedPl)">
            {{ formatPlPct(totalUnrealizedPlPct) }}
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Largest position</p>
          <p class="mt-1 text-2xl font-bold text-slate-900">{{ largestTicker }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Pie chart (by current market value) -->
        <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
          <h2 class="text-sm font-semibold text-slate-900 mb-1">Composition by market value</h2>
          <p class="text-xs text-slate-500 mb-4">Live / extended-hours prices · hover or tap a slice</p>
          <div class="flex-1 flex flex-col items-center justify-center gap-6">
            <div v-if="quotesPending && !pricesReady" class="w-56 h-56 rounded-full bg-slate-100 animate-pulse" />

            <div
              v-else-if="pieSlices.length > 0"
              ref="pieChartContainerRef"
              class="relative w-56 h-56 select-none"
              @mouseleave="onChartLeave"
            >
              <svg
                viewBox="0 0 200 200"
                class="w-full h-full drop-shadow-sm touch-manipulation"
                role="img"
                aria-label="Portfolio composition pie chart by current market value"
              >
                <path
                  v-for="slice in pieSlices"
                  :key="slice.ticker"
                  :d="slice.path"
                  :fill="slice.color"
                  class="cursor-pointer transition-all duration-150"
                  :class="
                    activeSliceTicker === null
                      ? 'opacity-100'
                      : activeSliceTicker === slice.ticker
                        ? 'opacity-100'
                        : 'opacity-40'
                  "
                  :style="
                    activeSliceTicker === slice.ticker
                      ? { filter: 'brightness(1.08)', transform: 'scale(1.03)', transformOrigin: '100px 100px' }
                      : undefined
                  "
                  stroke="#fff"
                  stroke-width="1.5"
                  @mouseenter="onSliceEnter(slice.ticker, $event)"
                  @mousemove="onSliceMove"
                  @mouseleave="onSliceLeave"
                  @click.prevent="onSliceTap(slice.ticker, $event)"
                  @touchstart.prevent="onSliceTap(slice.ticker, $event)"
                />
                <circle cx="100" cy="100" r="48" class="fill-white pointer-events-none" />
                <template v-if="activeSlice">
                  <text
                    x="100"
                    y="94"
                    text-anchor="middle"
                    class="fill-slate-900 text-[11px] font-bold pointer-events-none"
                  >
                    {{ activeSlice.ticker }}
                  </text>
                  <text
                    x="100"
                    y="112"
                    text-anchor="middle"
                    class="fill-slate-500 text-[12px] font-semibold pointer-events-none"
                  >
                    {{ formatNumber(activeSlice.share, 1) }}%
                  </text>
                </template>
                <template v-else>
                  <text
                    x="100"
                    y="96"
                    text-anchor="middle"
                    class="fill-slate-500 text-[10px] font-medium pointer-events-none"
                  >
                    Total
                  </text>
                  <text
                    x="100"
                    y="112"
                    text-anchor="middle"
                    class="fill-slate-900 text-[11px] font-bold pointer-events-none"
                  >
                    {{ formatCurrency(totalMarketValue).replace(/\.00$/, '') }}
                  </text>
                </template>
              </svg>

              <div
                v-if="tooltipVisible && activeSlice"
                class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg ring-1 ring-black/5 backdrop-blur-sm"
                :style="{ left: `${tooltipX}px`, top: `${tooltipY}px` }"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    :style="{ backgroundColor: activeSlice.color }"
                  />
                  <span class="text-sm font-semibold text-slate-900">{{ activeSlice.ticker }}</span>
                </div>
                <div class="mt-1 flex items-baseline gap-2 pl-[18px]">
                  <span class="text-base font-bold tabular-nums text-slate-900">
                    {{ formatNumber(activeSlice.share, 1) }}%
                  </span>
                  <span class="text-xs tabular-nums text-slate-500">
                    {{ activeSlice.marketValue != null ? formatPrice(activeSlice.marketValue, activeSlice.currency) : '—' }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="w-56 h-56 flex items-center justify-center text-sm text-slate-400 text-center px-4">
              No live prices available for chart
            </div>

            <ul class="w-full space-y-1">
              <li
                v-for="h in holdingsWithShare"
                :key="h.ticker"
                class="flex items-center justify-between gap-3 text-sm rounded-lg px-2 py-1.5 -mx-2 cursor-pointer transition-colors"
                :class="
                  activeSliceTicker === h.ticker
                    ? 'bg-slate-100'
                    : activeSliceTicker
                      ? 'opacity-50 hover:opacity-100'
                      : 'hover:bg-slate-50'
                "
                @mouseenter="onLegendEnter(h.ticker)"
                @mouseleave="onLegendLeave"
                @click="onLegendClick(h.ticker)"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: h.color }"
                  />
                  <span class="font-medium text-slate-700 truncate">{{ h.ticker }}</span>
                  <span
                    v-if="h.isPlanned"
                    class="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded"
                  >
                    New
                  </span>
                </div>
                <span class="text-slate-500 tabular-nums flex-shrink-0">
                  {{ h.marketValue != null ? `${formatNumber(h.share, 1)}%` : '—' }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Holdings table -->
        <div class="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">Holdings</h2>
              <p class="text-xs text-slate-500 mt-0.5">
                Yahoo Finance live & extended-hours prices · Unrealized P/L vs average cost
              </p>
            </div>
            <span
              v-if="quotesPending"
              class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full"
            >
              Loading…
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th class="px-4 py-3">Ticker</th>
                  <th class="px-4 py-3 text-right">Position</th>
                  <th class="px-4 py-3 text-right">Avg cost</th>
                  <th class="px-4 py-3 text-right">Price</th>
                  <th class="px-4 py-3 text-right">Market value</th>
                  <th class="px-4 py-3 text-right">Unrealized P/L</th>
                  <th class="px-4 py-3 text-right">Weight</th>
                  <th class="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="h in holdingsWithShare"
                  :key="h.ticker"
                  class="hover:bg-slate-50/80 transition-colors"
                  :class="h.isPlanned ? 'bg-indigo-50/40' : ''"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <span
                        class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: h.color }"
                      />
                      <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                          <span class="font-semibold text-slate-900">{{ h.ticker }}</span>
                          <span
                            v-if="h.isPlanned"
                            class="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded"
                          >
                            New
                          </span>
                        </div>
                        <div v-if="h.yahooSymbol !== h.ticker" class="text-[10px] text-slate-400 font-mono">
                          {{ h.yahooSymbol }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    {{ formatNumber(h.position, 4) }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    {{ formatCurrency(h.averageCost) }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                    <div v-if="h.currentPrice != null" class="flex flex-col items-end gap-0.5">
                      <span>{{ formatPrice(h.currentPrice, h.currency) }}</span>
                      <span
                        v-if="sessionLabel(h.session)"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide"
                        :class="sessionBadgeClass(h.session)"
                        :title="h.regularMarketPrice != null ? `Regular close: ${formatPrice(h.regularMarketPrice, h.currency)}` : undefined"
                      >
                        {{ sessionLabel(h.session) }}
                      </span>
                    </div>
                    <span v-else class="text-slate-400" :title="h.quoteError">—</span>
                  </td>
                  <td class="px-4 py-3 text-right font-mono tabular-nums font-medium text-slate-900">
                    {{ h.marketValue != null ? formatPrice(h.marketValue, h.currency) : '—' }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex flex-col items-end gap-0.5">
                      <span class="font-mono tabular-nums font-medium" :class="plClass(h.unrealizedPl)">
                        {{ formatPl(h.unrealizedPl, h.currency) }}
                      </span>
                      <span
                        v-if="h.unrealizedPlPct != null"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums"
                        :class="plBadgeClass(h.unrealizedPl)"
                      >
                        {{ formatPlPct(h.unrealizedPlPct) }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 tabular-nums">
                      {{ h.marketValue != null ? `${formatNumber(h.share, 1)}%` : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove holding"
                      @click="removeHolding(h.ticker)"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                  <td class="px-4 py-3">Total</td>
                  <td class="px-4 py-3" />
                  <td class="px-4 py-3" />
                  <td class="px-4 py-3" />
                  <td class="px-4 py-3 text-right font-mono tabular-nums">
                    {{ pricesReady ? formatCurrency(totalMarketValue) : '—' }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex flex-col items-end gap-0.5">
                      <span class="font-mono tabular-nums" :class="plClass(pricesReady ? totalUnrealizedPl : null)">
                        {{ pricesReady ? formatPl(totalUnrealizedPl) : '—' }}
                      </span>
                      <span
                        v-if="pricesReady"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums"
                        :class="plBadgeClass(totalUnrealizedPl)"
                      >
                        {{ formatPlPct(totalUnrealizedPlPct) }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 tabular-nums">
                      100%
                    </span>
                  </td>
                  <td class="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
