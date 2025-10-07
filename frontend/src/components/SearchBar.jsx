import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './SearchBar.css';

function SearchBar() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

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

  const handleResultClick = (stock) => {
    setShowDropdown(false);
    setSearchTerm('');
    navigate(`/${stock.ticker}`, { state: { from: 'Explorar' } });
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
                <span className="result-ticker">{stock.ticker}</span>
                <span className="result-company">{stock.company_name}</span>
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

