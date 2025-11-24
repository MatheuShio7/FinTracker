import './Configuracoes.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'

function Configuracoes() {
  const { user, updateProfile } = useAuth()
  
  const [isDarkTheme, setIsDarkTheme] = useState(true) // Tema padrão é escuro
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR') // Idioma padrão português
  
  // Estados dos campos de dados pessoais
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  
  // Estados originais (para detectar mudanças)
  const [originalFirstName, setOriginalFirstName] = useState('')
  const [originalLastName, setOriginalLastName] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  
  // Estados de carregamento e erro
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Carregar dados do usuário ao montar o componente
  useEffect(() => {
    if (user) {
      setFirstName(user.name || '')
      setLastName(user.last_name || '')
      setEmail(user.email || '')
      
      setOriginalFirstName(user.name || '')
      setOriginalLastName(user.last_name || '')
      setOriginalEmail(user.email || '')
    }
  }, [user])
  
  // Detectar se houve mudanças
  const hasChanges = 
    firstName !== originalFirstName || 
    lastName !== originalLastName || 
    email !== originalEmail
  
  // Salvar alterações
  const handleSaveProfile = async () => {
    if (!hasChanges) return
    
    setSaving(true)
    setError('')
    setSuccessMessage('')
    
    try {
      const result = await updateProfile(firstName, lastName, email)
      
      if (result.success) {
        // Atualizar estados originais
        setOriginalFirstName(result.user.name)
        setOriginalLastName(result.user.last_name)
        setOriginalEmail(result.user.email)
        
        setSuccessMessage('Dados atualizados com sucesso!')
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setSuccessMessage('')
        }, 3000)
      } else {
        setError(result.message || 'Erro ao atualizar dados')
      }
    } catch (err) {
      setError('Erro ao atualizar dados')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="configuracoes-container">
      <Logo />
      <PageTitle title="Configurações" />
      
      <div className="configuracoes-content">
        <h3 className="configuracoes-section-title">Definir Tema</h3>
        
        <div className="theme-toggle-container">
          <label className="theme-toggle-switch">
            <input 
              type="checkbox" 
              checked={isDarkTheme}
              onChange={() => setIsDarkTheme(!isDarkTheme)}
            />
            <span className="theme-toggle-slider">
              <i className="bi bi-sun-fill theme-icon sun-icon"></i>
              <i className="bi bi-moon-fill theme-icon moon-icon"></i>
            </span>
          </label>
        </div>

        <h3 className="configuracoes-section-title" style={{ marginTop: '70px' }}>Selecionar Idioma</h3>
        
        <div className="language-selector-container">
          <div 
            className={`language-option ${selectedLanguage === 'pt-BR' ? 'selected' : ''}`}
            onClick={() => setSelectedLanguage('pt-BR')}
          >
            <img src="/Flag_of_Brazil.svg.webp" alt="Português" className="flag-image" />
            <div className="language-underline"></div>
          </div>
          
          <div className="language-divider"></div>
          
          <div 
            className={`language-option ${selectedLanguage === 'en-US' ? 'selected' : ''}`}
            onClick={() => setSelectedLanguage('en-US')}
          >
            <img src="/Flag_of_the_United_States.svg.png" alt="English" className="flag-image" />
            <div className="language-underline"></div>
          </div>
        </div>

        <h3 className="configuracoes-section-title" style={{ marginTop: '70px' }}>Alterar Dados Pessoais</h3>
        
        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="profile-success">
            {successMessage}
          </div>
        )}
        
        <div className="profile-fields-container">
          <div className="profile-field-row">
            <div className="profile-field">
              <div className="profile-input-wrapper">
                <i className="bi bi-person-fill profile-input-icon"></i>
                <input
                  type="text"
                  className="profile-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={saving}
                  placeholder="Primeiro nome"
                />
              </div>
            </div>
            
            <div className="profile-field">
              <div className="profile-input-wrapper">
                <i className="bi bi-person-fill profile-input-icon"></i>
                <input
                  type="text"
                  className="profile-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={saving}
                  placeholder="Último nome"
                />
              </div>
            </div>
          </div>
          
          <div className="profile-field profile-field-full">
            <div className="profile-input-wrapper">
              <i className="bi bi-envelope-fill profile-input-icon"></i>
              <input
                type="email"
                className="profile-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saving}
                placeholder="Email"
              />
            </div>
          </div>
        </div>
        
        <button
          className={`profile-save-button ${hasChanges && !saving ? 'profile-save-button-active' : ''}`}
          onClick={handleSaveProfile}
          disabled={!hasChanges || saving}
        >
          {saving ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}

export default Configuracoes 