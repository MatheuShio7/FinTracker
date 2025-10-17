"""
Serviço de dividendos de ações usando Yahoo Finance
Busca histórico de dividendos de ações brasileiras
"""
import yfinance as yf
from datetime import datetime
from typing import List, Dict, Optional

def fetch_dividends_from_yahoo(ticker: str) -> Optional[List[Dict[str, any]]]:
    """
    Busca o histórico de dividendos de uma ação no Yahoo Finance
    
    Args:
        ticker: Código da ação (ex: "PETR4", "VALE3")
                O sufixo ".SA" é adicionado automaticamente se não estiver presente
    
    Returns:
        Lista de dicionários com histórico de dividendos (últimos 12):
        [
            {"payment_date": "2024-03-30", "value": 1.25},
            {"payment_date": "2024-06-28", "value": 1.30},
            ...
        ]
        Retorna lista vazia [] se não houver dividendos ou ocorrer erro
        Retorna None se o ticker for inválido
    
    Example:
        >>> dividends = fetch_dividends_from_yahoo("PETR4")
        >>> if dividends:
        ...     for div in dividends:
        ...         print(f"{div['payment_date']}: R$ {div['value']:.2f}")
    """
    
    try:
        # Formata o ticker (sempre em maiúsculas e sem espaços)
        ticker = ticker.upper().strip()
        
        # Adiciona ".SA" para ações brasileiras se não estiver presente
        if not ticker.endswith('.SA'):
            ticker_yahoo = ticker + '.SA'
        else:
            ticker_yahoo = ticker
        
        print(f"[INFO] Buscando dividendos de {ticker} (Yahoo: {ticker_yahoo})...")
        
        # Cria um objeto Ticker do yfinance
        acao = yf.Ticker(ticker_yahoo)
        
        # Tenta obter informações básicas para validar se o ticker existe
        try:
            info = acao.info
            if not info or 'symbol' not in info:
                print(f"[ERRO] Ticker '{ticker}' não encontrado no Yahoo Finance")
                return None
        except Exception as e:
            print(f"[ERRO] Ticker '{ticker}' inválido ou não encontrado")
            print(f"Detalhes: {str(e)}")
            return None
        
        # Obtém o histórico de dividendos
        try:
            dividendos = acao.dividends
        except Exception as e:
            print(f"[ERRO] Erro ao buscar dividendos de {ticker}")
            print(f"Detalhes: {str(e)}")
            return []
        
        # Verifica se há dividendos
        if dividendos is None or dividendos.empty:
            print(f"[AVISO] Nenhum dividendo encontrado para {ticker}")
            return []
        
        # Filtra apenas dividendos com valor maior que 0
        dividendos_validos = dividendos[dividendos > 0]
        
        if dividendos_validos.empty:
            print(f"[AVISO] Nenhum dividendo com valor válido encontrado para {ticker}")
            return []
        
        # Pega apenas os últimos 12 dividendos válidos
        ultimos_12 = dividendos_validos.tail(12)
        
        # Formata os dados de dividendos
        dividends_list = []
        for data, valor in ultimos_12.items():
            try:
                # Converte a data para string no formato ISO (YYYY-MM-DD)
                data_formatada = data.strftime('%Y-%m-%d')
                valor_float = float(valor)
                
                dividends_list.append({
                    "payment_date": data_formatada,
                    "value": valor_float
                })
            except (ValueError, TypeError, AttributeError) as e:
                print(f"[AVISO] Erro ao processar dividendo: {str(e)}")
                continue
        
        if not dividends_list:
            print(f"[AVISO] Nenhum dividendo processado com sucesso para {ticker}")
            return []
        
        print(f"[OK] Sucesso! {len(dividends_list)} dividendos encontrados para {ticker}")
        return dividends_list
        
    except TypeError as e:
        print(f"[ERRO] Erro de tipo ao buscar dados de {ticker}")
        print(f"Detalhes: {str(e)}")
        return []
        
    except KeyError as e:
        print(f"[ERRO] Chave ausente nos dados de {ticker}")
        print(f"Detalhes: {str(e)}")
        return []
        
    except Exception as e:
        print(f"[ERRO] Erro inesperado ao buscar dividendos de {ticker}")
        print(f"Detalhes: {str(e)}")
        return []


def get_dividend_summary(ticker: str) -> Optional[Dict[str, any]]:
    """
    Retorna um resumo dos dividendos de uma ação
    
    Args:
        ticker: Código da ação
        
    Returns:
        Dicionário com resumo dos dividendos ou None se houver erro
        
    Example:
        >>> summary = get_dividend_summary("PETR4")
        >>> print(f"Total pago: R$ {summary['total_paid']:.2f}")
        >>> print(f"Dividend Yield médio: {summary['avg_value']:.2f}")
    """
    dividends = fetch_dividends_from_yahoo(ticker)
    
    if dividends is None:
        return None
    
    if not dividends or len(dividends) == 0:
        return {
            "ticker": ticker.upper().replace('.SA', ''),
            "total_dividends": 0,
            "total_paid": 0.0,
            "avg_value": 0.0,
            "last_payment": None,
            "last_value": 0.0
        }
    
    # Calcula estatísticas
    values = [d['value'] for d in dividends]
    total_paid = sum(values)
    avg_value = total_paid / len(values)
    last_dividend = dividends[-1]
    
    return {
        "ticker": ticker.upper().replace('.SA', ''),
        "total_dividends": len(dividends),
        "total_paid": round(total_paid, 2),
        "avg_value": round(avg_value, 2),
        "last_payment": last_dividend['payment_date'],
        "last_value": last_dividend['value'],
        "dividends": dividends
    }


def calculate_dividend_yield(ticker: str, quantity: int) -> Optional[Dict[str, any]]:
    """
    Calcula o dividend yield estimado baseado nos últimos 12 meses
    
    Args:
        ticker: Código da ação
        quantity: Quantidade de ações
        
    Returns:
        Dicionário com cálculo do dividend yield
        
    Example:
        >>> result = calculate_dividend_yield("PETR4", 100)
        >>> print(f"Você receberá aproximadamente R$ {result['estimated_annual_income']:.2f}/ano")
    """
    dividends = fetch_dividends_from_yahoo(ticker)
    
    if dividends is None or not dividends:
        return None
    
    # Soma dos últimos 12 dividendos (aproximadamente 1 ano)
    total_per_share = sum(d['value'] for d in dividends)
    total_income = total_per_share * quantity
    
    # Tenta obter o preço atual
    try:
        ticker_clean = ticker.upper().strip()
        if not ticker_clean.endswith('.SA'):
            ticker_clean += '.SA'
        
        acao = yf.Ticker(ticker_clean)
        info = acao.info
        current_price = info.get('currentPrice') or info.get('regularMarketPrice', 0)
        
        if current_price > 0:
            dividend_yield = (total_per_share / current_price) * 100
        else:
            dividend_yield = 0
            
    except Exception:
        current_price = 0
        dividend_yield = 0
    
    return {
        "ticker": ticker.upper().replace('.SA', ''),
        "quantity": quantity,
        "dividends_per_share": round(total_per_share, 2),
        "estimated_annual_income": round(total_income, 2),
        "current_price": round(current_price, 2) if current_price else None,
        "dividend_yield_percent": round(dividend_yield, 2) if dividend_yield else None,
        "base_period": "últimos 12 dividendos"
    }

