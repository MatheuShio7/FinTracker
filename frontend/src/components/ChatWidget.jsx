import { useEffect, useState } from 'react'
import './ChatWidget.css'

function ChatWidget({ enabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

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
            <p className="chat-widget-placeholder">
              Layout inicial pronto. A integracao com IA sera conectada na proxima etapa.
            </p>
          </div>

          <footer className="chat-widget-footer">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              aria-label="Campo de mensagem"
            />
            <button type="button" disabled aria-label="Enviar mensagem">
              <i className="bi bi-send-fill"></i>
            </button>
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