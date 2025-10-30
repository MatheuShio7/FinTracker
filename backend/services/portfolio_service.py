"""
Serviço para gerenciamento de portfolio e watchlist de usuários
"""
from config.supabase_config import get_supabase_client

def add_to_portfolio(user_id, ticker, quantity=1):
    """
    Adiciona uma ação ao portfolio do usuário
    
    Args:
        user_id: ID do usuário
        ticker: Código da ação (ex: PETR4)
        quantity: Quantidade a adicionar (padrão: 1)
        
    Returns:
        dict: {"success": bool, "message": str}
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar stock_id pelo ticker
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        
        if not stock_response.data or len(stock_response.data) == 0:
            return {
                "success": False,
                "message": f"Ação {ticker} não encontrada no sistema"
            }
        
        stock_id = stock_response.data[0]['id']
        
        # 2. Verificar se já existe na carteira
        existing = supabase.table('user_portfolio')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('stock_id', stock_id)\
            .execute()
        
        if existing.data and len(existing.data) > 0:
            # Já existe - atualizar quantidade
            current_quantity = existing.data[0]['quantity']
            new_quantity = current_quantity + quantity
            
            supabase.table('user_portfolio')\
                .update({'quantity': new_quantity})\
                .eq('user_id', user_id)\
                .eq('stock_id', stock_id)\
                .execute()
            
            return {
                "success": True,
                "message": f"Quantidade atualizada! Total: {new_quantity}"
            }
        else:
            # Não existe - inserir novo registro
            supabase.table('user_portfolio').insert({
                'user_id': user_id,
                'stock_id': stock_id,
                'quantity': quantity
            }).execute()
            
            return {
                "success": True,
                "message": "Ação adicionada à carteira!"
            }
            
    except Exception as e:
        print(f"Erro ao adicionar à carteira: {str(e)}")
        return {
            "success": False,
            "message": f"Erro ao adicionar à carteira: {str(e)}"
        }


def add_to_watchlist(user_id, ticker):
    """
    Adiciona uma ação à watchlist do usuário
    
    Args:
        user_id: ID do usuário
        ticker: Código da ação (ex: PETR4)
        
    Returns:
        dict: {"success": bool, "message": str}
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar stock_id pelo ticker
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        
        if not stock_response.data or len(stock_response.data) == 0:
            return {
                "success": False,
                "message": f"Ação {ticker} não encontrada no sistema"
            }
        
        stock_id = stock_response.data[0]['id']
        
        # 2. Verificar se já existe na watchlist
        existing = supabase.table('user_watchlist')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('stock_id', stock_id)\
            .execute()
        
        if existing.data and len(existing.data) > 0:
            return {
                "success": False,
                "message": "Ação já está na watchlist"
            }
        
        # 3. Inserir novo registro
        supabase.table('user_watchlist').insert({
            'user_id': user_id,
            'stock_id': stock_id
        }).execute()
        
        return {
            "success": True,
            "message": "Ação adicionada à watchlist!"
        }
        
    except Exception as e:
        print(f"Erro ao adicionar à watchlist: {str(e)}")
        return {
            "success": False,
            "message": f"Erro ao adicionar à watchlist: {str(e)}"
        }


def remove_from_portfolio(user_id, ticker):
    """
    Remove uma ação do portfolio do usuário
    
    Args:
        user_id: ID do usuário
        ticker: Código da ação (ex: PETR4)
        
    Returns:
        dict: {"success": bool, "message": str}
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar stock_id pelo ticker
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        
        if not stock_response.data or len(stock_response.data) == 0:
            return {
                "success": False,
                "message": f"Ação {ticker} não encontrada no sistema"
            }
        
        stock_id = stock_response.data[0]['id']
        
        # 2. Deletar registro
        supabase.table('user_portfolio')\
            .delete()\
            .eq('user_id', user_id)\
            .eq('stock_id', stock_id)\
            .execute()
        
        return {
            "success": True,
            "message": "Ação removida da carteira!"
        }
        
    except Exception as e:
        print(f"Erro ao remover da carteira: {str(e)}")
        return {
            "success": False,
            "message": f"Erro ao remover da carteira: {str(e)}"
        }


def remove_from_watchlist(user_id, ticker):
    """
    Remove uma ação da watchlist do usuário
    
    Args:
        user_id: ID do usuário
        ticker: Código da ação (ex: PETR4)
        
    Returns:
        dict: {"success": bool, "message": str}
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar stock_id pelo ticker
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        
        if not stock_response.data or len(stock_response.data) == 0:
            return {
                "success": False,
                "message": f"Ação {ticker} não encontrada no sistema"
            }
        
        stock_id = stock_response.data[0]['id']
        
        # 2. Deletar registro
        supabase.table('user_watchlist')\
            .delete()\
            .eq('user_id', user_id)\
            .eq('stock_id', stock_id)\
            .execute()
        
        return {
            "success": True,
            "message": "Ação removida da watchlist!"
        }
        
    except Exception as e:
        print(f"Erro ao remover da watchlist: {str(e)}")
        return {
            "success": False,
            "message": f"Erro ao remover da watchlist: {str(e)}"
        }


def check_user_stocks_status(user_id, tickers):
    """
    Verifica quais ações de uma lista estão na carteira e/ou watchlist do usuário
    
    Args:
        user_id: ID do usuário
        tickers: Lista de códigos de ações (ex: ['PETR4', 'VALE3'])
        
    Returns:
        dict: {
            "ticker": {
                "in_portfolio": bool,
                "in_watchlist": bool
            }
        }
    """
    try:
        supabase = get_supabase_client()
        
        # Buscar stock_ids dos tickers
        stocks_response = supabase.table('stocks')\
            .select('id, ticker')\
            .in_('ticker', tickers)\
            .execute()
        
        if not stocks_response.data:
            return {}
        
        # Criar mapa ticker -> stock_id
        ticker_to_id = {stock['ticker']: stock['id'] for stock in stocks_response.data}
        stock_ids = list(ticker_to_id.values())
        
        # Buscar ações na carteira
        portfolio_response = supabase.table('user_portfolio')\
            .select('stock_id')\
            .eq('user_id', user_id)\
            .in_('stock_id', stock_ids)\
            .execute()
        
        portfolio_stock_ids = set(item['stock_id'] for item in portfolio_response.data) if portfolio_response.data else set()
        
        # Buscar ações na watchlist
        watchlist_response = supabase.table('user_watchlist')\
            .select('stock_id')\
            .eq('user_id', user_id)\
            .in_('stock_id', stock_ids)\
            .execute()
        
        watchlist_stock_ids = set(item['stock_id'] for item in watchlist_response.data) if watchlist_response.data else set()
        
        # Montar resultado
        result = {}
        for ticker, stock_id in ticker_to_id.items():
            result[ticker] = {
                "in_portfolio": stock_id in portfolio_stock_ids,
                "in_watchlist": stock_id in watchlist_stock_ids
            }
        
        return result
        
    except Exception as e:
        print(f"Erro ao verificar status das ações: {str(e)}")
        return {}


def get_user_portfolio(user_id):
    """
    Retorna todas as ações do portfolio do usuário
    
    Args:
        user_id: ID do usuário
        
    Returns:
        list: Lista de ações com ticker e quantidade
    """
    try:
        supabase = get_supabase_client()
        
        # Buscar portfolio com join na tabela stocks
        response = supabase.table('user_portfolio')\
            .select('quantity, stocks(ticker, company_name)')\
            .eq('user_id', user_id)\
            .execute()
        
        if not response.data:
            return []
        
        # Formatar resultado
        result = []
        for item in response.data:
            if item.get('stocks'):
                result.append({
                    'ticker': item['stocks']['ticker'],
                    'company_name': item['stocks']['company_name'],
                    'quantity': item['quantity']
                })
        
        return result
        
    except Exception as e:
        print(f"Erro ao buscar portfolio: {str(e)}")
        return []


def get_user_watchlist(user_id):
    """
    Retorna todas as ações da watchlist do usuário
    
    Args:
        user_id: ID do usuário
        
    Returns:
        list: Lista de ações com ticker
    """
    try:
        supabase = get_supabase_client()
        
        # Buscar watchlist com join na tabela stocks
        response = supabase.table('user_watchlist')\
            .select('stocks(ticker, company_name)')\
            .eq('user_id', user_id)\
            .execute()
        
        if not response.data:
            return []
        
        # Formatar resultado
        result = []
        for item in response.data:
            if item.get('stocks'):
                result.append({
                    'ticker': item['stocks']['ticker'],
                    'company_name': item['stocks']['company_name']
                })
        
        return result
        
    except Exception as e:
        print(f"Erro ao buscar watchlist: {str(e)}")
        return []


def get_stock_quantity(user_id, ticker):
    """
    Busca a quantidade de uma ação na carteira do usuário
    
    Args:
        user_id: ID do usuário
        ticker: Código da ação (ex: PETR4)
        
    Returns:
        dict: {
            "success": bool,
            "quantity": int,
            "message": str (opcional)
        }
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar stock_id pelo ticker
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        
        if not stock_response.data or len(stock_response.data) == 0:
            return {
                "success": False,
                "quantity": 0,
                "message": f"Ação {ticker} não encontrada no sistema"
            }
        
        stock_id = stock_response.data[0]['id']
        
        # 2. Buscar quantidade na carteira
        portfolio_response = supabase.table('user_portfolio')\
            .select('quantity')\
            .eq('user_id', user_id)\
            .eq('stock_id', stock_id)\
            .execute()
        
        if portfolio_response.data and len(portfolio_response.data) > 0:
            # Tem na carteira
            return {
                "success": True,
                "quantity": portfolio_response.data[0]['quantity']
            }
        else:
            # Não tem na carteira
            return {
                "success": True,
                "quantity": 0
            }
            
    except Exception as e:
        print(f"Erro ao buscar quantidade: {str(e)}")
        return {
            "success": False,
            "quantity": 0,
            "message": f"Erro ao buscar quantidade: {str(e)}"
        }


def update_stock_quantity(user_id, ticker, quantity):
    """
    Atualiza a quantidade de uma ação na carteira do usuário
    
    Regras:
    - Se quantity = 0: DELETAR registro da carteira
    - Se quantity > 0 E já existe: UPDATE do quantity
    - Se quantity > 0 E não existe: INSERT novo registro
    
    Args:
        user_id: ID do usuário
        ticker: Código da ação (ex: PETR4)
        quantity: Nova quantidade (0 para remover)
        
    Returns:
        dict: {
            "success": bool,
            "quantity": int,
            "message": str
        }
    """
    try:
        supabase = get_supabase_client()
        
        # Validar quantidade
        if quantity < 0:
            return {
                "success": False,
                "quantity": 0,
                "message": "Quantidade não pode ser negativa"
            }
        
        # 1. Buscar stock_id pelo ticker
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        
        if not stock_response.data or len(stock_response.data) == 0:
            return {
                "success": False,
                "quantity": 0,
                "message": f"Ação {ticker} não encontrada no sistema"
            }
        
        stock_id = stock_response.data[0]['id']
        
        # 2. Verificar se já existe na carteira
        existing = supabase.table('user_portfolio')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('stock_id', stock_id)\
            .execute()
        
        if quantity == 0:
            # Remover da carteira
            supabase.table('user_portfolio')\
                .delete()\
                .eq('user_id', user_id)\
                .eq('stock_id', stock_id)\
                .execute()
            
            return {
                "success": True,
                "quantity": 0,
                "message": "Ação removida da carteira!"
            }
        
        elif existing.data and len(existing.data) > 0:
            # Já existe - atualizar quantidade
            supabase.table('user_portfolio')\
                .update({'quantity': quantity})\
                .eq('user_id', user_id)\
                .eq('stock_id', stock_id)\
                .execute()
            
            return {
                "success": True,
                "quantity": quantity,
                "message": f"Quantidade atualizada para {quantity}"
            }
        else:
            # Não existe - inserir novo registro
            supabase.table('user_portfolio').insert({
                'user_id': user_id,
                'stock_id': stock_id,
                'quantity': quantity
            }).execute()
            
            return {
                "success": True,
                "quantity": quantity,
                "message": f"Ação adicionada à carteira com {quantity} unidades"
            }
            
    except Exception as e:
        print(f"Erro ao atualizar quantidade: {str(e)}")
        return {
            "success": False,
            "quantity": 0,
            "message": f"Erro ao atualizar quantidade: {str(e)}"
        }
