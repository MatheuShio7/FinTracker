"""
Serviço de salvamento de dados no Supabase
Implementa o salvamento de preços e dividendos com UPSERT
"""
from datetime import datetime
from typing import List, Dict
from config.supabase_config import get_supabase_client


def save_prices(stock_id: str, prices_list: List[Dict[str, any]]) -> int:
    """
    Salva preços no Supabase
    
    Args:
        stock_id: UUID da ação
        prices_list: Lista de dicionários [{"date": "2024-01-15", "price": 28.50}, ...]
        
    Returns:
        Número de registros salvos (int) ou 0 se erro
        
    Example:
        >>> prices = [
        ...     {"date": "2024-01-15", "price": 28.50},
        ...     {"date": "2024-01-16", "price": 28.75}
        ... ]
        >>> count = save_prices("uuid-123", prices)
        >>> print(f"{count} preços salvos")
    """
    try:
        # Valida se é uma lista
        if not isinstance(prices_list, list):
            print(f"[ERRO] prices_list deve ser uma lista, recebido: {type(prices_list)}")
            return 0
        
        # Verifica se a lista está vazia
        if len(prices_list) == 0:
            print("[AVISO] Lista de preços vazia - Nenhum dado para salvar")
            return 0
        
        print(f"[INFO] Salvando {len(prices_list)} preços para stock_id={stock_id}...")
        
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        # Prepara os dados para inserção
        records_to_insert = []
        current_timestamp = datetime.utcnow().isoformat()
        
        for item in prices_list:
            try:
                # Valida se o item tem as chaves necessárias
                if 'date' not in item or 'price' not in item:
                    print(f"[AVISO] Item sem chaves necessárias ignorado: {item}")
                    continue
                
                # Monta o registro para inserção
                record = {
                    'stock_id': stock_id,
                    'date': item['date'],
                    'price': float(item['price']),
                    'created_at': current_timestamp
                }
                
                records_to_insert.append(record)
                
            except (ValueError, TypeError) as e:
                print(f"[AVISO] Erro ao processar item: {item} - {str(e)}")
                continue
        
        # Verifica se há registros válidos para inserir
        if len(records_to_insert) == 0:
            print("[AVISO] Nenhum registro válido para salvar")
            return 0
        
        # Faz UPSERT na tabela stock_prices
        # onConflict especifica que duplicatas em (stock_id, date) serão ignoradas
        response = supabase.table('stock_prices')\
            .upsert(records_to_insert, on_conflict='stock_id,date')\
            .execute()
        
        # Conta quantos registros foram salvos
        saved_count = len(response.data) if response.data else 0
        
        print(f"[OK] {saved_count} preços salvos com sucesso")
        return saved_count
        
    except Exception as e:
        print(f"[ERRO] Erro ao salvar preços no Supabase")
        print(f"Detalhes: {str(e)}")
        return 0


def save_dividends(stock_id: str, dividends_list: List[Dict[str, any]]) -> int:
    """
    Salva dividendos no Supabase
    
    Args:
        stock_id: UUID da ação
        dividends_list: Lista de dicionários [{"payment_date": "2024-03-30", "value": 1.25}, ...]
        
    Returns:
        Número de registros salvos (int) ou 0 se erro
        
    Example:
        >>> dividends = [
        ...     {"payment_date": "2024-03-30", "value": 1.25},
        ...     {"payment_date": "2024-06-28", "value": 1.30}
        ... ]
        >>> count = save_dividends("uuid-123", dividends)
        >>> print(f"{count} dividendos salvos")
    """
    try:
        # Valida se é uma lista
        if not isinstance(dividends_list, list):
            print(f"[ERRO] dividends_list deve ser uma lista, recebido: {type(dividends_list)}")
            return 0
        
        # Verifica se a lista está vazia
        if len(dividends_list) == 0:
            print("[AVISO] Lista de dividendos vazia - Nenhum dado para salvar")
            return 0
        
        print(f"[INFO] Salvando {len(dividends_list)} dividendos para stock_id={stock_id}...")
        
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        # Prepara os dados para inserção
        records_to_insert = []
        current_timestamp = datetime.utcnow().isoformat()
        
        for item in dividends_list:
            try:
                # Valida se o item tem as chaves necessárias
                if 'payment_date' not in item or 'value' not in item:
                    print(f"[AVISO] Item sem chaves necessárias ignorado: {item}")
                    continue
                
                # Monta o registro para inserção
                record = {
                    'stock_id': stock_id,
                    'payment_date': item['payment_date'],
                    'value': float(item['value']),
                    'created_at': current_timestamp
                }
                
                records_to_insert.append(record)
                
            except (ValueError, TypeError) as e:
                print(f"[AVISO] Erro ao processar item: {item} - {str(e)}")
                continue
        
        # Verifica se há registros válidos para inserir
        if len(records_to_insert) == 0:
            print("[AVISO] Nenhum registro válido para salvar")
            return 0
        
        # Faz UPSERT na tabela stock_dividends
        # onConflict especifica que duplicatas em (stock_id, payment_date) serão ignoradas
        response = supabase.table('stock_dividends')\
            .upsert(records_to_insert, on_conflict='stock_id,payment_date')\
            .execute()
        
        # Conta quantos registros foram salvos
        saved_count = len(response.data) if response.data else 0
        
        print(f"[OK] {saved_count} dividendos salvos com sucesso")
        return saved_count
        
    except Exception as e:
        print(f"[ERRO] Erro ao salvar dividendos no Supabase")
        print(f"Detalhes: {str(e)}")
        return 0

