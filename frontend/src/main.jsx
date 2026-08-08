import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTheme } from './contexts/ThemeContext'
import { initLanguage } from './i18n'
import './i18n'
import './themes.css'
import './index.css'
import App from './App.jsx'

initTheme()
initLanguage()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
