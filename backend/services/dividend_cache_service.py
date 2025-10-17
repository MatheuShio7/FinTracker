"""
Serviço de cache de dividendos de ações no Supabase
Gerencia a leitura de dividendos armazenados em cache
"""
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional
from config.supabase_config import get_supabase_client


def get_dividends_from_cache(stock_id: str) -> List[Dict[str, any]]:
    """
    Busca os últimos 12 dividendos do Supabase
    
    Args:
        stock_id: ID da ação (UUID)
        
    Returns:
        Lista de dicionários com dividendos:
        [
            {"payment_date": "2024-03-30", "value": 1.25},
            {"payment_date": "2024-06-28", "value": 1.30},
            ...
        ]
        Retorna lista vazia [] se não houver dados
        
    Example:
        >>> dividends = get_dividends_from_cache("uuid-123")
        >>> for div in dividends:
        ...     print(f"{div['payment_date']}: R$ {div['value']}")
    """
    try:
        print(f"[INFO] Buscando dividendos em cache para stock_id={stock_id}...")
        
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        # Query: SELECT value, payment_date FROM stock_dividends 
        #        WHERE stock_id = stock_id 
        #        ORDER BY payment_date DESC 
        #        LIMIT 12
        response = supabase.table('stock_dividends')\
            .select('value, payment_date')\
            .eq('stock_id', stock_id)\
            .order('payment_date', desc=True)\
            .limit(12)\
            .execute()
        
        # Verifica se encontrou dados
        if not response.data or len(response.data) == 0:
            print(f"[AVISO] Nenhum dividendo encontrado em cache para stock_id={stock_id}")
            return []
        
        # Formata os dados para o formato esperado
        dividends_list = []
        for item in response.data:
            try:
                dividends_list.append({
                    "payment_date": item['payment_date'],
                    "value": float(item['value'])
                })
            except (KeyError, ValueError, TypeError) as e:
                print(f"[AVISO] Erro ao processar item do cache: {str(e)}")
                continue
        
        print(f"[OK] {len(dividends_list)} dividendos encontrados em cache")
        return dividends_list
        
    except Exception as e:
        print(f"[ERRO] Erro ao buscar dividendos do cache")
        print(f"Detalhes: {str(e)}")
        return []


def get_most_recent_dividend_date(stock_id: str) -> Optional[date]:
    """
    Busca a data do dividendo mais recente no banco
    
    Args:
        stock_id: ID da ação (UUID)
        
    Returns:
        Data do dividendo mais recente (date object) ou None se não houver dados
        
    Example:
        >>> last_date = get_most_recent_dividend_date("uuid-123")
        >>> if last_date:
        ...     print(f"Último dividendo: {last_date}")
    """
    try:
        print(f"[INFO] Buscando data do dividendo mais recente para stock_id={stock_id}...")
        
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        # Query: SELECT MAX(payment_date) FROM stock_dividends WHERE stock_id = stock_id
        # Como Supabase não tem MAX direto, fazemos ORDER BY DESC LIMIT 1
        response = supabase.table('stock_dividends')\
            .select('payment_date')\
            .eq('stock_id', stock_id)\
            .order('payment_date', desc=True)\
            .limit(1)\
            .execute()
        
        # Verifica se encontrou algum resultado
        if not response.data or len(response.data) == 0:
            print(f"[AVISO] Nenhum dividendo encontrado para stock_id={stock_id}")
            return None
        
        # Extrai a data do resultado
        date_str = response.data[0]['payment_date']
        
        # Converte string para date object
        if isinstance(date_str, str):
            most_recent_date = datetime.fromisoformat(date_str).date()
        elif isinstance(date_str, date):
            most_recent_date = date_str
        else:
            print(f"[ERRO] Formato de data inválido: {type(date_str)}")
            return None
        
        print(f"[OK] Data do dividendo mais recente: {most_recent_date}")
        return most_recent_date
        
    except ValueError as e:
        print(f"[ERRO] Erro ao converter data")
        print(f"Detalhes: {str(e)}")
        return None
        
    except Exception as e:
        print(f"[ERRO] Erro ao buscar data do dividendo mais recente")
        print(f"Detalhes: {str(e)}")
        return None


def check_if_dividends_exist(stock_id: str) -> bool:
    """
    Verifica se existem dividendos para uma ação
    
    Args:
        stock_id: ID da ação (UUID)
        
    Returns:
        True se tem dividendos, False se não tem
        
    Example:
        >>> has_dividends = check_if_dividends_exist("uuid-123")
        >>> if has_dividends:
        ...     print("Ação possui dividendos")
    """
    try:
        print(f"[INFO] Verificando existência de dividendos para stock_id={stock_id}...")
        
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        # Query: SELECT COUNT(*) FROM stock_dividends WHERE stock_id = stock_id
        # No Supabase, usamos count='exact' para obter a contagem
        response = supabase.table('stock_dividends')\
            .select('*', count='exact')\
            .eq('stock_id', stock_id)\
            .limit(1)\
            .execute()
        
        # Verifica a contagem
        count = response.count if hasattr(response, 'count') else 0
        
        has_dividends = count > 0
        
        if has_dividends:
            print(f"[OK] Ação possui {count} dividendos em cache")
        else:
            print(f"[AVISO] Ação não possui dividendos em cache")
        
        return has_dividends
        
    except Exception as e:
        print(f"[ERRO] Erro ao verificar existência de dividendos")
        print(f"Detalhes: {str(e)}")
        return False

