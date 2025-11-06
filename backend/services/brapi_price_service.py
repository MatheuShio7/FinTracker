"""
Serviço de preços de ações usando a BraAPI
Busca histórico de preços de ações brasileiras
"""
import os
import requests
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv
from services.update_detection_service import get_last_trading_day

# Carrega variáveis de ambiente
load_dotenv()

# Obtém o token da BraAPI das variáveis de ambiente
BRAPI_TOKEN = os.getenv('BRAPI_TOKEN')

# URL base da BraAPI
BRAPI_BASE_URL = "https://brapi.dev/api/quote"


def convert_timestamp_to_date(timestamp: int) -> str:
    """
    Converte timestamp Unix para formato de data (YYYY-MM-DD)
    
    Args:
        timestamp: Timestamp Unix em segundos
        
    Returns:
        String com data no formato YYYY-MM-DD
        
    Example:
        >>> convert_timestamp_to_date(1705363200)
        '2024-01-16'
    """
    return datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d')


def normalize_range_period(range_period: str) -> str:
    """
    Normaliza o período para o formato aceito pela BraAPI
    
    A BraAPI usa 'mo' para meses (1mo, 3mo, 6mo) ao invés de 'm'
    Esta função converte automaticamente os formatos comuns
    
    Args:
        range_period: Período a ser normalizado
        
    Returns:
        Período no formato correto para a BraAPI
        
    Example:
        >>> normalize_range_period("1m")
        '1mo'
        >>> normalize_range_period("3m")
        '3mo'
        >>> normalize_range_period("7d")
        '7d'
    """
    # Mapeamento de formatos alternativos para o formato da BraAPI
    period_mapping = {
        "1m": "1mo",
        "3m": "3mo",
        "6m": "6mo",
    }
    
    # Retorna o período normalizado ou o original se não precisar conversão
    return period_mapping.get(range_period, range_period)


def fetch_prices_from_brapi(ticker: str, range_period: str = "3m") -> Optional[List[Dict[str, any]]]:
    """
    Busca o histórico de preços de uma ação na BraAPI
    
    Args:
        ticker: Código da ação (ex: "PETR4", "VALE3")
        range_period: Período do histórico - opções:
            - "7d": 7 dias
            - "1m" ou "1mo": 1 mês
            - "3m" ou "3mo": 3 meses (padrão)
            - "6m" ou "6mo": 6 meses
            - "1y": 1 ano
            - "5y": 5 anos
            
        Note:
            Aceita tanto "1m" quanto "1mo" para meses (conversão automática)
            
    Returns:
        Lista de dicionários com histórico de preços:
        [
            {"date": "2024-01-15", "price": 28.50},
            {"date": "2024-01-16", "price": 28.75},
            ...
        ]
        Retorna None em caso de erro
        
    Example:
        >>> prices = fetch_prices_from_brapi("PETR4", "7d")
        >>> if prices:
        ...     for item in prices:
        ...         print(f"{item['date']}: R$ {item['price']}")
    """
    
    # Valida se o token está configurado
    if not BRAPI_TOKEN:
        print("[ERRO] Token da BraAPI não configurado!")
        print("Configure a variável BRAPI_TOKEN no arquivo .env")
        print("Obtenha seu token em: https://brapi.dev/dashboard")
        return None
    
    # Formata o ticker (sempre em maiúsculas e sem espaços)
    ticker = ticker.upper().strip()
    
    # Normaliza o período para o formato da BraAPI (converte 1m -> 1mo, etc)
    normalized_period = normalize_range_period(range_period)
    
    # Monta a URL da requisição
    url = f"{BRAPI_BASE_URL}/{ticker}"
    
    # Parâmetros da requisição
    params = {
        "range": normalized_period,
        "interval": "1d",  # Intervalo diário
        "token": BRAPI_TOKEN
    }
    
    # Headers da requisição
    headers = {
        "User-Agent": "FinTracker/1.0",
        "Accept": "application/json"
    }
    
    try:
        print(f"[INFO] Buscando preços de {ticker} (período: {range_period} -> {normalized_period})...")
        
        # Faz a requisição para a BraAPI
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        # Tratamento de diferentes códigos de status HTTP
        if response.status_code == 200:
            # Sucesso - processa os dados
            try:
                data = response.json()
            except ValueError as json_error:
                print(f"[ERRO] Falha ao decodificar resposta JSON")
                print(f"Detalhes: {str(json_error)}")
                return None
            
            # Valida estrutura da resposta
            if 'results' not in data or not data['results']:
                print(f"[ERRO] Nenhum dado encontrado para {ticker}")
                return None
            
            # Extrai o primeiro resultado (dados da ação)
            resultado = data['results'][0]
            
            # Verifica se há dados históricos
            if 'historicalDataPrice' not in resultado:
                print(f"[AVISO] Sem dados históricos para {ticker}")
                
                # ESPECIAL: Para range "1d", tenta retornar pelo menos o preço atual
                # Isso é usado pelo endpoint /refresh para pegar preço intraday
                if range_period == "1d" and 'regularMarketPrice' in resultado:
                    from services.update_detection_service import get_last_trading_day
                    last_trading_day = get_last_trading_day()
                    last_trading_day_str = last_trading_day.strftime('%Y-%m-%d')
                    preco_atual = resultado['regularMarketPrice']
                    print(f"[INFO] Range=1d: Retornando regularMarketPrice: R$ {preco_atual:.2f} (data: {last_trading_day_str})")
                    return [{"date": last_trading_day_str, "price": preco_atual}]
                
                return None
            
            historico = resultado['historicalDataPrice']
            
            # Valida se o histórico não está vazio
            if not historico:
                print(f"[AVISO] Histórico vazio para {ticker}")
                
                # ESPECIAL: Para range "1d", tenta retornar pelo menos o preço atual
                if range_period == "1d" and 'regularMarketPrice' in resultado:
                    from services.update_detection_service import get_last_trading_day
                    last_trading_day = get_last_trading_day()
                    last_trading_day_str = last_trading_day.strftime('%Y-%m-%d')
                    preco_atual = resultado['regularMarketPrice']
                    print(f"[INFO] Range=1d: Retornando regularMarketPrice: R$ {preco_atual:.2f} (data: {last_trading_day_str})")
                    return [{"date": last_trading_day_str, "price": preco_atual}]
                
                return None
            
            # Formata os dados de histórico
            prices_list = []
            for item in historico:
                try:
                    data_formatada = convert_timestamp_to_date(item['date'])
                    preco = float(item['close'])
                    
                    prices_list.append({
                        "date": data_formatada,
                        "price": preco
                    })
                except (KeyError, ValueError, TypeError) as e:
                    print(f"[AVISO] Erro ao processar item do histórico: {str(e)}")
                    continue
            
            print(f"[OK] Sucesso! {len(prices_list)} preços encontrados para {ticker}")
            return prices_list
            
        elif response.status_code == 401:
            print("[ERRO 401] Token inválido ou ausente")
            print("Verifique seu token em: https://brapi.dev/dashboard")
            return None
            
        elif response.status_code == 402:
            print("[ERRO 402] Limite de requisições excedido")
            print("Seu plano atingiu o limite de requisições. Verifique em: https://brapi.dev/dashboard")
            return None
            
        elif response.status_code == 404:
            print(f"[ERRO 404] Ação '{ticker}' não encontrada")
            print("Verifique se o ticker está correto (ex: PETR4, VALE3, ITUB4)")
            return None
            
        elif response.status_code == 403:
            print("[ERRO 403] Acesso negado - Limitação do plano")
            print("Seu plano não permite acessar este range de dados históricos")
            print("Ranges permitidos pelo plano gratuito: 1d, 5d, 1mo, 3mo")
            print("Considere usar um range menor ou fazer upgrade do plano")
            return None
            
        elif response.status_code == 429:
            print("[ERRO 429] Muitas requisições")
            print("Aguarde alguns instantes antes de tentar novamente")
            return None
            
        else:
            print(f"[ERRO {response.status_code}] Erro inesperado")
            print(f"Detalhes: {response.text[:200]}")
            return None
            
    except requests.exceptions.Timeout:
        print("[ERRO] Timeout na requisição")
        print("A API demorou muito para responder. Tente novamente.")
        return None
        
    except requests.exceptions.ConnectionError:
        print("[ERRO] Falha na conexão")
        print("Verifique sua conexão com a internet")
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"[ERRO] Erro na requisição: {str(e)}")
        return None
        
    except Exception as e:
        print(f"[ERRO] Erro inesperado: {str(e)}")
        return None


def validate_range_period(range_period: str) -> bool:
    """
    Valida se o período informado é válido
    
    Args:
        range_period: Período a ser validado
        
    Returns:
        True se válido, False caso contrário
        
    Note:
        Aceita tanto formatos com 'm' quanto 'mo' para meses
        Exemplos: 1m ou 1mo, 3m ou 3mo, 6m ou 6mo
    """
    # Formatos válidos da BraAPI
    valid_periods = ["1d", "5d", "7d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
    
    # Formatos alternativos aceitos (serão convertidos)
    alternative_periods = ["1m", "3m", "6m"]
    
    return range_period in valid_periods or range_period in alternative_periods


def get_price_summary(ticker: str, range_period: str = "3m") -> Optional[Dict[str, any]]:
    """
    Retorna um resumo dos preços (último preço, variação, etc.)
    
    Args:
        ticker: Código da ação
        range_period: Período do histórico
        
    Returns:
        Dicionário com resumo dos preços ou None se houver erro
        
    Example:
        >>> summary = get_price_summary("PETR4", "7d")
        >>> print(f"Preço atual: R$ {summary['current_price']}")
        >>> print(f"Variação: {summary['variation_percent']}%")
    """
    prices = fetch_prices_from_brapi(ticker, range_period)
    
    if not prices or len(prices) == 0:
        return None
    
    # Ordena por data
    prices_sorted = sorted(prices, key=lambda x: x['date'])
    
    # Calcula estatísticas
    current_price = prices_sorted[-1]['price']
    first_price = prices_sorted[0]['price']
    variation = current_price - first_price
    variation_percent = (variation / first_price) * 100 if first_price > 0 else 0
    
    prices_only = [p['price'] for p in prices_sorted]
    max_price = max(prices_only)
    min_price = min(prices_only)
    avg_price = sum(prices_only) / len(prices_only)
    
    return {
        "ticker": ticker,
        "current_price": current_price,
        "first_price": first_price,
        "variation": variation,
        "variation_percent": round(variation_percent, 2),
        "max_price": max_price,
        "min_price": min_price,
        "avg_price": round(avg_price, 2),
        "data_points": len(prices_sorted),
        "period": range_period,
        "last_update": prices_sorted[-1]['date']
    }


def get_current_stock_price(ticker: str) -> Optional[Dict[str, any]]:
    """
    Busca APENAS o preço atual de uma ação (otimizado para carteira)
    
    Esta função é otimizada para buscar apenas o preço atual, sem histórico.
    É muito mais rápida que fetch_prices_from_brapi() para casos onde só
    precisamos do valor atual (como na carteira).
    
    Args:
        ticker: Código da ação (ex: "PETR4", "VALE3")
        
    Returns:
        Dicionário com preço atual:
        {
            "ticker": "PETR4",
            "current_price": 30.50,
            "date": "2024-11-05",
            "market_status": "open|closed"
        }
        Retorna None em caso de erro
        
    Example:
        >>> price_data = get_current_stock_price("PETR4")
        >>> if price_data:
        ...     print(f"PETR4: R$ {price_data['current_price']:.2f}")
    """
    
    # Valida se o token está configurado
    if not BRAPI_TOKEN:
        print("[ERRO] Token da BraAPI não configurado!")
        print("Configure a variável BRAPI_TOKEN no arquivo .env")
        return None
    
    # Formata o ticker (sempre em maiúsculas e sem espaços)
    ticker = ticker.upper().strip()
    
    # Monta a URL da requisição (sem range - busca apenas dados atuais)
    url = f"{BRAPI_BASE_URL}/{ticker}"
    
    # Parâmetros mínimos para buscar apenas preço atual
    params = {
        "token": BRAPI_TOKEN
        # Sem range = apenas dados atuais (mais rápido)
    }
    
    # Headers da requisição
    headers = {
        "User-Agent": "FinTracker/1.0",
        "Accept": "application/json"
    }
    
    try:
        print(f"[INFO] Buscando preço atual de {ticker}...")
        
        # Faz a requisição para a BraAPI
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        # Tratamento de diferentes códigos de status HTTP
        if response.status_code == 200:
            # Sucesso - processa os dados
            try:
                data = response.json()
            except ValueError as json_error:
                print(f"[ERRO] Falha ao decodificar resposta JSON")
                print(f"Detalhes: {str(json_error)}")
                return None
            
            # Valida estrutura da resposta
            if 'results' not in data or not data['results']:
                print(f"[ERRO] Nenhum dado encontrado para {ticker}")
                return None
            
            # Extrai o primeiro resultado (dados da ação)
            resultado = data['results'][0]
            
            # Busca o preço atual (regularMarketPrice é o mais atualizado)
            current_price = None
            market_status = "unknown"
            
            if 'regularMarketPrice' in resultado and resultado['regularMarketPrice']:
                current_price = float(resultado['regularMarketPrice'])
                market_status = "open" if 'marketState' in resultado and resultado['marketState'] == 'REGULAR' else "closed"
            elif 'regularMarketPreviousClose' in resultado and resultado['regularMarketPreviousClose']:
                # Fallback: preço de fechamento anterior
                current_price = float(resultado['regularMarketPreviousClose'])
                market_status = "closed"
            
            if current_price is None:
                print(f"[ERRO] Não foi possível obter preço atual para {ticker}")
                return None
            
            # Determina a data (hoje ou último dia de pregão)
            from services.update_detection_service import get_last_trading_day
            price_date = get_last_trading_day().strftime('%Y-%m-%d')
            
            result = {
                "ticker": ticker,
                "current_price": current_price,
                "date": price_date,
                "market_status": market_status
            }
            
            print(f"[OK] Preço atual de {ticker}: R$ {current_price:.2f} ({market_status})")
            return result
            
        elif response.status_code == 401:
            print("[ERRO 401] Token inválido ou ausente")
            print("Verifique seu token em: https://brapi.dev/dashboard")
            return None
            
        elif response.status_code == 402:
            print("[ERRO 402] Limite de requisições excedido")
            print("Seu plano atingiu o limite de requisições. Verifique em: https://brapi.dev/dashboard")
            return None
            
        elif response.status_code == 403:
            print("[ERRO 403] Acesso negado - Limitação do plano")
            print("Seu plano não permite acessar dados desta ação")
            return None
            
        elif response.status_code == 404:
            print(f"[ERRO 404] Ação '{ticker}' não encontrada")
            print("Verifique se o ticker está correto (ex: PETR4, VALE3, ITUB4)")
            return None
            
        elif response.status_code == 429:
            print("[ERRO 429] Muitas requisições")
            print("Aguarde alguns instantes antes de tentar novamente")
            return None
            
        else:
            print(f"[ERRO {response.status_code}] Erro inesperado")
            print(f"Detalhes: {response.text[:200]}")
            return None
            
    except requests.exceptions.Timeout:
        print("[ERRO] Timeout na requisição")
        print("A API demorou muito para responder. Tente novamente.")
        return None
        
    except requests.exceptions.ConnectionError:
        print("[ERRO] Falha na conexão")
        print("Verifique sua conexão com a internet")
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"[ERRO] Erro na requisição: {str(e)}")
        return None
        
    except Exception as e:
        print(f"[ERRO] Erro inesperado: {str(e)}")
        return None

