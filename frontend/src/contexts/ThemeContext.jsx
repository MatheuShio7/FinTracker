/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const THEME_STORAGE_KEY = 'fintracker-theme'
const FONT_SIZE_STORAGE_KEY = 'fintracker-font-size'

const VALID_FONT_SIZES = ['small', 'medium', 'large']

const ThemeContext = createContext()

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch {
    // localStorage indisponível
  }
  return 'dark'
}

function getStoredFontSize() {
  try {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY)
    if (VALID_FONT_SIZES.includes(stored)) {
      return stored
    }
  } catch {
    // localStorage indisponível
  }
  return 'medium'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function applyFontSize(fontSize) {
  document.documentElement.setAttribute('data-font-size', fontSize)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme)
  const [fontSize, setFontSizeState] = useState(getStoredFontSize)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // localStorage indisponível
    }
  }, [theme])

  useEffect(() => {
    applyFontSize(fontSize)
    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize)
    } catch {
      // localStorage indisponível
    }
  }, [fontSize])

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setFontSize = useCallback((newFontSize) => {
    if (VALID_FONT_SIZES.includes(newFontSize)) {
      setFontSizeState(newFontSize)
    }
  }, [])

  const isDark = theme === 'dark'

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function initTheme() {
  applyTheme(getStoredTheme())
  applyFontSize(getStoredFontSize())
}
