import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { authFetch } from '../lib/authFetch'
import {
  formatCurrency as formatCurrencyValue,
  formatQuantity as formatQuantityValue,
  formatDate as formatDateValue,
} from '../lib/format'
import './TransactionButton.css'
import './TransactionHistoryTable.css'

function TransactionHistoryTable({
  transactions,
  loading,
  error,
  onRetry,
  onTransactionChanged,
  readOnly = false,
  transactionsApiBase = null,
  modalOverlayClassName = 'transaction-modal-overlay',
}) {
  const { t } = useTranslation(['portfolio', 'common'])
  const [editTransaction, setEditTransaction] = useState(null)
  const [editType, setEditType] = useState('compra')
  const [editPrice, setEditPrice] = useState('')
  const [editQuantity, setEditQuantity] = useState('')
  const [editDate, setEditDate] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState(null)
  const [deleteTransaction, setDeleteTransaction] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const hasModalOpen = useMemo(() => {
    return Boolean(editTransaction || deleteTransaction)
  }, [editTransaction, deleteTransaction])

  const formatCurrency = (value) => {
    return formatCurrencyValue(value) ?? t('common:na')
  }

  const formatQuantity = (value) => {
    return formatQuantityValue(value) ?? t('common:na')
  }

  const formatDate = (value) => {
    return formatDateValue(value) ?? t('common:na')
  }

  const formatType = (value) => {
    if (value === 'buy') return t('common:buy')
    if (value === 'sell') return t('common:sell')
    return t('common:na')
  }

  const formatDateForInput = (value) => {
    if (!value) return ''

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return ''
    }

    return parsed.toISOString().split('T')[0]
  }

  const buildTransactionUrl = (transactionId) => {
    if (transactionsApiBase) {
      return `${transactionsApiBase}/${transactionId}`
    }

    return `api/transactions/${transactionId}`
  }

  const triggerRefresh = async () => {
    if (typeof onTransactionChanged === 'function') {
      await onTransactionChanged()
      return
    }

    if (typeof onRetry === 'function') {
      await onRetry()
    }
  }

  const openEditModal = (transaction) => {
    setEditError(null)
    setEditTransaction(transaction)
    setEditType(transaction.type === 'sell' ? 'venda' : 'compra')
    setEditPrice(String(transaction.price ?? ''))
    setEditQuantity(String(transaction.quantity ?? ''))
    setEditDate(formatDateForInput(transaction.date))
  }

  const closeEditModal = () => {
    if (isEditing) return
    setEditTransaction(null)
    setEditError(null)
  }

  const openDeleteModal = (transaction) => {
    setDeleteError(null)
    setDeleteTransaction(transaction)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return
    setDeleteTransaction(null)
    setDeleteError(null)
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()

    if (!editTransaction?.id) {
      setEditError(t('history.err.invalid'))
      return
    }

    setEditError(null)

    const parsedPrice = Number(editPrice)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setEditError(t('tx.err.price'))
      return
    }

    const parsedQuantity = Number(editQuantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setEditError(t('tx.err.quantity'))
      return
    }

    if (!editDate) {
      setEditError(t('tx.err.date'))
      return
    }

    const payload = {
      type: editType === 'venda' ? 'sell' : 'buy',
      price: parsedPrice,
      quantity: parsedQuantity,
      date: editDate
    }

    try {
      setIsEditing(true)

      const response = await authFetch(buildTransactionUrl(editTransaction.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || t('history.err.edit'))
      }

      await triggerRefresh()
      closeEditModal()
    } catch (error) {
      setEditError(error.message || t('history.err.editGeneric'))
    } finally {
      setIsEditing(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTransaction?.id) {
      setDeleteError(t('history.err.invalid'))
      return
    }

    try {
      setIsDeleting(true)
      setDeleteError(null)

      const response = await authFetch(buildTransactionUrl(deleteTransaction.id), {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || t('history.err.delete'))
      }

      await triggerRefresh()
      closeDeleteModal()
    } catch (error) {
      setDeleteError(error.message || t('history.err.deleteGeneric'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="transaction-history-container">
        <h2 className="transaction-history-title">{t('history.title')}</h2>
        <div className="transaction-history-loading">{t('history.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="transaction-history-container">
        <h2 className="transaction-history-title">{t('history.title')}</h2>
        <div className="transaction-history-error">
          <p>{error}</p>
          <button onClick={onRetry} className="transaction-history-retry-button">
            {t('common:retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="transaction-history-container">
      <h2 className="transaction-history-title">{t('history.title')}</h2>
      <table className="transaction-history-table">
        <thead>
          <tr>
            <th>{t('common:ticker')}</th>
            <th>{t('common:type')}</th>
            <th>{t('common:quantity')}</th>
            <th>{t('common:price')}</th>
            <th>{t('common:total')}</th>
            <th>{t('common:date')}</th>
            {!readOnly && <th>{t('common:actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr className="transaction-history-empty-row">
              <td colSpan={readOnly ? 6 : 7}>{t('history.empty')}</td>
            </tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="transaction-history-row">
                <td className="transaction-history-action-cell">{transaction.ticker || t('common:na')}</td>
                <td className={`transaction-history-type-cell ${transaction.type === 'buy' ? 'is-buy' : 'is-sell'}`}>
                  {formatType(transaction.type)}
                </td>
                <td className="transaction-history-number-cell">{formatQuantity(transaction.quantity)}</td>
                <td className="transaction-history-number-cell">{formatCurrency(transaction.price)}</td>
                <td className="transaction-history-number-cell">{formatCurrency(transaction.total)}</td>
                <td className="transaction-history-date-cell">{formatDate(transaction.date)}</td>
                {!readOnly && (
                  <td className="transaction-history-actions-cell">
                    <button
                      type="button"
                      className="transaction-history-icon-button transaction-history-edit-button"
                      onClick={() => openEditModal(transaction)}
                      title={t('history.editTitle')}
                      aria-label={t('history.editAria')}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      type="button"
                      className="transaction-history-icon-button transaction-history-delete-button"
                      onClick={() => openDeleteModal(transaction)}
                      title={t('history.deleteTitle')}
                      aria-label={t('history.deleteAria')}
                    >
                      <i className="bi bi-trash3-fill"></i>
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!readOnly && editTransaction && createPortal(
        <div className={modalOverlayClassName} onClick={closeEditModal} role="presentation">
          <div
            className="transaction-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('history.editModalAria')}
          >
            <div className="transaction-modal-header">
              <h3>{t('history.editModalTitle')}</h3>
              <button
                type="button"
                className="transaction-close-button"
                onClick={closeEditModal}
                aria-label={t('history.closeEditAria')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleEditSubmit}>
              <div className="transaction-field">
                <label htmlFor="edit-transaction-ticker">{t('tx.stockLabel')}</label>
                <div className="transaction-history-readonly-stock" id="edit-transaction-ticker">
                  <strong>{editTransaction.ticker || t('common:na')}</strong>
                  <span>{editTransaction.company_name || ''}</span>
                </div>
              </div>

              <div className="transaction-grid">
                <div className="transaction-field">
                  <label htmlFor="edit-transaction-type">{t('tx.typeLabel')}</label>
                  <div className="transaction-select-wrapper">
                    <select
                      id="edit-transaction-type"
                      value={editType}
                      onChange={(event) => setEditType(event.target.value)}
                    >
                      <option value="compra">{t('common:buy')}</option>
                      <option value="venda">{t('common:sell')}</option>
                    </select>
                    <i className="bi bi-chevron-down transaction-select-arrow"></i>
                  </div>
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-transaction-price">
                    {editType === 'venda' ? t('tx.priceSell') : t('tx.priceBuy')}
                  </label>
                  <input
                    id="edit-transaction-price"
                    type="number"
                    className="transaction-number-input"
                    step="0.01"
                    min="0"
                    placeholder={t('tx.pricePlaceholder')}
                    value={editPrice}
                    onChange={(event) => setEditPrice(event.target.value)}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-transaction-quantity">{t('common:quantity')}</label>
                  <input
                    id="edit-transaction-quantity"
                    type="number"
                    className="transaction-number-input"
                    min="1"
                    step="1"
                    placeholder={t('tx.qtyPlaceholder')}
                    value={editQuantity}
                    onChange={(event) => setEditQuantity(event.target.value)}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-transaction-date">{t('tx.dateLabel')}</label>
                  <input
                    id="edit-transaction-date"
                    type="date"
                    value={editDate}
                    onChange={(event) => setEditDate(event.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="transaction-submit-button" disabled={isEditing}>
                {isEditing ? t('common:saving') : t('history.saveChanges')}
              </button>

              {editError && (
                <p className="transaction-feedback transaction-feedback-error" role="alert">
                  {editError}
                </p>
              )}
            </form>
          </div>
        </div>,
        document.body
      )}

      {!readOnly && deleteTransaction && createPortal(
        <div className={modalOverlayClassName} onClick={closeDeleteModal} role="presentation">
          <div
            className="transaction-modal-card transaction-history-confirm-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('history.deleteModalAria')}
          >
            <div className="transaction-modal-header">
              <h3>{t('history.deleteModalTitle')}</h3>
              <button
                type="button"
                className="transaction-close-button"
                onClick={closeDeleteModal}
                aria-label={t('history.closeDeleteAria')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="transaction-history-confirm-content">
              <p>
                <Trans
                  i18nKey="history.deleteConfirm"
                  values={{ ticker: deleteTransaction.ticker || t('common:na') }}
                  components={{ strong: <strong /> }}
                />
              </p>

              {deleteError && (
                <p className="transaction-feedback transaction-feedback-error" role="alert">
                  {deleteError}
                </p>
              )}

              <div className="transaction-history-confirm-actions">
                <button
                  type="button"
                  className="transaction-history-cancel-button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="button"
                  className="transaction-history-confirm-delete-button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? t('common:deleting') : t('common:delete')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {hasModalOpen ? <div className="transaction-history-modal-open-spacer" aria-hidden="true" /> : null}
    </div>
  )
}

export default TransactionHistoryTable
