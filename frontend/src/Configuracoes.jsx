import './Configuracoes.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'

function Configuracoes() {
  const { user, updateProfile, updatePassword } = useAuth()
  
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
  
  // Estados de carregamento e erro (dados pessoais)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Estados dos campos de senha
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Estados de visibilidade de senha
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Estados de carregamento e erro (senha)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  
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
  
  // Salvar alterações de dados pessoais
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
  
  // Verificar se todos os campos de senha estão preenchidos e válidos
  const isPasswordValid = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return false
    }
    
    if (newPassword.length < 8) {
      return false
    }
    
    if (newPassword !== confirmPassword) {
      return false
    }
    
    return true
  }
  
  // Verificar se algum campo de senha foi preenchido
  const hasPasswordInput = currentPassword || newPassword || confirmPassword
  
  // Salvar alterações de senha
  const handleSavePassword = async () => {
    if (!isPasswordValid()) return
    
    setSavingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')
    
    try {
      const result = await updatePassword(currentPassword, newPassword)
      
      if (result.success) {
        setPasswordSuccess('Senha atualizada com sucesso!')
        
        // Limpar campos
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setPasswordSuccess('')
        }, 3000)
      } else {
        setPasswordError(result.message || 'Erro ao atualizar senha')
      }
    } catch (err) {
      setPasswordError('Erro ao atualizar senha')
    } finally {
      setSavingPassword(false)
    }
  }
  
  // Limpar campos de senha
  const handleClearPassword = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess('')
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

        <div className="profile-sections-container">
          {/* Seção Alterar Dados Pessoais */}
          <div className="profile-section">
            <h3 className="configuracoes-section-title">Alterar Dados Pessoais</h3>
            
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

          {/* Seção Alterar Senha */}
          <div className="profile-section">
            <h3 className="configuracoes-section-title">Alterar Senha</h3>
            
            {passwordError && (
              <div className="profile-error">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="profile-success">
                {passwordSuccess}
              </div>
            )}
            
            <div className="password-fields-container">
              <div className="profile-field">
                <div className="profile-input-wrapper">
                  <i className="bi bi-lock-fill profile-input-icon"></i>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="profile-input profile-input-with-eye"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={savingPassword}
                    placeholder="Senha Atual"
                  />
                  <i 
                    className={`bi ${showCurrentPassword ? 'bi-eye-fill' : 'bi-eye'} password-eye-icon`}
                    onMouseDown={() => setShowCurrentPassword(true)}
                    onMouseUp={() => setShowCurrentPassword(false)}
                    onMouseLeave={() => setShowCurrentPassword(false)}
                    onTouchStart={() => setShowCurrentPassword(true)}
                    onTouchEnd={() => setShowCurrentPassword(false)}
                  ></i>
                </div>
              </div>
              
              <div className="profile-field">
                <div className="profile-input-wrapper">
                  <i className="bi bi-lock-fill profile-input-icon"></i>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="profile-input profile-input-with-eye"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={savingPassword}
                    placeholder="Nova Senha"
                  />
                  <i 
                    className={`bi ${showNewPassword ? 'bi-eye-fill' : 'bi-eye'} password-eye-icon`}
                    onMouseDown={() => setShowNewPassword(true)}
                    onMouseUp={() => setShowNewPassword(false)}
                    onMouseLeave={() => setShowNewPassword(false)}
                    onTouchStart={() => setShowNewPassword(true)}
                    onTouchEnd={() => setShowNewPassword(false)}
                  ></i>
                </div>
              </div>
              
              <div className="profile-field">
                <div className="profile-input-wrapper">
                  <i className="bi bi-lock-fill profile-input-icon"></i>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="profile-input profile-input-with-eye"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={savingPassword}
                    placeholder="Confirmar Nova Senha"
                  />
                  <i 
                    className={`bi ${showConfirmPassword ? 'bi-eye-fill' : 'bi-eye'} password-eye-icon`}
                    onMouseDown={() => setShowConfirmPassword(true)}
                    onMouseUp={() => setShowConfirmPassword(false)}
                    onMouseLeave={() => setShowConfirmPassword(false)}
                    onTouchStart={() => setShowConfirmPassword(true)}
                    onTouchEnd={() => setShowConfirmPassword(false)}
                  ></i>
                </div>
              </div>
            </div>
            
            <div className="password-buttons-container">
              <button
                className={`profile-save-button ${isPasswordValid() && !savingPassword ? 'profile-save-button-active' : ''}`}
                onClick={handleSavePassword}
                disabled={!isPasswordValid() || savingPassword}
              >
                {savingPassword ? 'Salvando...' : 'Confirmar'}
              </button>
              
              <button
                className={`profile-clear-button ${hasPasswordInput && !savingPassword ? 'profile-clear-button-active' : ''}`}
                onClick={handleClearPassword}
                disabled={!hasPasswordInput || savingPassword}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Configuracoes 