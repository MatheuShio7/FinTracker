import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePortfolio } from '../contexts/PortfolioContext'
import { buildApiUrl } from '../config/api'
import './StockEditor.css'

function StockEditor({ ticker }) {
  const { user } = useAuth()
  const { removeFromPortfolio } = usePortfolio()
  
  // Estados dos campos
  const [quantity, setQuantity] = useState(0)
  const [notes, setNotes] = useState('')
  
  // Estados originais (para detectar mudanças)
  const [originalQuantity, setOriginalQuantity] = useState(0)
  const [originalNotes, setOriginalNotes] = useState('')
  
  // Estados de carregamento e erro
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Detectar se houve mudanças
  const hasChanges = quantity !== originalQuantity || notes !== originalNotes
  
  // Buscar dados ao montar o componente
  useEffect(() => {
    if (!ticker || !user) return
    
    const fetchData = async () => {
      setLoading(true)
      setError('')
      
      try {
        console.log(`🔄 Buscando quantidade e observações para ${ticker}...`)
        
        // Buscar quantidade
        const quantityResponse = await fetch(
          buildApiUrl(`api/portfolio/quantity/${ticker}?user_id=${user.id}`)
        )
        const quantityData = await quantityResponse.json()
        
        // Buscar observações
        const notesResponse = await fetch(
          buildApiUrl(`api/notes/${ticker}?user_id=${user.id}`)
        )
        const notesData = await notesResponse.json()
        
        if (quantityResponse.ok && quantityData.status === 'success') {
          const qty = quantityData.quantity || 0
          setQuantity(qty)
          setOriginalQuantity(qty)
          console.log(`✅ Quantidade carregada: ${qty}`)
        }
        
        if (notesResponse.ok && notesData.status === 'success') {
          const note = notesData.note_text || ''
          setNotes(note)
          setOriginalNotes(note)
          console.log(`✅ Observação carregada: ${note ? 'Sim' : 'Não'}`)
        }
        
      } catch (err) {
        console.error('❌ Erro ao buscar dados:', err)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [ticker, user])
  
  // Aumentar quantidade
  const handleIncrease = () => {
    setQuantity(prev => prev + 1)
  }
  
  // Diminuir quantidade (mínimo 0)
  const handleDecrease = () => {
    setQuantity(prev => Math.max(0, prev - 1))
  }
  
  // Atualizar quantidade via input
  const handleQuantityChange = (e) => {
    const value = e.target.value
    
    // Permitir campo vazio para edição
    if (value === '') {
      setQuantity('')
      return
    }
    
    // Validar que é número inteiro não negativo
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantity(numValue)
    }
  }
  
  // Corrigir campo vazio ao perder foco
  const handleQuantityBlur = () => {
    if (quantity === '' || quantity < 0) {
      setQuantity(0)
    }
  }
  
  // Salvar alterações
  const handleSave = async () => {
    if (!user) {
      setError('Você precisa estar logado para salvar')
      return
    }
    
    if (!hasChanges) {
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      console.log(`💾 Salvando alterações para ${ticker}...`)
      console.log(`Quantidade: ${originalQuantity} → ${quantity}`)
      console.log(`Observação: ${originalNotes ? 'Sim' : 'Não'} → ${notes ? 'Sim' : 'Não'}`)
      
      // Salvar quantidade
      const quantityResponse = await fetch(
        buildApiUrl('api/portfolio/update-quantity'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            ticker: ticker,
            quantity: quantity === '' ? 0 : parseInt(quantity, 10)
          })
        }
      )
      
      const quantityData = await quantityResponse.json()
      
      if (!quantityResponse.ok || quantityData.status !== 'success') {
        throw new Error(quantityData.message || 'Erro ao atualizar quantidade')
      }
      
      console.log(`✅ Quantidade salva: ${quantityData.quantity}`)
      
      // Salvar observação (trim para limpar espaços)
      const notesTrimmed = notes.trim()
      
      const notesResponse = await fetch(
        buildApiUrl('api/notes/save'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            ticker: ticker,
            note_text: notesTrimmed
          })
        }
      )
      
      const notesData = await notesResponse.json()
      
      if (!notesResponse.ok || notesData.status !== 'success') {
        throw new Error(notesData.message || 'Erro ao salvar observação')
      }
      
      console.log(`✅ Observação salva com sucesso!`)
      
      // Se a observação foi deletada (campo vazio), atualizar states
      if (!notesTrimmed) {
        console.log(`🗑️ Observação removida do banco (campo vazio)`)
      }
      
      // Atualizar estados originais com os valores retornados do backend
      setOriginalQuantity(quantityData.quantity)
      setOriginalNotes(notesData.note_text || '')
      
      // Atualizar o campo atual com o valor limpo
      setNotes(notesData.note_text || '')
      
      // Se a quantidade foi zerada, notificar o PortfolioContext para invalidar caches
      if (quantityData.quantity === 0) {
        console.log('🗑️ Quantidade zerada - removendo do cache do portfolio')
        removeFromPortfolio(ticker)
      }
      
      console.log('✅ Alterações salvas com sucesso!')
      
    } catch (err) {
      console.error('❌ Erro ao salvar:', err)
      setError(err.message || 'Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="stock-editor">
        <div className="stock-editor-loading">
          Carregando...
        </div>
      </div>
    )
  }
  
  return (
    <div className="stock-editor">
      {error && (
        <div className="stock-editor-error">
          {error}
        </div>
      )}
      
      {/* Container dos campos lado a lado */}
      <div className="stock-editor-fields-container">
        {/* Campo de Quantidade */}
        <div className="stock-editor-field quantity-field">
          <label className="stock-editor-label">Quantidade</label>
          
          <div className="quantity-input-container">
            <input
              type="number"
              className="quantity-input"
              value={quantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              min="0"
              disabled={saving}
            />
            
            <div className="quantity-buttons">
              <button
                className="quantity-btn quantity-btn-increase"
                onClick={handleIncrease}
                disabled={saving}
                aria-label="Aumentar quantidade"
              >
                <i className="bi bi-plus"></i>
              </button>
              <button
                className="quantity-btn quantity-btn-decrease"
                onClick={handleDecrease}
                disabled={saving}
                aria-label="Diminuir quantidade"
              >
                <i className="bi bi-dash"></i>
              </button>
            </div>
          </div>
        </div>
        
        {/* Campo de Observações */}
        <div className="stock-editor-field notes-field">
          <label className="stock-editor-label">Observações</label>
          
          <textarea
            className="notes-textarea"
            placeholder={`Observações sobre ${ticker}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            disabled={saving}
          />
        </div>
      </div>
      
      {/* Botão Salvar */}
      <button
        className={`save-button ${hasChanges && !saving ? 'save-button-active' : ''}`}
        onClick={handleSave}
        disabled={!hasChanges || saving}
      >
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </div>
  )
}

export default StockEditor

