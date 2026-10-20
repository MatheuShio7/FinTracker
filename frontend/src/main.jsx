import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { initTheme } from './contexts/ThemeContext'
import { initLanguage } from './i18n'
import './i18n'
import './themes.css'
import './index.css'
import App from './App.jsx'

initTheme()
initLanguage()

// Botão voltar nativo no Android
if (Capacitor.isNativePlatform()) {
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapApp.exitApp()
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
