import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { authFetch } from '../lib/authFetch'
import ReloadButton from './ReloadButton'
import TransactionButton from './TransactionButton'
import PortfolioTable from './PortfolioTable'
import PortfolioPieChart from './PortfolioPieChart'
import TransactionHistoryTable from './TransactionHistoryTable'
import './MemberWalletModal.css'

function MemberWalletModal({ groupId, member, currentUserId, isOpen, onClose }) {
  const { t } = useTranslation(['groups', 'common'])
  const [portfolioData, setPortfolioData] = useState([])
  const [transactions, setTransactions] = useState([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const transactionsApiBase = useMemo(() => {
    if (!groupId || !member?.user_id) {
      return null
    }

    return `api/groups/${groupId}/members/${member.user_id}/transactions`
  }, [groupId, member?.user_id])

  const applyWalletData = useCallback((walletData) => {
    if (!walletData) {
      return
    }

    setPortfolioData(walletData.portfolio || [])
    setTransactions(walletData.transactions || [])
    if (typeof walletData.canManage === 'boolean') {
      setCanManage(walletData.canManage)
    }
  }, [])

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
        throw new Error(data.message || t('groups:wallet.loadError'))
      }

      applyWalletData(data.data)
    } catch (walletErr) {
      console.error('Erro ao carregar carteira do membro:', walletErr)
      setError(walletErr.message || t('common:serverError'))
      setPortfolioData([])
      setTransactions([])
      setCanManage(false)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [groupId, member?.user_id, applyWalletData, t])

  const handleWalletUpdated = useCallback((walletData) => {
    if (walletData?.portfolio || walletData?.transactions) {
      applyWalletData(walletData)
      return
    }

    fetchWallet(true)
  }, [applyWalletData, fetchWallet])

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
    ? `${member.name} ${t('common:you')}`
    : member.name

  const elevatedModalOverlayClassName = 'transaction-modal-overlay transaction-modal-overlay-elevated'

  return createPortal(
    <div className="grupos-modal-overlay grupos-wallet-overlay" onClick={onClose} role="presentation">
      <div
        className="grupos-modal-card grupos-wallet-modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('groups:wallet.aria', { name: member.name })}
      >
        <div className="grupos-details-header grupos-wallet-header">
          <div className="grupos-wallet-title-row">
            <h3>{t('groups:wallet.title', { name: memberLabel })}</h3>
            <span
              className={`grupos-wallet-mode-badge ${
                canManage ? 'grupos-wallet-mode-badge-manage' : 'grupos-wallet-mode-badge-readonly'
              }`}
            >
              {canManage ? t('groups:wallet.manageable') : t('groups:wallet.readonly')}
            </span>
          </div>
          <div className="grupos-wallet-header-actions">
            {canManage && transactionsApiBase && (
              <TransactionButton
                className="grupos-wallet-transaction-button"
                submitEndpoint={transactionsApiBase}
                modalOverlayClassName={elevatedModalOverlayClassName}
                onTransactionSaved={handleWalletUpdated}
              />
            )}
            <ReloadButton
              onClick={() => fetchWallet(true)}
              isLoading={isRefreshing}
              className="grupos-wallet-reload-button"
            />
            <button
              type="button"
              className="grupos-close-button"
              onClick={onClose}
              aria-label={t('groups:wallet.closeAria')}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div className="grupos-wallet-body">
          <section className="grupos-wallet-section">
            <PortfolioTable
              portfolioData={portfolioData}
              loading={loading}
              error={error}
              onRetry={() => fetchWallet(true)}
              readOnly
            />
          </section>

          <section className="grupos-wallet-section grupos-wallet-chart-section">
            <PortfolioPieChart portfolio={portfolioData} compact />
          </section>

          <section className="grupos-wallet-section grupos-wallet-history-section">
            <TransactionHistoryTable
              transactions={transactions}
              loading={loading}
              error={error}
              onRetry={() => fetchWallet(true)}
              onTransactionChanged={() => fetchWallet(true)}
              readOnly={!canManage}
              transactionsApiBase={canManage ? transactionsApiBase : null}
              modalOverlayClassName={elevatedModalOverlayClassName}
            />
          </section>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default MemberWalletModal
