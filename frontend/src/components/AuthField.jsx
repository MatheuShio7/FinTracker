import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Campo de formulário das telas de autenticação: label, ícone à esquerda e,
 * para senhas, botão de mostrar/ocultar. Demais props vão direto ao <input>.
 */
function AuthField({ id, label, icon, type = 'text', hint, labelAction, ...inputProps }) {
  const { t } = useTranslation('auth')
  const [visible, setVisible] = useState(false)

  const isPassword = type === 'password'
  const inputType = isPassword && visible ? 'text' : type

  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label htmlFor={id} className="auth-label">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="auth-field-control">
        <i className={`bi ${icon} auth-field-icon`} aria-hidden="true"></i>
        <input
          id={id}
          type={inputType}
          className={`auth-input ${isPassword ? 'has-toggle' : ''}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-toggle-visibility"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? t('hidePassword') : t('showPassword')}
            aria-pressed={visible}
          >
            <i className={`bi ${visible ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
          </button>
        )}
      </div>

      {hint && <span className="auth-hint">{hint}</span>}
    </div>
  )
}

export default AuthField
