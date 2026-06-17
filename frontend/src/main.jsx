import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTheme } from './contexts/ThemeContext'
import './themes.css'
import './index.css'
import App from './App.jsx'

initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
