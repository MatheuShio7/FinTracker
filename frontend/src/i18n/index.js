import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ptCommon from './locales/pt-BR/common.json'
import ptNav from './locales/pt-BR/nav.json'
import ptAuth from './locales/pt-BR/auth.json'
import ptSettings from './locales/pt-BR/settings.json'
import ptPortfolio from './locales/pt-BR/portfolio.json'
import ptExplore from './locales/pt-BR/explore.json'
import ptGroups from './locales/pt-BR/groups.json'
import ptStock from './locales/pt-BR/stock.json'
import ptChat from './locales/pt-BR/chat.json'
import ptNotifications from './locales/pt-BR/notifications.json'
import ptLanding from './locales/pt-BR/landing.json'

import enCommon from './locales/en/common.json'
import enNav from './locales/en/nav.json'
import enAuth from './locales/en/auth.json'
import enSettings from './locales/en/settings.json'
import enPortfolio from './locales/en/portfolio.json'
import enExplore from './locales/en/explore.json'
import enGroups from './locales/en/groups.json'
import enStock from './locales/en/stock.json'
import enChat from './locales/en/chat.json'
import enNotifications from './locales/en/notifications.json'
import enLanding from './locales/en/landing.json'

const LANGUAGE_STORAGE_KEY = 'fintracker-language'
const SUPPORTED_LANGUAGES = ['pt-BR', 'en']
const DEFAULT_LANGUAGE = 'pt-BR'

export function normalizeLanguage(language) {
  if (!language) return DEFAULT_LANGUAGE
  if (SUPPORTED_LANGUAGES.includes(language)) return language
  if (language.startsWith('en')) return 'en'
  if (language.startsWith('pt')) return 'pt-BR'
  return DEFAULT_LANGUAGE
}

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored
    }
  } catch {
    // localStorage indisponível
  }
  return DEFAULT_LANGUAGE
}

function applyDocumentLanguage(language) {
  document.documentElement.lang = normalizeLanguage(language)
}

function persistLanguage(language) {
  const normalized = normalizeLanguage(language)
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized)
  } catch {
    // localStorage indisponível
  }
  applyDocumentLanguage(normalized)
}

const resources = {
  'pt-BR': {
    common: ptCommon,
    nav: ptNav,
    auth: ptAuth,
    settings: ptSettings,
    portfolio: ptPortfolio,
    explore: ptExplore,
    groups: ptGroups,
    stock: ptStock,
    chat: ptChat,
    notifications: ptNotifications,
    landing: ptLanding,
  },
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    settings: enSettings,
    portfolio: enPortfolio,
    explore: enExplore,
    groups: enGroups,
    stock: enStock,
    chat: enChat,
    notifications: enNotifications,
    landing: enLanding,
  },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: 'common',
  ns: [
    'common',
    'nav',
    'auth',
    'settings',
    'portfolio',
    'explore',
    'groups',
    'stock',
    'chat',
    'notifications',
    'landing',
  ],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

i18n.on('languageChanged', (language) => {
  persistLanguage(language)
})

export function initLanguage() {
  const language = getStoredLanguage()
  applyDocumentLanguage(language)
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // localStorage indisponível
  }
}

export { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE }
export default i18n
