import { supabase } from './supabase'
import { buildApiUrl } from '../config/api'

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
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

  return fetch(url, {
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

  return fetch(url, {
    ...options,
    headers,
  })
}
