import { useMemo, useState } from 'react'
import { authFetch } from '../lib/authFetch'
import './TransactionButton.css'
import './TransactionHistoryTable.css'

function TransactionHistoryTable({ transactions, loading, error, onRetry, onTransactionChanged }) {
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
    if (value === null || value === undefined) {
      return 'N/A'
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatQuantity = (value) => {
    if (value === null || value === undefined) {
      return 'N/A'
    }

    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatDate = (value) => {
    if (!value) {
      return 'N/A'
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A'
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
    }).format(parsed)
  }

  const formatType = (value) => {
    if (value === 'buy') return 'Compra'
    if (value === 'sell') return 'Venda'
    return 'N/A'
  }

  const formatDateForInput = (value) => {
    if (!value) return ''

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return ''
    }

    return parsed.toISOString().split('T')[0]
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
      setEditError('Transação inválida.')
      return
    }

    setEditError(null)

    const parsedPrice = Number(editPrice)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setEditError('Informe um preço válido maior que zero.')
      return
    }

    const parsedQuantity = Number(editQuantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setEditError('Informe uma quantidade inteira maior que zero.')
      return
    }

    if (!editDate) {
      setEditError('Informe a data da transação.')
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

      const response = await authFetch(`api/transactions/${editTransaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Não foi possível editar a transação.')
      }

      await triggerRefresh()
      closeEditModal()
    } catch (error) {
      setEditError(error.message || 'Erro ao editar transação.')
    } finally {
      setIsEditing(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTransaction?.id) {
      setDeleteError('Transação inválida.')
      return
    }

    try {
      setIsDeleting(true)
      setDeleteError(null)

      const response = await authFetch(`api/transactions/${deleteTransaction.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Não foi possível excluir a transação.')
      }

      await triggerRefresh()
      closeDeleteModal()
    } catch (error) {
      setDeleteError(error.message || 'Erro ao excluir transação.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="transaction-history-container">
        <h2 className="transaction-history-title">Histórico de Transações</h2>
        <div className="transaction-history-loading">Carregando transações...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="transaction-history-container">
        <h2 className="transaction-history-title">Histórico de Transações</h2>
        <div className="transaction-history-error">
          <p>{error}</p>
          <button onClick={onRetry} className="transaction-history-retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="transaction-history-container">
      <h2 className="transaction-history-title">Histórico de Transações</h2>
      <table className="transaction-history-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Tipo</th>
            <th>Quantidade</th>
            <th>Preço</th>
            <th>Total</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr className="transaction-history-empty-row">
              <td colSpan="7">Nenhuma transação encontrada</td>
            </tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="transaction-history-row">
                <td className="transaction-history-action-cell">{transaction.ticker || 'N/A'}</td>
                <td className={`transaction-history-type-cell ${transaction.type === 'buy' ? 'is-buy' : 'is-sell'}`}>
                  {formatType(transaction.type)}
                </td>
                <td className="transaction-history-number-cell">{formatQuantity(transaction.quantity)}</td>
                <td className="transaction-history-number-cell">{formatCurrency(transaction.price)}</td>
                <td className="transaction-history-number-cell">{formatCurrency(transaction.total)}</td>
                <td className="transaction-history-date-cell">{formatDate(transaction.date)}</td>
                <td className="transaction-history-actions-cell">
                  <button
                    type="button"
                    className="transaction-history-icon-button transaction-history-edit-button"
                    onClick={() => openEditModal(transaction)}
                    title="Editar transação"
                    aria-label="Editar transação"
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  <button
                    type="button"
                    className="transaction-history-icon-button transaction-history-delete-button"
                    onClick={() => openDeleteModal(transaction)}
                    title="Excluir transação"
                    aria-label="Excluir transação"
                  >
                    <i className="bi bi-trash3-fill"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {editTransaction && (
        <div className="transaction-modal-overlay" onClick={closeEditModal} role="presentation">
          <div
            className="transaction-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Editar transação"
          >
            <div className="transaction-modal-header">
              <h3>Editar Transação</h3>
              <button
                type="button"
                className="transaction-close-button"
                onClick={closeEditModal}
                aria-label="Fechar modal de edição"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleEditSubmit}>
              <div className="transaction-field">
                <label htmlFor="edit-transaction-ticker">Ação</label>
                <div className="transaction-history-readonly-stock" id="edit-transaction-ticker">
                  <strong>{editTransaction.ticker || 'N/A'}</strong>
                  <span>{editTransaction.company_name || ''}</span>
                </div>
              </div>

              <div className="transaction-grid">
                <div className="transaction-field">
                  <label htmlFor="edit-transaction-type">Tipo de Transação</label>
                  <div className="transaction-select-wrapper">
                    <select
                      id="edit-transaction-type"
                      value={editType}
                      onChange={(event) => setEditType(event.target.value)}
                    >
                      <option value="compra">Compra</option>
                      <option value="venda">Venda</option>
                    </select>
                    <i className="bi bi-chevron-down transaction-select-arrow"></i>
                  </div>
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-transaction-price">
                    {editType === 'venda' ? 'Preço de Venda (1 un)' : 'Preço de Compra (1 un)'}
                  </label>
                  <input
                    id="edit-transaction-price"
                    type="number"
                    className="transaction-number-input"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editPrice}
                    onChange={(event) => setEditPrice(event.target.value)}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-transaction-quantity">Quantidade</label>
                  <input
                    id="edit-transaction-quantity"
                    type="number"
                    className="transaction-number-input"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={editQuantity}
                    onChange={(event) => setEditQuantity(event.target.value)}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-transaction-date">Data da Transação</label>
                  <input
                    id="edit-transaction-date"
                    type="date"
                    value={editDate}
                    onChange={(event) => setEditDate(event.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="transaction-submit-button" disabled={isEditing}>
                {isEditing ? 'Salvando...' : 'Salvar Alterações'}
              </button>

              {editError && (
                <p className="transaction-feedback transaction-feedback-error" role="alert">
                  {editError}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {deleteTransaction && (
        <div className="transaction-modal-overlay" onClick={closeDeleteModal} role="presentation">
          <div
            className="transaction-modal-card transaction-history-confirm-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar exclusão"
          >
            <div className="transaction-modal-header">
              <h3>Excluir Transação</h3>
              <button
                type="button"
                className="transaction-close-button"
                onClick={closeDeleteModal}
                aria-label="Fechar modal de exclusão"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="transaction-history-confirm-content">
              <p>
                Você tem certeza que deseja excluir a transação de <strong>{deleteTransaction.ticker || 'N/A'}</strong>?
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
                  Cancelar
                </button>
                <button
                  type="button"
                  className="transaction-history-confirm-delete-button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasModalOpen ? <div className="transaction-history-modal-open-spacer" aria-hidden="true" /> : null}
    </div>
  )
}

export default TransactionHistoryTable
