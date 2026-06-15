import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '../lib/authFetch'
import ReloadButton from './ReloadButton'
import PortfolioTable from './PortfolioTable'
import PortfolioPieChart from './PortfolioPieChart'
import TransactionHistoryTable from './TransactionHistoryTable'
import './MemberWalletModal.css'

function MemberWalletModal({ groupId, member, currentUserId, isOpen, onClose }) {
  const [portfolioData, setPortfolioData] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchWallet = useCallback(async (showRefreshSpinner = false) => {
    if (!groupId || !member?.user_id) {
      return
    }

    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await authFetch(
        `api/groups/${groupId}/members/${member.user_id}/wallet`
      )
      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Erro ao carregar carteira do membro')
      }

      setPortfolioData(data.data?.portfolio || [])
      setTransactions(data.data?.transactions || [])
    } catch (walletErr) {
      console.error('Erro ao carregar carteira do membro:', walletErr)
      setError(walletErr.message || 'Erro ao conectar com o servidor')
      setPortfolioData([])
      setTransactions([])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [groupId, member?.user_id])

  useEffect(() => {
    if (!isOpen || !member?.user_id) {
      return
    }

    fetchWallet()
  }, [isOpen, member?.user_id, fetchWallet])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen || !member) {
    return null
  }

  const memberLabel = member.user_id === currentUserId
    ? `${member.name} (Você)`
    : member.name

  return (
    <div className="grupos-modal-overlay grupos-wallet-overlay" onClick={onClose} role="presentation">
      <div
        className="grupos-modal-card grupos-wallet-modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Carteira de ${member.name}`}
      >
        <div className="grupos-details-header grupos-wallet-header">
          <div className="grupos-wallet-title-row">
            <h3>Carteira de {memberLabel}</h3>
            <span className="grupos-wallet-readonly-badge">Somente leitura</span>
          </div>
          <div className="grupos-wallet-header-actions">
            <ReloadButton
              onClick={() => fetchWallet(true)}
              isLoading={isRefreshing}
              className="grupos-wallet-reload-button"
            />
            <button
              type="button"
              className="grupos-close-button"
              onClick={onClose}
              aria-label="Fechar carteira do membro"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div className="grupos-wallet-body">
          <PortfolioTable
            portfolioData={portfolioData}
            loading={loading}
            error={error}
            onRetry={() => fetchWallet(true)}
            readOnly
          />
          <PortfolioPieChart portfolio={portfolioData} />
          <TransactionHistoryTable
            transactions={transactions}
            loading={loading}
            error={error}
            onRetry={() => fetchWallet(true)}
            readOnly
          />
        </div>
      </div>
    </div>
  )
}

export default MemberWalletModal
