import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { buildApiUrl } from '../config/api';
import { supabase } from '../lib/supabase';
import './SearchBar.css';

function SearchBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadPortfolioData, checkStocksStatus, addToPortfolio, removeFromPortfolio, addToWatchlist, removeFromWatchlist } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingToPortfolio, setAddingToPortfolio] = useState(null); // ticker em processo
  const [addingToWatchlist, setAddingToWatchlist] = useState(null); // ticker em processo
  const [stocksStatus, setStocksStatus] = useState({}); // status de cada ação {ticker: {in_portfolio, in_watchlist}}
  const searchRef = useRef(null);

  // Carregar dados do portfolio ao montar o componente
  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user, loadPortfolioData]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar ações no Supabase
  useEffect(() => {
    const searchStocks = async () => {
      if (searchTerm.trim() === '') {
        setResults([]);
        setShowDropdown(false);
        setStocksStatus({});
        return;
      }

      setIsLoading(true);
      setShowDropdown(true);

      try {
        const { data, error } = await supabase
          .from('stocks')
          .select('id, ticker, company_name')
          .or(`ticker.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
          .limit(5);

        if (error) {
          console.error('Erro ao buscar ações:', error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (error) {
        console.error('Erro na busca:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce: aguarda 300ms após o usuário parar de digitar
    const timeoutId = setTimeout(() => {
      searchStocks();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Verificar status das ações (usando cache local)
  useEffect(() => {
    if (!user || results.length === 0) {
      setStocksStatus({});
      return;
    }

    const tickers = results.map(stock => stock.ticker);
    const status = checkStocksStatus(tickers);
    setStocksStatus(status);
    console.log('📦 Status verificado via cache local');
  }, [results, user, checkStocksStatus]);

  const handleResultClick = (stock) => {
    setShowDropdown(false);
    setSearchTerm('');
    navigate(`/${stock.ticker}`, { state: { from: 'Explorar' } });
  };

  const handleTogglePortfolio = async (ticker, e) => {
    e.stopPropagation();

    if (!user) {
      alert('Você precisa estar logado para gerenciar sua carteira!');
      return;
    }

    const isInPortfolio = stocksStatus[ticker]?.in_portfolio || false;
    setAddingToPortfolio(ticker);

    try {
      if (isInPortfolio) {
        // Remover da carteira
        const response = await fetch(buildApiUrl(`api/portfolio/remove/${ticker}?user_id=${user.id}`), {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.status === 'success') {
          console.log('🗑️ Carteira:', data.message);
          // Atualizar cache local
          removeFromPortfolio(ticker);
          // Atualizar estado local da UI
          setStocksStatus(prev => ({
            ...prev,
            [ticker]: { ...prev[ticker], in_portfolio: false }
          }));
        } else {
          console.error('❌ Carteira:', data.message);
          alert(data.message);
        }
      } else {
        // Adicionar à carteira
        const response = await fetch(buildApiUrl('api/portfolio/add'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            ticker: ticker
          })
        });

        const data = await response.json();

        if (data.status === 'success') {
          console.log('✅ Carteira:', data.message);
          // Atualizar cache local
          addToPortfolio(ticker);
          // Atualizar estado local da UI
          setStocksStatus(prev => ({
            ...prev,
            [ticker]: { ...prev[ticker], in_portfolio: true }
          }));
        } else {
          console.error('❌ Carteira:', data.message);
          alert(data.message);
        }
      }
    } catch (error) {
      console.error('Erro ao gerenciar carteira:', error);
      alert('Erro ao gerenciar carteira. Tente novamente.');
    } finally {
      setAddingToPortfolio(null);
    }
  };

  const handleToggleWatchlist = async (ticker, e) => {
    e.stopPropagation();

    if (!user) {
      alert('Você precisa estar logado para gerenciar sua watchlist!');
      return;
    }

    const isInWatchlist = stocksStatus[ticker]?.in_watchlist || false;
    setAddingToWatchlist(ticker);

    try {
      if (isInWatchlist) {
        // Remover da watchlist
        const response = await fetch(buildApiUrl(`api/watchlist/remove/${ticker}?user_id=${user.id}`), {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.status === 'success') {
          console.log('🗑️ Watchlist:', data.message);
          // Atualizar cache local
          removeFromWatchlist(ticker);
          // Atualizar estado local da UI
          setStocksStatus(prev => ({
            ...prev,
            [ticker]: { ...prev[ticker], in_watchlist: false }
          }));
        } else {
          console.error('❌ Watchlist:', data.message);
          alert(data.message);
        }
      } else {
        // Adicionar à watchlist
        const response = await fetch(buildApiUrl('api/watchlist/add'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            ticker: ticker
          })
        });

        const data = await response.json();

        if (data.status === 'success') {
          console.log('✅ Watchlist:', data.message);
          // Atualizar cache local
          addToWatchlist(ticker);
          // Atualizar estado local da UI
          setStocksStatus(prev => ({
            ...prev,
            [ticker]: { ...prev[ticker], in_watchlist: true }
          }));
        } else {
          console.error('❌ Watchlist:', data.message);
          alert(data.message);
        }
      }
    } catch (error) {
      console.error('Erro ao gerenciar watchlist:', error);
      alert('Erro ao gerenciar watchlist. Tente novamente.');
    } finally {
      setAddingToWatchlist(null);
    }
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-bar">
        <i className="bi bi-search search-icon"></i>
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setShowDropdown(true)}
        />
      </div>

      {showDropdown && (
        <div className="search-dropdown">
          {isLoading ? (
            <div className="search-result-item loading">
              Carregando...
            </div>
          ) : results.length > 0 ? (
            results.map((stock) => (
              <div
                key={stock.id}
                className="search-result-item"
                onClick={() => handleResultClick(stock)}
              >
                <div className="result-info">
                  <span className="result-ticker">{stock.ticker}</span>
                  <span className="result-company">{stock.company_name}</span>
                </div>
                <div className="result-actions">
                  <button
                    className={`action-button ${stocksStatus[stock.ticker]?.in_portfolio ? 'active' : ''}`}
                    onClick={(e) => handleTogglePortfolio(stock.ticker, e)}
                    disabled={addingToPortfolio === stock.ticker}
                  >
                    {addingToPortfolio === stock.ticker ? (
                      <i className="bi bi-hourglass-split"></i>
                    ) : (
                      <i className="bi bi-wallet-fill"></i>
                    )}
                  </button>
                  <button
                    className={`action-button ${stocksStatus[stock.ticker]?.in_watchlist ? 'active' : ''}`}
                    onClick={(e) => handleToggleWatchlist(stock.ticker, e)}
                    disabled={addingToWatchlist === stock.ticker}
                  >
                    {addingToWatchlist === stock.ticker ? (
                      <i className="bi bi-hourglass-split"></i>
                    ) : (
                      <i className="bi bi-eye-fill"></i>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="search-result-item no-results">
              Nenhuma ação encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;

