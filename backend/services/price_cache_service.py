"""
Serviço de cache de preços de ações no Supabase
Gerencia a leitura de preços armazenados em cache
"""
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional
from config.supabase_config import get_supabase_client


def get_stock_id_by_ticker(ticker: str) -> Optional[str]:
    """
    Busca o ID da ação no Supabase pela ticker
    
    Args:
        ticker: Código da ação (ex: "PETR4")
        
    Returns:
        ID da ação (UUID string) ou None se não existir
        
    Example:
        >>> stock_id = get_stock_id_by_ticker("PETR4")
        >>> if stock_id:
        ...     print(f"ID encontrado: {stock_id}")
    """
    try:
        # Formata o ticker (maiúsculas e sem espaços)
        ticker = ticker.upper().strip()
        
        print(f"[INFO] Buscando ID da ação {ticker} no Supabase...")
        
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        # Query: SELECT id FROM stocks WHERE ticker = ticker
        response = supabase.table('stocks')\
            .select('id')\
            .eq('ticker', ticker)\
            .execute()
        
        # Verifica se encontrou algum resultado
        if not response.data or len(response.data) == 0:
            print(f"[AVISO] Ação {ticker} não encontrada no banco de dados")
            return None
        
        # Retorna o ID da primeira (e única) ocorrência
        stock_id = response.data[0]['id']
        print(f"[OK] ID da ação {ticker} encontrado: {stock_id}")
        return stock_id
        
    except Exception as e:
        print(f"[ERRO] Erro ao buscar ID da ação {ticker}")
        print(f"Detalhes: {str(e)}")
        return None


def get_prices_from_cache(stock_id: str, range_days: int) -> List[Dict[str, any]]:
    """
    Busca preços do Supabase filtrados por período
    
    Args:
        stock_id: ID da ação (UUID)
        range_days: Número de dias (ex: 7, 30, 90)
        
    Returns:
        Lista de dicionários com preços:
        [
            {"date": "2024-01-15", "price": 28.50},
            {"date": "2024-01-16", "price": 28.75},
            ...
        ]
        Retorna lista vazia [] se não houver dados
        
    Example:
        >>> prices = get_prices_from_cache("uuid-123", 7)
        >>> for p in prices:
        ...     print(f"{p['date']}: R$ {p['price']}")
    """
    try:
        print(f"[INFO] Buscando preços em cache para stock_id={stock_id}, range_days={range_days}...")
        
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        # Calcula a data inicial (hoje - range_days)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=range_days)
        
        # Formata as datas para string ISO (YYYY-MM-DD)
        start_date_str = start_date.isoformat()
        
        # Query: SELECT price, date FROM stock_prices 
        #        WHERE stock_id = stock_id 
        #        AND date >= (today - range_days)
        #        ORDER BY date ASC
        response = supabase.table('stock_prices')\
            .select('price, date')\
            .eq('stock_id', stock_id)\
            .gte('date', start_date_str)\
            .order('date', desc=False)\
            .execute()
        
        # Verifica se encontrou dados
        if not response.data or len(response.data) == 0:
            print(f"[AVISO] Nenhum preço encontrado em cache para stock_id={stock_id}")
            return []
        
        # Formata os dados para o formato esperado
        prices_list = []
        for item in response.data:
            try:
                prices_list.append({
                    "date": item['date'],
                    "price": float(item['price'])
                })
            except (KeyError, ValueError, TypeError) as e:
                print(f"[AVISO] Erro ao processar item do cache: {str(e)}")
                continue
        
        print(f"[OK] {len(prices_list)} preços encontrados em cache")
        return prices_list
        
    except Exception as e:
        print(f"[ERRO] Erro ao buscar preços do cache")
        print(f"Detalhes: {str(e)}")
        return []


def get_most_recent_price_date(stock_id: str) -> Optional[date]:
    """
    Busca a data do preço mais recente no banco
    
    Args:
        stock_id: ID da ação (UUID)
        
    Returns:
        Data do preço mais recente (date object) ou None se não houver dados
        
    Example:
        >>> last_date = get_most_recent_price_date("uuid-123")
        >>> if last_date:
        ...     print(f"Último preço: {last_date}")
    """
    try:
        print(f"[INFO] Buscando data do preço mais recente para stock_id={stock_id}...")
        
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        # Query: SELECT MAX(date) FROM stock_prices WHERE stock_id = stock_id
        # Como Supabase não tem MAX direto, fazemos ORDER BY DESC LIMIT 1
        response = supabase.table('stock_prices')\
            .select('date')\
            .eq('stock_id', stock_id)\
            .order('date', desc=True)\
            .limit(1)\
            .execute()
        
        # Verifica se encontrou algum resultado
        if not response.data or len(response.data) == 0:
            print(f"[AVISO] Nenhum preço encontrado para stock_id={stock_id}")
            return None
        
        # Extrai a data do resultado
        date_str = response.data[0]['date']
        
        # Converte string para date object
        if isinstance(date_str, str):
            most_recent_date = datetime.fromisoformat(date_str).date()
        elif isinstance(date_str, date):
            most_recent_date = date_str
        else:
            print(f"[ERRO] Formato de data inválido: {type(date_str)}")
            return None
        
        print(f"[OK] Data do preço mais recente: {most_recent_date}")
        return most_recent_date
        
    except ValueError as e:
        print(f"[ERRO] Erro ao converter data")
        print(f"Detalhes: {str(e)}")
        return None
        
    except Exception as e:
        print(f"[ERRO] Erro ao buscar data do preço mais recente")
        print(f"Detalhes: {str(e)}")
        return None

