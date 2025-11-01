import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { buildApiUrl } from '../config/api';

const PortfolioContext = createContext();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em millisegundos
const STORAGE_KEY = 'portfolio_cache';

export function PortfolioProvider({ children }) {
  const { user } = useAuth();
  const [cache, setCache] = useState({
    portfolio: [],
    watchlist: [],
    timestamp: null,
    isLoading: false
  });

  // Carregar cache do localStorage ao iniciar
  useEffect(() => {
    if (!user) {
      clearCache();
      return;
    }

    const savedCache = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        const now = Date.now();
        
        // Verificar se cache ainda é válido (não expirou)
        if (parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
          console.log('📦 Cache carregado do localStorage');
          setCache(parsed);
        } else {
          console.log('⏰ Cache expirado, limpando...');
          clearCache();
        }
      } catch (error) {
        console.error('Erro ao carregar cache:', error);
        clearCache();
      }
    }
  }, [user]);

  // Salvar cache no localStorage sempre que mudar
  useEffect(() => {
    if (user && cache.timestamp) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({
        portfolio: cache.portfolio,
        watchlist: cache.watchlist,
        timestamp: cache.timestamp
      }));
    }
  }, [cache, user]);

  // Limpar cache
  const clearCache = useCallback(() => {
    setCache({
      portfolio: [],
      watchlist: [],
      timestamp: null,
      isLoading: false
    });
    if (user) {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
    }
  }, [user]);

  // Verificar se cache é válido
  const isCacheValid = useCallback(() => {
    if (!cache.timestamp) return false;
    const now = Date.now();
    return (now - cache.timestamp) < CACHE_DURATION;
  }, [cache.timestamp]);

  // Carregar dados completos do portfolio e watchlist
  const loadPortfolioData = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // Se cache é válido e não é refresh forçado, não faz nada
    if (!forceRefresh && isCacheValid()) {
      console.log('✅ Usando cache válido');
      return;
    }

    setCache(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('🔄 Carregando dados do servidor...');
      
      // Buscar portfolio
      const portfolioResponse = await fetch(buildApiUrl(`api/portfolio?user_id=${user.id}`));
      const portfolioData = await portfolioResponse.json();
      
      // Buscar watchlist
      const watchlistResponse = await fetch(buildApiUrl(`api/watchlist?user_id=${user.id}`));
      const watchlistData = await watchlistResponse.json();

      const newCache = {
        portfolio: portfolioData.data || [],
        watchlist: watchlistData.data || [],
        timestamp: Date.now(),
        isLoading: false
      };

      setCache(newCache);
      console.log('✅ Cache atualizado do servidor');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setCache(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, isCacheValid]);

  // Verificar se ticker está no portfolio
  const isInPortfolio = useCallback((ticker) => {
    return cache.portfolio.some(stock => stock.ticker === ticker);
  }, [cache.portfolio]);

  // Verificar se ticker está na watchlist
  const isInWatchlist = useCallback((ticker) => {
    return cache.watchlist.some(stock => stock.ticker === ticker);
  }, [cache.watchlist]);

  // Adicionar ao portfolio (atualiza cache local)
  const addToPortfolio = useCallback((ticker) => {
    setCache(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, { ticker }],
      timestamp: Date.now()
    }));
    console.log(`📦 Cache: ${ticker} adicionado ao portfolio`);
  }, []);

  // Remover do portfolio (atualiza cache local)
  const removeFromPortfolio = useCallback((ticker) => {
    setCache(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(stock => stock.ticker !== ticker),
      timestamp: Date.now()
    }));
    console.log(`📦 Cache: ${ticker} removido do portfolio`);
  }, []);

  // Adicionar à watchlist (atualiza cache local)
  const addToWatchlist = useCallback((ticker) => {
    setCache(prev => ({
      ...prev,
      watchlist: [...prev.watchlist, { ticker }],
      timestamp: Date.now()
    }));
    console.log(`📦 Cache: ${ticker} adicionado à watchlist`);
  }, []);

  // Remover da watchlist (atualiza cache local)
  const removeFromWatchlist = useCallback((ticker) => {
    setCache(prev => ({
      ...prev,
      watchlist: prev.watchlist.filter(stock => stock.ticker !== ticker),
      timestamp: Date.now()
    }));
    console.log(`📦 Cache: ${ticker} removido da watchlist`);
  }, []);

  // Verificar status de múltiplos tickers (usando cache)
  const checkStocksStatus = useCallback((tickers) => {
    const result = {};
    tickers.forEach(ticker => {
      result[ticker] = {
        in_portfolio: isInPortfolio(ticker),
        in_watchlist: isInWatchlist(ticker)
      };
    });
    return result;
  }, [isInPortfolio, isInWatchlist]);

  const value = {
    cache,
    isLoading: cache.isLoading,
    isCacheValid: isCacheValid(),
    loadPortfolioData,
    clearCache,
    isInPortfolio,
    isInWatchlist,
    addToPortfolio,
    removeFromPortfolio,
    addToWatchlist,
    removeFromWatchlist,
    checkStocksStatus
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

