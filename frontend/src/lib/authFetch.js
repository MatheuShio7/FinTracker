import { supabase } from './supabase'
import { buildApiUrl } from '../config/api'

const DEFAULT_TIMEOUT_MS = 45000

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  return fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  }).finally(() => {
    window.clearTimeout(timeoutId)
  })
}

export async function authFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : buildApiUrl(endpoint)
  const accessToken = await getAccessToken()

  const headers = {
    ...(options.headers || {}),
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return fetchWithTimeout(url, {
    ...options,
    headers,
  })
}

export async function authFetchWithToken(endpoint, accessToken, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : buildApiUrl(endpoint)

  const headers = {
    ...(options.headers || {}),
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return fetchWithTimeout(url, {
    ...options,
    headers,
  })
}
