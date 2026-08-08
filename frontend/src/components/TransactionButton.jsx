import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { authFetch } from '../lib/authFetch'
import './TransactionButton.css'

const TransactionButton = forwardRef(function TransactionButton(
  {
    className = '',
    onTransactionSaved,
    showTriggerButton = true,
    submitEndpoint = 'api/transactions',
    modalOverlayClassName = 'transaction-modal-overlay',
  },
  ref
) {
  const { t } = useTranslation(['portfolio', 'common'])
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [isStockLocked, setIsStockLocked] = useState(false)
  const [transactionType, setTransactionType] = useState('compra')
  const [isTransactionTypeOpen, setIsTransactionTypeOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)
  const searchRef = useRef(null)

  const priceLabel = useMemo(() => {
    return transactionType === 'venda' ? t('portfolio:tx.priceSell') : t('portfolio:tx.priceBuy')
  }, [transactionType, t])

  const resetForm = () => {
    setSearchTerm('')
    setResults([])
    setShowDropdown(false)
    setSelectedStock(null)
    setIsStockLocked(false)
    setTransactionType('compra')
    setPrice('')
    setQuantity('')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setIsTransactionTypeOpen(false)
  }

  const openModal = (stock = null) => {
    resetForm()

    if (stock) {
      setSelectedStock(stock)
      setSearchTerm(stock.ticker || '')
      setIsStockLocked(true)
    }

    setSubmitError(null)
    setSubmitSuccess(null)
    setIsOpen(true)
  }

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
    openModal()
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowDropdown(false)
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  useImperativeHandle(ref, () => ({
    open: () => openModal(),
    openWithStock: (stock) => openModal(stock),
    close: handleClose
  }))

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

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSubmitError(null)
    setSubmitSuccess(null)

    const stockId = selectedStock?.id
    const stockTicker = selectedStock?.ticker

    if (!stockId && !stockTicker) {
      setSubmitError(t('portfolio:tx.err.selectStock'))
      return
    }

    const parsedPrice = Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setSubmitError(t('portfolio:tx.err.price'))
      return
    }

    const parsedQuantity = Number(quantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setSubmitError(t('portfolio:tx.err.quantity'))
      return
    }

    if (!transactionDate) {
      setSubmitError(t('portfolio:tx.err.date'))
      return
    }

    const payload = {
      ...(stockId ? { stock_id: stockId } : { ticker: stockTicker }),
      type: transactionType === 'venda' ? 'sell' : 'buy',
      price: parsedPrice,
      quantity: parsedQuantity,
      date: transactionDate
    }

    try {
      setIsSubmitting(true)

      const response = await authFetch(submitEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || t('portfolio:tx.err.save'))
      }

      setSubmitSuccess(t('portfolio:tx.success'))

      if (typeof onTransactionSaved === 'function') {
        onTransactionSaved(data.data)
      }

      resetForm()

      window.setTimeout(() => {
        handleClose()
      }, 600)
    } catch (error) {
      setSubmitError(error.message || t('portfolio:tx.err.saveGeneric'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {showTriggerButton && (
        <button
          type="button"
          className={`reload-button transaction-button ${className}`}
          onClick={handleOpen}
          title={t('portfolio:tx.triggerTitle')}
          aria-label={t('portfolio:tx.triggerAria')}
        >
          <i className="bi bi-plus-slash-minus"></i>
          <span>{t('portfolio:tx.trigger')}</span>
        </button>
      )}

      {isOpen && createPortal(
        <div className={modalOverlayClassName} onClick={handleClose} role="presentation">
          <div
            className="transaction-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('portfolio:tx.modalAria')}
          >
            <div className="transaction-modal-header">
              <h3>{t('portfolio:tx.modalTitle')}</h3>
              <button
                type="button"
                className="transaction-close-button"
                onClick={handleClose}
                aria-label={t('portfolio:tx.closeAria')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleSubmit}>
              <div className="transaction-field" ref={searchRef}>
                <label htmlFor="transaction-stock-search">{t('portfolio:tx.stockLabel')}</label>
                {!selectedStock ? (
                  <div className="transaction-search-bar">
                    <i className="bi bi-search transaction-search-icon"></i>
                    <input
                      id="transaction-stock-search"
                      type="text"
                      className="transaction-search-input"
                      placeholder={t('portfolio:tx.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      onFocus={() => searchTerm && setShowDropdown(true)}
                    />
                  </div>
                ) : isStockLocked ? (
                  <div className="transaction-history-readonly-stock">
                    <strong>{selectedStock.ticker}</strong>
                    <span>{selectedStock.company_name}</span>
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
                      aria-label={t('portfolio:tx.removeStockAria')}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                )}

                {showDropdown && !selectedStock && (
                  <div className="transaction-search-dropdown">
                    {isSearching ? (
                      <div className="transaction-result-item loading">{t('portfolio:tx.loading')}</div>
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
                      <div className="transaction-result-item no-results">{t('portfolio:tx.noResults')}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="transaction-grid">
                <div className="transaction-field">
                  <label htmlFor="transaction-type">{t('portfolio:tx.typeLabel')}</label>
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
                      <option value="compra">{t('common:buy')}</option>
                      <option value="venda">{t('common:sell')}</option>
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
                    placeholder={t('portfolio:tx.pricePlaceholder')}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="transaction-quantity">{t('common:quantity')}</label>
                  <input
                    id="transaction-quantity"
                    type="number"
                    className="transaction-number-input"
                    min="1"
                    step="1"
                    placeholder={t('portfolio:tx.qtyPlaceholder')}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="transaction-date">{t('portfolio:tx.dateLabel')}</label>
                  <input
                    id="transaction-date"
                    type="date"
                    value={transactionDate}
                    onChange={(event) => setTransactionDate(event.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="transaction-submit-button" disabled={isSubmitting}>
                {isSubmitting ? t('common:saving') : t('portfolio:tx.submit')}
              </button>

              {submitError && (
                <p className="transaction-feedback transaction-feedback-error" role="alert">
                  {submitError}
                </p>
              )}

              {submitSuccess && (
                <p className="transaction-feedback transaction-feedback-success">
                  {submitSuccess}
                </p>
              )}
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
})

export default TransactionButton
