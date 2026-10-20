import { Capacitor } from '@capacitor/core'

/** Scheme/host usados no AndroidManifest e no Supabase Redirect URLs */
export const NATIVE_OAUTH_SCHEME = 'com.fintracker.app'
export const NATIVE_OAUTH_HOST = 'login-callback'
export const NATIVE_OAUTH_REDIRECT = `${NATIVE_OAUTH_SCHEME}://${NATIVE_OAUTH_HOST}`

export const getOAuthRedirectTo = () => {
  if (Capacitor.isNativePlatform()) {
    return NATIVE_OAUTH_REDIRECT
  }
  return `${window.location.origin}/login`
}

/**
 * Extrai code / tokens de callbacks OAuth (query ou hash),
 * inclusive em URLs com scheme custom (com.fintracker.app://...).
 */
export const parseAuthCallbackUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {}
  }

  const queryIndex = url.indexOf('?')
  const hashIndex = url.indexOf('#')

  let query = ''
  let hash = ''

  if (queryIndex !== -1) {
    query = url.slice(queryIndex + 1, hashIndex !== -1 ? hashIndex : undefined)
  }
  if (hashIndex !== -1) {
    hash = url.slice(hashIndex + 1)
  }

  const fromQuery = new URLSearchParams(query)
  const fromHash = new URLSearchParams(hash)

  return {
    code: fromQuery.get('code') || fromHash.get('code'),
    access_token: fromQuery.get('access_token') || fromHash.get('access_token'),
    refresh_token: fromQuery.get('refresh_token') || fromHash.get('refresh_token'),
    error: fromQuery.get('error') || fromHash.get('error'),
    error_description:
      fromQuery.get('error_description') || fromHash.get('error_description'),
  }
}

export const isNativeOAuthCallback = (url) =>
  typeof url === 'string' && url.startsWith(`${NATIVE_OAUTH_SCHEME}://`)
