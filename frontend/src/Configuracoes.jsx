import './Configuracoes.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'

function Configuracoes() {
  const {
    user,
    updateProfile,
    updatePassword,
    getMfaStatus,
    startMfaEnrollment,
    confirmMfaEnrollment,
    disableMfa,
  } = useAuth()
  
  const [isDarkTheme, setIsDarkTheme] = useState(true) // Tema padrão é escuro
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR') // Idioma padrão português
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaMessage, setMfaMessage] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState(null)
  const [mfaSetup, setMfaSetup] = useState(null)
  const [mfaCode, setMfaCode] = useState('')
  
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

  useEffect(() => {
    const loadMfa = async () => {
      if (!user) return

      setMfaLoading(true)
      setMfaError('')

      const status = await getMfaStatus()

      if (status.success) {
        setIsTwoFactorEnabled(status.enabled)
        setMfaFactorId(status.primaryFactorId)
      } else {
        setMfaError(status.message || 'Erro ao consultar status do MFA.')
      }

      setMfaLoading(false)
    }

    loadMfa()
  }, [user, getMfaStatus])
  
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
    } catch {
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
    } catch {
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

  const handleStartMfa = async () => {
    setMfaLoading(true)
    setMfaError('')
    setMfaMessage('')

    const result = await startMfaEnrollment()

    if (!result.success) {
      setMfaError(result.message || 'Não foi possível iniciar MFA.')
      setMfaLoading(false)
      return
    }

    setMfaSetup({
      factorId: result.factorId,
      qrCode: result.qrCode,
      secret: result.secret,
      uri: result.uri,
    })
    setMfaCode('')
    setMfaMessage('Escaneie o QR code e confirme com o código de 6 dígitos.')
    setMfaLoading(false)
  }

  const handleConfirmMfa = async () => {
    if (!mfaSetup?.factorId || !mfaCode.trim()) return

    setMfaLoading(true)
    setMfaError('')
    setMfaMessage('')

    const result = await confirmMfaEnrollment(mfaSetup.factorId, mfaCode)

    if (!result.success) {
      setMfaError(result.message || 'Código inválido.')
      setMfaLoading(false)
      return
    }

    const status = await getMfaStatus()
    setIsTwoFactorEnabled(Boolean(status.success && status.enabled))
    setMfaFactorId(status.primaryFactorId || mfaSetup.factorId)
    setMfaSetup(null)
    setMfaCode('')
    setMfaMessage('MFA ativado com sucesso!')
    setMfaLoading(false)
  }

  const handleDisableMfa = async () => {
    if (!mfaFactorId) {
      setMfaError('Não foi possível identificar o fator MFA para desativar.')
      return
    }

    const confirmed = window.confirm('Tem certeza que deseja desativar a autenticação em duas etapas?')
    if (!confirmed) return

    setMfaLoading(true)
    setMfaError('')
    setMfaMessage('')

    const result = await disableMfa(mfaFactorId)

    if (!result.success) {
      setMfaError(result.message || 'Não foi possível desativar o MFA.')
      setMfaLoading(false)
      return
    }

    setIsTwoFactorEnabled(false)
    setMfaFactorId(null)
    setMfaSetup(null)
    setMfaCode('')
    setMfaMessage('MFA desativado com sucesso.')
    setMfaLoading(false)
  }

  const getMfaQrDisplay = () => {
    if (!mfaSetup) return { type: 'none', value: '' }

    const rawQr = (mfaSetup.qrCode || '').trim()

    if (rawQr.startsWith('<svg') || rawQr.startsWith('<?xml')) {
      return { type: 'svg', value: rawQr }
    }

    if (rawQr.startsWith('data:image') || rawQr.startsWith('http')) {
      return { type: 'img', value: rawQr }
    }

    if (mfaSetup.uri) {
      const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mfaSetup.uri)}`
      return { type: 'img', value: fallbackQrUrl }
    }

    return { type: 'none', value: '' }
  }

  const qrDisplay = getMfaQrDisplay()

  return (
    <div className="configuracoes-container">
      <Logo />
      <PageTitle title="Configurações" />
      
      <div className="configuracoes-content">
        <h2 className="configuracoes-group-title">Preferências</h2>
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

        <h3 className="configuracoes-section-title" style={{ marginTop: '30px' }}>Selecionar Idioma</h3>
        
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

        <h2 className="configuracoes-group-title">Segurança</h2>

        <div className={`two-factor-card ${isTwoFactorEnabled ? 'two-factor-card-active' : ''}`}>
          <h3 className="two-factor-card-title">
            {isTwoFactorEnabled ? '✅ Verificação em 2 Etapas Ativa' : '🔒 Autenticação em Duas Etapas'}
          </h3>
          <p className="two-factor-card-text">
            {isTwoFactorEnabled
              ? 'Sua conta está protegida com autenticação em duas etapas. Você precisará de um código do seu app autenticador toda vez que fizer login.'
              : 'Aumente a segurança exigindo um código do seu celular além da senha para fazer login.'}
          </p>
          <button
            className={`two-factor-card-button ${isTwoFactorEnabled ? 'two-factor-card-button-danger' : 'two-factor-card-button-primary'}`}
            onClick={isTwoFactorEnabled ? handleDisableMfa : handleStartMfa}
            disabled={mfaLoading}
          >
            {mfaLoading ? 'Processando...' : isTwoFactorEnabled ? 'Desativar' : 'Ativar'}
          </button>

          {mfaError && <div className="profile-error" style={{ marginTop: '14px' }}>{mfaError}</div>}
          {mfaMessage && <div className="profile-success" style={{ marginTop: '14px' }}>{mfaMessage}</div>}

          {mfaSetup && !isTwoFactorEnabled && (
            <div className="mfa-setup-container">
              <h4 className="mfa-setup-title">Configurar App Autenticador</h4>

              {qrDisplay.type === 'svg' && (
                <div className="mfa-qr-wrapper" dangerouslySetInnerHTML={{ __html: qrDisplay.value }} />
              )}

              {qrDisplay.type === 'img' && (
                <div className="mfa-qr-wrapper">
                  <img src={qrDisplay.value} alt="QR Code MFA" className="mfa-qr-image" />
                </div>
              )}

              {qrDisplay.type === 'none' && (
                <p className="mfa-secret-text">Se o QR não aparecer, use o código manual abaixo.</p>
              )}

              {mfaSetup.secret && (
                <p className="mfa-secret-text">
                  Código manual: <strong>{mfaSetup.secret}</strong>
                </p>
              )}

              <div className="profile-input-wrapper" style={{ marginTop: '14px' }}>
                <i className="bi bi-shield-lock-fill profile-input-icon"></i>
                <input
                  type="text"
                  className="profile-input"
                  placeholder="Digite o código de 6 dígitos"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={mfaLoading}
                />
              </div>

              <button
                className={`two-factor-card-button two-factor-card-button-primary ${mfaCode.length === 6 ? 'mfa-confirm-button-active' : ''}`}
                onClick={handleConfirmMfa}
                disabled={mfaLoading || mfaCode.length !== 6}
              >
                Confirmar ativação
              </button>
            </div>
          )}
        </div>

        <h2 className="configuracoes-group-title">Conta</h2>

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