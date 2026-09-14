import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ChatMarkdown from './ChatMarkdown'
import './ChatWidget.css'

function ChatWidget({ enabled = false, variant = 'widget' }) {
  const { t, i18n } = useTranslation('chat')
  const { user } = useAuth()
  const isPage = variant === 'page'
  const [isOpen, setIsOpen] = useState(isPage)
  const [isMounted, setIsMounted] = useState(isPage)
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', text: t('initialMessage') },
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const cursorPositionRef = useRef(null)

  const moveCursorToEnd = () => {
    const input = inputRef.current

    if (!input) {
      return
    }

    const length = input.value.length
    input.setSelectionRange(length, length)
    cursorPositionRef.current = length
  }

  const adjustTextareaHeight = () => {
    const input = inputRef.current

    if (!input) {
      return
    }

    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`
  }

  const resetTextareaHeight = () => {
    const input = inputRef.current

    if (!input) {
      return
    }

    input.style.height = 'auto'
  }

  useEffect(() => {
    if (isPage) {
      setIsOpen(true)
      setIsMounted(true)
      return
    }

    if (!enabled) {
      setIsOpen(false)
      setIsMounted(false)
    }
  }, [enabled, isPage])

  useEffect(() => {
    if (isPage) {
      return undefined
    }

    let closeTimer

    if (isOpen) {
      setIsMounted(true)
    } else if (isMounted) {
      closeTimer = window.setTimeout(() => {
        setIsMounted(false)
      }, 320)
    }

    return () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer)
      }
    }
  }, [isOpen, isMounted, isPage])

  useEffect(() => {
    setMessages([{ role: 'assistant', text: t('initialMessage') }])
    setInputValue('')
    setLoading(false)
    setError('')
  }, [user?.id, t])

  // Atualiza a mensagem inicial ao trocar idioma, sem apagar a conversa
  useEffect(() => {
    setMessages((currentMessages) => {
      if (currentMessages.length === 1 && currentMessages[0].role === 'assistant') {
        return [{ role: 'assistant', text: t('initialMessage') }]
      }
      return currentMessages
    })
  }, [i18n.language, t])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, isMounted])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible'
        && inputRef.current?.value
        && document.activeElement === inputRef.current
      ) {
        moveCursorToEnd()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useLayoutEffect(() => {
    if (inputRef.current && cursorPositionRef.current !== null) {
      inputRef.current.setSelectionRange(
        cursorPositionRef.current,
        cursorPositionRef.current,
      )
    }

    adjustTextareaHeight()
  }, [inputValue])

  const handleInputChange = (event) => {
    cursorPositionRef.current = event.target.selectionStart
    setInputValue(event.target.value)
  }

  const handleInputFocus = (event) => {
    const { selectionStart, selectionEnd, value } = event.target

    if (value.length > 0 && selectionStart === 0 && selectionEnd === 0) {
      moveCursorToEnd()
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()

    const trimmedMessage = inputValue.trim()

    if (!trimmedMessage || loading) {
      return
    }

    if (!user?.id) {
      setError(t('loginRequired'))
      return
    }

    const nextHistory = [...messages, { role: 'user', text: trimmedMessage }]

    setMessages(nextHistory)
    setInputValue('')
    cursorPositionRef.current = null
    resetTextareaHeight()
    setError('')
    setLoading(true)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('chat', {
        body: {
          message: trimmedMessage,
          userId: user.id,
          history: nextHistory,
          language: i18n.language?.startsWith('en') ? 'en' : 'pt-BR',
        },
      })

      if (invokeError) {
        throw invokeError
      }

      const answer = (data?.answer || '').trim()

      if (!answer) {
        throw new Error(t('emptyAnswer'))
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: answer },
      ])
    } catch (chatError) {
      console.error('Erro ao enviar mensagem ao chat:', chatError)

      const friendlyMessage = t('error')

      setError(friendlyMessage)
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: friendlyMessage },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage(event)
    }
  }

  if (!enabled) {
    return null
  }

  const conversation = (
    <>
      <header className="chat-widget-header">
        <div>
          <h3>{t('title')}</h3>
        </div>

        {!isPage && (
          <button
            type="button"
            className="chat-widget-close"
            onClick={() => setIsOpen(false)}
            aria-label={t('closeAria')}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </header>

      <div className="chat-widget-body">
        <div className="chat-widget-messages" aria-live="polite" aria-relevant="additions text">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.text.slice(0, 16)}`}
              className={`chat-widget-message ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}
            >
              {message.role === 'assistant' ? (
                <ChatMarkdown
                  text={message.text}
                  onNavigate={isPage ? undefined : () => setIsOpen(false)}
                />
              ) : (
                message.text
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-widget-message is-assistant is-typing" aria-label={t('typingAria')}>
              <span className="chat-widget-typing-text">{t('typing')}</span>
              <span className="chat-widget-typing-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="chat-widget-error" role="alert">
          {error}
        </div>
      )}

      <footer className="chat-widget-footer">
        <form className="chat-widget-form" onSubmit={handleSendMessage}>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder={user ? t('placeholderLoggedIn') : t('placeholderLoggedOut')}
            aria-label={t('inputAria')}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            disabled={loading || !user}
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim() || !user}
            aria-label={t('sendAria')}
          >
            {loading ? (
              <i className="bi bi-hourglass-split"></i>
            ) : (
              <i className="bi bi-send-fill"></i>
            )}
          </button>
        </form>
      </footer>
    </>
  )

  if (isPage) {
    return (
      <section className="chat-widget-page" aria-label={t('windowAria')}>
        {conversation}
      </section>
    )
  }

  return (
    <>
      {isMounted && (
        <section
          className={`chat-widget-card ${isOpen ? 'is-open' : 'is-closing'}`}
          aria-label={t('windowAria')}
          aria-hidden={!isOpen}
        >
          {conversation}
        </section>
      )}

      <button
        type="button"
        className={`chat-widget-trigger ${isOpen ? 'is-hidden' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? t('closeTriggerAria') : t('openAria')}
        aria-expanded={isOpen}
      >
        <i className="bi bi-robot"></i>
      </button>
    </>
  )
}

export default ChatWidget
