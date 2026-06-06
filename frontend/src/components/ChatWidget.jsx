import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './ChatWidget.css'

const INITIAL_ASSISTANT_MESSAGE = {
  role: 'assistant',
  text: 'Olá! Como posso te ajudar hoje?',
}

function ChatWidget({ enabled = false }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [messages, setMessages] = useState([INITIAL_ASSISTANT_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      setIsOpen(false)
      setIsMounted(false)
    }
  }, [enabled])

  useEffect(() => {
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
  }, [isOpen, isMounted])

  useEffect(() => {
    setMessages([INITIAL_ASSISTANT_MESSAGE])
    setInputValue('')
    setLoading(false)
    setError('')
  }, [user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, isMounted])

  const handleSendMessage = async (event) => {
    event.preventDefault()

    const trimmedMessage = inputValue.trim()

    if (!trimmedMessage || loading) {
      return
    }

    if (!user?.id) {
      setError('Você precisa estar logado para usar o assistente.')
      return
    }

    const nextHistory = [...messages, { role: 'user', text: trimmedMessage }]

    setMessages(nextHistory)
    setInputValue('')
    setError('')
    setLoading(true)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('chat', {
        body: {
          message: trimmedMessage,
          userId: user.id,
          history: nextHistory,
        },
      })

      if (invokeError) {
        throw invokeError
      }

      const answer = (data?.answer || '').trim()

      if (!answer) {
        throw new Error('Resposta vazia do assistente.')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: answer },
      ])
    } catch (chatError) {
      console.error('Erro ao enviar mensagem ao chat:', chatError)

      const friendlyMessage = 'Não consegui responder agora. Tente novamente em alguns instantes.'

      setError(friendlyMessage)
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: friendlyMessage },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!enabled) {
    return null
  }

  return (
    <>
      {isMounted && (
        <section
          className={`chat-widget-card ${isOpen ? 'is-open' : 'is-closing'}`}
          aria-label="Janela do chat IA"
          aria-hidden={!isOpen}
        >
          <header className="chat-widget-header">
            <div>
              <h3>Assistente IA</h3>
            </div>

            <button
              type="button"
              className="chat-widget-close"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </header>

          <div className="chat-widget-body">
            <div className="chat-widget-messages" aria-live="polite" aria-relevant="additions text">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.text.slice(0, 16)}`}
                  className={`chat-widget-message ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}
                >
                  {message.text}
                </div>
              ))}

              {loading && (
                <div className="chat-widget-message is-assistant is-typing" aria-label="Assistente digitando">
                  <span className="chat-widget-typing-text">digitando</span>
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
              <input
                type="text"
                placeholder={user ? 'Digite sua mensagem...' : 'Faça login para conversar'}
                aria-label="Campo de mensagem"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                disabled={loading || !user}
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim() || !user}
                aria-label="Enviar mensagem"
              >
                {loading ? (
                  <i className="bi bi-hourglass-split"></i>
                ) : (
                  <i className="bi bi-send-fill"></i>
                )}
              </button>
            </form>
          </footer>
        </section>
      )}

      <button
        type="button"
        className={`chat-widget-trigger ${isOpen ? 'is-hidden' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Fechar chat IA' : 'Abrir chat IA'}
        aria-expanded={isOpen}
      >
        <i className="bi bi-robot"></i>
      </button>
    </>
  )
}

export default ChatWidget