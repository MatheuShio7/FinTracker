import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import { normalizeLanguage } from '../i18n'
import '../Configuracoes.css'
import '../Landing.css'

/**
 * Alternador de tema + seletor de idioma usados no header da landing
 * e nas páginas de login/cadastro (mesma aparência e comportamento).
 */
function ThemeLanguageControls() {
  const { t, i18n } = useTranslation('settings')
  const { isDark, setTheme } = useTheme()
  const selectedLanguage = normalizeLanguage(i18n.language)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  const currentFlag =
    selectedLanguage === 'en'
      ? '/Flag_of_the_United_States.svg.png'
      : '/Flag_of_Brazil.svg.webp'
  const currentFlagAlt =
    selectedLanguage === 'en' ? t('lang.enAlt') : t('lang.ptAlt')

  // Fecha o menu de idioma ao clicar fora ou pressionar Esc
  useEffect(() => {
    if (!langOpen) return

    const handlePointerDown = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setLangOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [langOpen])

  const changeLanguage = (language) => {
    i18n.changeLanguage(language)
    setLangOpen(false)
  }

  return (
    <>
      <div className="theme-toggle-container">
        <label className="theme-toggle-switch">
          <input
            type="checkbox"
            checked={isDark}
            onChange={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={t('theme')}
          />
          <span className="theme-toggle-slider">
            <i className="bi bi-sun-fill theme-icon sun-icon"></i>
            <i className="bi bi-moon-fill theme-icon moon-icon"></i>
          </span>
        </label>
      </div>

      <div className="landing-language" ref={langRef}>
        <button
          type="button"
          className="landing-language-trigger"
          onClick={() => setLangOpen((open) => !open)}
          aria-haspopup="listbox"
          aria-expanded={langOpen}
          aria-label={t('language')}
        >
          <img src={currentFlag} alt={currentFlagAlt} className="landing-language-flag" />
          <i
            className={`bi bi-chevron-down landing-language-chevron ${langOpen ? 'open' : ''}`}
          ></i>
        </button>

        {langOpen && (
          <ul className="landing-language-menu" role="listbox">
            <li role="option" aria-selected={selectedLanguage === 'pt-BR'}>
              <button
                type="button"
                className={`landing-language-option ${selectedLanguage === 'pt-BR' ? 'selected' : ''}`}
                onClick={() => changeLanguage('pt-BR')}
              >
                <img
                  src="/Flag_of_Brazil.svg.webp"
                  alt={t('lang.ptAlt')}
                  className="landing-language-flag"
                />
                <span>{t('lang.ptAlt')}</span>
              </button>
            </li>
            <li role="option" aria-selected={selectedLanguage === 'en'}>
              <button
                type="button"
                className={`landing-language-option ${selectedLanguage === 'en' ? 'selected' : ''}`}
                onClick={() => changeLanguage('en')}
              >
                <img
                  src="/Flag_of_the_United_States.svg.png"
                  alt={t('lang.enAlt')}
                  className="landing-language-flag"
                />
                <span>{t('lang.enAlt')}</span>
              </button>
            </li>
          </ul>
        )}
      </div>
    </>
  )
}

export default ThemeLanguageControls
