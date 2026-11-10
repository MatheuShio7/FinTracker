export const PORTFOLIO_CACHE_DURATION = 5 * 60 * 1000

export async function fetchWalletData(fetcher, storage, {
  forceRefresh = false,
  now = () => Date.now()
} = {}) {
  const cached = storage.getItem('portfolio_cache')
  if (!forceRefresh && cached) {
    const parsed = JSON.parse(cached)
    if (now() - parsed.timestamp < PORTFOLIO_CACHE_DURATION) {
      return parsed.data
    }
  }

  const data = await fetcher()
  storage.setItem('portfolio_cache', JSON.stringify({
    data,
    timestamp: now()
  }))
  return data
}

export function calculatePortfolio(transactions) {
  const positions = {}
  for (const transaction of transactions) {
    const position = positions[transaction.ticker] ??= {
      quantity: 0,
      invested: 0
    }
    position.quantity += transaction.quantity
    position.invested += transaction.quantity * transaction.price
  }

  const totalInvested = Object.values(positions)
    .reduce((total, position) => total + position.invested, 0)

  const distribution = Object.fromEntries(
    Object.entries(positions).map(([ticker, position]) => [
      ticker,
      position.invested / totalInvested * 100
    ])
  )

  for (const position of Object.values(positions)) {
    position.averagePrice = position.invested / position.quantity
  }

  return { totalInvested, positions, distribution }
}
