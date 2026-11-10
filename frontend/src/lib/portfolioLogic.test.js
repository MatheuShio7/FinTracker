import { describe, expect, it, vi } from 'vitest'
import {
  calculatePortfolio,
  fetchWalletData
} from './portfolioLogic'

function createStorage() {
  const values = new Map()
  return {
    getItem: vi.fn(key => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value))
  }
}

describe('PER-004 - wallet cache', () => {
  it('uses cache before five minutes, refreshes after expiry and on force', async () => {
    const storage = createStorage()
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ portfolio: ['first'] })
      .mockResolvedValueOnce({ portfolio: ['expired'] })
      .mockResolvedValueOnce({ portfolio: ['forced'] })
    let timestamp = 0

    const options = { now: () => timestamp }
    const first = await fetchWalletData(fetcher, storage, options)
    timestamp = 2 * 60 * 1000
    const cached = await fetchWalletData(fetcher, storage, options)
    timestamp = 6 * 60 * 1000
    const expired = await fetchWalletData(fetcher, storage, options)
    const forced = await fetchWalletData(fetcher, storage, {
      ...options,
      forceRefresh: true
    })

    expect(first).toEqual({ portfolio: ['first'] })
    expect(cached).toEqual(first)
    expect(expired).toEqual({ portfolio: ['expired'] })
    expect(forced).toEqual({ portfolio: ['forced'] })
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(storage.setItem).toHaveBeenCalledTimes(3)
  })
})

describe('CAR-007 - portfolio consolidation', () => {
  it('calculates total, average prices and exact chart distribution', () => {
    const result = calculatePortfolio([
      { ticker: 'PETR4', quantity: 100, price: 30 },
      { ticker: 'VALE3', quantity: 100, price: 70 }
    ])

    expect(result.totalInvested).toBe(10000)
    expect(result.positions.PETR4.averagePrice).toBe(30)
    expect(result.positions.VALE3.averagePrice).toBe(70)
    expect(result.distribution).toEqual({ PETR4: 30, VALE3: 70 })
  })
})
