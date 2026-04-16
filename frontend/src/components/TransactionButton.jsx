import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import './TransactionButton.css'

function TransactionButton({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [transactionType, setTransactionType] = useState('compra')
  const [isTransactionTypeOpen, setIsTransactionTypeOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0])
  const searchRef = useRef(null)

  const priceLabel = useMemo(() => {
    return transactionType === 'venda' ? 'Preço de Venda' : 'Preço de Compra'
  }, [transactionType])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    if (searchTerm.trim() === '') {
      setResults([])
      setShowDropdown(false)
      return undefined
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      setShowDropdown(true)

      try {
        const { data, error } = await supabase
          .from('stocks')
          .select('id, ticker, company_name')
          .or(`ticker.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
          .limit(6)

        if (error) {
          console.error('Erro ao buscar acoes para transacao:', error)
          setResults([])
        } else {
          setResults(data || [])
        }
      } catch (error) {
        console.error('Erro na busca de acoes para transacao:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [isOpen, searchTerm])

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowDropdown(false)
  }

  const handleSelectStock = (stock) => {
    setSelectedStock(stock)
    setSearchTerm(stock.ticker)
    setShowDropdown(false)
  }

  const handleClearSelectedStock = () => {
    setSelectedStock(null)
    setSearchTerm('')
    setResults([])
    setShowDropdown(false)
  }

  const handleTransactionTypeMouseDown = (event) => {
    const isAlreadyFocused = document.activeElement === event.currentTarget

    if (isAlreadyFocused) {
      setIsTransactionTypeOpen((prev) => !prev)
      return
    }

    setIsTransactionTypeOpen(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log('Frontend only: transacao ainda sem integracao com backend', {
      selectedStock,
      transactionType,
      price,
      quantity,
      transactionDate,
    })
  }

  return (
    <>
      <button
        type="button"
        className={`reload-button transaction-button ${className}`}
        onClick={handleOpen}
        title="Nova transacao"
        aria-label="Nova transacao"
      >
        <i className="bi bi-plus-lg"></i>
        <span>Transação</span>
      </button>

      {isOpen && (
        <div className="transaction-modal-overlay" onClick={handleClose} role="presentation">
          <div
            className="transaction-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Nova transacao"
          >
            <div className="transaction-modal-header">
              <h3>Nova Transação</h3>
              <button
                type="button"
                className="transaction-close-button"
                onClick={handleClose}
                aria-label="Fechar modal de transacao"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleSubmit}>
              <div className="transaction-field" ref={searchRef}>
                <label htmlFor="transaction-stock-search">Ação</label>
                {!selectedStock ? (
                  <div className="transaction-search-bar">
                    <i className="bi bi-search transaction-search-icon"></i>
                    <input
                      id="transaction-stock-search"
                      type="text"
                      className="transaction-search-input"
                      placeholder="Pesquisar ticker ou empresa"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      onFocus={() => searchTerm && setShowDropdown(true)}
                    />
                  </div>

                ) : (
                  <div className="transaction-selected-stock">
                    <div className="transaction-selected-stock-info">
                      <strong>{selectedStock.ticker}</strong>
                      <span>{selectedStock.company_name}</span>
                    </div>
                    <button
                      type="button"
                      className="transaction-selected-stock-remove"
                      onClick={handleClearSelectedStock}
                      aria-label="Remover ação selecionada"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                )}

                {showDropdown && !selectedStock && (
                  <div className="transaction-search-dropdown">
                    {isSearching ? (
                      <div className="transaction-result-item loading">Carregando...</div>
                    ) : results.length > 0 ? (
                      results.map((stock) => (
                        <button
                          key={stock.id}
                          type="button"
                          className="transaction-result-item"
                          onClick={() => handleSelectStock(stock)}
                        >
                          <span className="transaction-result-ticker">{stock.ticker}</span>
                          <span className="transaction-result-company">{stock.company_name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="transaction-result-item no-results">Nenhuma ação encontrada</div>
                    )}
                  </div>
                )}
              </div>

              <div className="transaction-grid">
                <div className="transaction-field">
                  <label htmlFor="transaction-type">Tipo de Transação</label>
                  <div className={`transaction-select-wrapper ${isTransactionTypeOpen ? 'open' : ''}`}>
                    <select
                      id="transaction-type"
                      value={transactionType}
                      onMouseDown={handleTransactionTypeMouseDown}
                      onFocus={() => setIsTransactionTypeOpen(true)}
                      onBlur={() => setIsTransactionTypeOpen(false)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape' || event.key === 'Tab') {
                          setIsTransactionTypeOpen(false)
                        }
                      }}
                      onChange={(event) => {
                        setTransactionType(event.target.value)
                        setIsTransactionTypeOpen(false)
                      }}
                    >
                      <option value="compra">Compra</option>
                      <option value="venda">Venda</option>
                    </select>
                    <i className="bi bi-chevron-down transaction-select-arrow"></i>
                  </div>
                </div>

                <div className="transaction-field">
                  <label htmlFor="transaction-price">{priceLabel}</label>
                  <input
                    id="transaction-price"
                    type="number"
                    className="transaction-number-input"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="transaction-quantity">Quantidade</label>
                  <input
                    id="transaction-quantity"
                    type="number"
                    className="transaction-number-input"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="transaction-date">Data da Transação</label>
                  <input
                    id="transaction-date"
                    type="date"
                    value={transactionDate}
                    onChange={(event) => setTransactionDate(event.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="transaction-submit-button">
                Salvar Transação
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default TransactionButton