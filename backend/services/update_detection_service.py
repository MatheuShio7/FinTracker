"""
Serviço de detecção de atualização de dados
Implementa lógica para verificar quando dados precisam ser atualizados
"""
from datetime import datetime, timedelta, date
from typing import Optional


def get_last_trading_day() -> date:
    """
    Retorna o último dia útil (considera fins de semana)
    
    Returns:
        Data do último dia útil (date object)
        
    Example:
        >>> last_day = get_last_trading_day()
        >>> print(f"Último dia útil: {last_day}")
    """
    today = datetime.now().date()
    weekday = today.weekday()
    
    # weekday: 0=Segunda, 1=Terça, 2=Quarta, 3=Quinta, 4=Sexta, 5=Sábado, 6=Domingo
    
    if weekday == 5:  # Sábado
        # Retorna sexta-feira (1 dia atrás)
        last_trading_day = today - timedelta(days=1)
        print(f"[INFO] Hoje é sábado, último pregão: {last_trading_day} (sexta)")
        return last_trading_day
        
    elif weekday == 6:  # Domingo
        # Retorna sexta-feira (2 dias atrás)
        last_trading_day = today - timedelta(days=2)
        print(f"[INFO] Hoje é domingo, último pregão: {last_trading_day} (sexta)")
        return last_trading_day
        
    else:  # Dia útil (segunda a sexta)
        print(f"[INFO] Hoje é dia útil: {today}")
        return today


def should_update_prices(last_price_date: Optional[date], range_days: int) -> bool:
    """
    Verifica se precisa atualizar preços
    
    Args:
        last_price_date: Data do preço mais recente (date object ou None)
        range_days: Número de dias do período (7, 30 ou 90)
        
    Returns:
        True se precisa atualizar, False se cache está OK
        
    Example:
        >>> needs_update = should_update_prices(date(2024, 1, 15), 7)
        >>> if needs_update:
        ...     print("Precisa atualizar preços")
    """
    try:
        # Se não há dados no cache, precisa atualizar
        if last_price_date is None:
            print("[INFO] Sem dados em cache - Precisa atualizar preços")
            return True
        
        # Valida o tipo da data
        if not isinstance(last_price_date, date):
            print(f"[ERRO] Tipo de data inválido: {type(last_price_date)}")
            return True
        
        # Obtém o último dia de pregão (considera fins de semana)
        last_trading_day = get_last_trading_day()
        
        # Verifica se os dados estão atualizados até o último pregão
        if last_price_date < last_trading_day:
            days_missing = (last_trading_day - last_price_date).days
            print(f"[INFO] Faltam {days_missing} dia(s) de dados - Precisa atualizar preços")
            return True
        
        # Cache está atualizado
        print(f"[INFO] Cache atualizado até {last_price_date} - Não precisa atualizar")
        return False
        
    except Exception as e:
        print(f"[ERRO] Erro ao verificar atualização de preços: {str(e)}")
        # Em caso de erro, retorna True para tentar atualizar
        return True


def should_update_dividends(last_dividend_date: Optional[date], has_dividends: bool) -> bool:
    """
    Verifica se precisa atualizar dividendos
    
    Args:
        last_dividend_date: Data do dividendo mais recente (date object ou None)
        has_dividends: Booleano indicando se tem dividendos em cache
        
    Returns:
        True se precisa atualizar, False se cache está OK
        
    Example:
        >>> needs_update = should_update_dividends(date(2024, 1, 15), True)
        >>> if needs_update:
        ...     print("Precisa atualizar dividendos")
    """
    try:
        # Se não há dividendos em cache, precisa buscar
        if not has_dividends:
            print("[INFO] Sem dividendos em cache - Precisa atualizar")
            return True
        
        # Se não há data do último dividendo, precisa atualizar
        if last_dividend_date is None:
            print("[INFO] Sem data do último dividendo - Precisa atualizar")
            return True
        
        # Valida o tipo da data
        if not isinstance(last_dividend_date, date):
            print(f"[ERRO] Tipo de data inválido: {type(last_dividend_date)}")
            return True
        
        # Obtém a data atual
        today = datetime.now().date()
        
        # Calcula quantos dias se passaram desde o último dividendo
        days_since_last = (today - last_dividend_date).days
        
        # Se passou mais de 7 dias, tenta atualizar
        # (dividendos não são tão frequentes, mas verifica periodicamente)
        if days_since_last > 7:
            print(f"[INFO] Último dividendo há {days_since_last} dias - Precisa atualizar")
            return True
        
        # Cache está recente o suficiente
        print(f"[INFO] Dividendos atualizados há {days_since_last} dia(s) - Não precisa atualizar")
        return False
        
    except Exception as e:
        print(f"[ERRO] Erro ao verificar atualização de dividendos: {str(e)}")
        # Em caso de erro, retorna True para tentar atualizar
        return True


def convert_range_to_days(range_param: str) -> Optional[int]:
    """
    Converte range em número de dias
    
    Args:
        range_param: String com o período ("7d", "1m" ou "3m")
        
    Returns:
        Número de dias (int) ou None se inválido
        
    Example:
        >>> days = convert_range_to_days("1m")
        >>> print(f"Período: {days} dias")  # 30
    """
    try:
        # Valida se é string
        if not isinstance(range_param, str):
            print(f"[ERRO] Range deve ser string, recebido: {type(range_param)}")
            return None
        
        # Converte para minúsculas para case-insensitive
        range_lower = range_param.lower().strip()
        
        # Mapeamento de range para dias
        range_mapping = {
            "7d": 7,
            "1m": 30,
            "3m": 90
        }
        
        # Verifica se o range é válido
        if range_lower not in range_mapping:
            print(f"[ERRO] Range inválido: '{range_param}'. Valores aceitos: 7d, 1m, 3m")
            return None
        
        days = range_mapping[range_lower]
        print(f"[INFO] Range '{range_param}' convertido para {days} dias")
        return days
        
    except Exception as e:
        print(f"[ERRO] Erro ao converter range: {str(e)}")
        return None

