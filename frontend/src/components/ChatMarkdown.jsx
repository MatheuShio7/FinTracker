import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'

const STATIC_ROUTES = 'carteira|explorar|grupos|configuracoes|login|cadastro'
/** Tickers B3 comuns: PETR4, VALE3, MXRF11, etc. */
const TICKER_PATH = '[A-Za-z]{4}\\d[A-Za-z]?|[A-Za-z]{5,6}\\d{1,2}'

const BARE_INTERNAL_PATH_RE = new RegExp(
  `(?<!\\]\\()(?<![\\w/])(/(?:${STATIC_ROUTES})(?:\\?[^\\s)\\]]*)?|/(?:${TICKER_PATH}))(?![\\w/])`,
  'gi',
)

function linkifyInternalPaths(text) {
  return text.replace(BARE_INTERNAL_PATH_RE, '[$1]($1)')
}

function isInternalHref(href) {
  return typeof href === 'string' && href.startsWith('/')
}

function ChatMarkdown({ text, onNavigate }) {
  const content = linkifyInternalPaths(text || '')

  return (
    <div className="chat-widget-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (isInternalHref(href)) {
              return (
                <Link
                  to={href}
                  className="chat-widget-md-link"
                  onClick={() => onNavigate?.()}
                >
                  {children}
                </Link>
              )
            }

            return (
              <a
                href={href}
                className="chat-widget-md-link is-external"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            )
          },
          h1: ({ children }) => <p className="chat-widget-md-heading">{children}</p>,
          h2: ({ children }) => <p className="chat-widget-md-heading">{children}</p>,
          h3: ({ children }) => <p className="chat-widget-md-heading">{children}</p>,
          h4: ({ children }) => <p className="chat-widget-md-heading">{children}</p>,
          img: () => null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default ChatMarkdown
