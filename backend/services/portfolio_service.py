"""
Serviço para gerenciamento de portfolio e watchlist de usuários
"""
from config.supabase_config import get_supabase_client
from datetime import datetime, timedelta


def ensure_current_stock_price(stock_id, ticker):
    """
    Garante que a ação tenha preço atual no banco de dados (OTIMIZADO)
    
    Esta função é otimizada para carteira - busca APENAS o preço atual,
    não histórico completo. Muito mais rápida que ensure_stock_price().
    
    Args:
        stock_id: UUID da ação
        ticker: Código da ação (ex: PETR4)
        
    Returns:
        bool: True se garantiu preço atual, False se houve erro
    """
    try:
        from services.brapi_price_service import get_current_stock_price
        from services.save_service import save_prices
        
        print(f"[INFO] Garantindo preço atual para {ticker}...")
        
        # Busca apenas o preço atual (muito mais rápido)
        current_price_data = get_current_stock_price(ticker)
        
        if not current_price_data:
            print(f"[AVISO] Não foi possível buscar preço atual para {ticker}")
            return False
        
        # Converte para formato compatível com save_prices
        price_list = [{
            "date": current_price_data["date"],
            "price": current_price_data["current_price"]
        }]
        
        # Salvar preço no banco
        saved_count = save_prices(stock_id, price_list)
        
        if saved_count > 0:
            print(f"[OK] Preço atual salvo para {ticker}: R$ {current_price_data['current_price']:.2f}")
            return True
        else:
            print(f"[AVISO] Não foi possível salvar preço para {ticker}")
            return False
            
    except Exception as e:
        print(f"[ERRO] Erro ao garantir preço atual para {ticker}: {str(e)}")
        return False


def ensure_stock_price(stock_id, ticker, force_update=False):
    """
    Garante que a ação tenha preço recente no banco de dados.
    Se não tiver, busca da BraAPI e salva.
    
    Args:
        stock_id: UUID da ação
        ticker: Código da ação (ex: PETR4)
        force_update: Se True, sempre busca da API ignorando cache (padrão: False)
        
    Returns:
        bool: True se garantiu preço, False se houve erro
    """
    try:
        from services.brapi_price_service import fetch_prices_from_brapi
        from services.save_service import save_prices
        
        supabase = get_supabase_client()
        
        # Se force_update=True, pula verificação de cache e busca direto da API
        if force_update:
            print(f"[INFO] force_update=True - Buscando {ticker} da BraAPI (ignorando cache)...")
            prices = fetch_prices_from_brapi(ticker, range_period="7d")
            
            if not prices or len(prices) == 0:
                print(f"[AVISO] Não foi possível buscar preços para {ticker}")
                return False
            
            # Salvar preços no banco
            saved_count = save_prices(stock_id, prices)
            
            if saved_count > 0:
                print(f"[OK] {saved_count} preços salvos para {ticker}")
                return True
            else:
                print(f"[AVISO] Nenhum preço foi salvo para {ticker}")
                return False
        
        # Verificar se já tem preço recente (últimos 7 dias)
        seven_days_ago = (datetime.now() - timedelta(days=7)).date().isoformat()
        
        price_check = supabase.table('stock_prices')\
            .select('date, price')\
            .eq('stock_id', stock_id)\
            .gte('date', seven_days_ago)\
            .order('date', desc=True)\
            .limit(1)\
            .execute()
        
        if price_check.data and len(price_check.data) > 0:
            print(f"[INFO] {ticker} já tem preço recente no banco: {price_check.data[0]['date']}")
            return True
        
        # Não tem preço recente - buscar da BraAPI
        print(f"[INFO] {ticker} sem preço recente, buscando da BraAPI...")
        prices = fetch_prices_from_brapi(ticker, range_period="7d")
        
        if not prices or len(prices) == 0:
            print(f"[AVISO] Não foi possível buscar preços para {ticker}")
            return False
        
        # Salvar preços no banco
        saved_count = save_prices(stock_id, prices)
        
        if saved_count > 0:
            print(f"[OK] {saved_count} preços salvos para {ticker}")
            return True
        else:
            print(f"[AVISO] Nenhum preço foi salvo para {ticker}")
            return False
            
    except Exception as e:
        print(f"[ERRO] Erro ao garantir preço para {ticker}: {str(e)}")
        return False


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
            
            # OTIMIZADO: Garantir preço atual (muito mais rápido)
            ensure_current_stock_price(stock_id, ticker)
            
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
            
            # OTIMIZADO: Garantir preço atual (muito mais rápido)
            ensure_current_stock_price(stock_id, ticker)
            
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
            
            # OTIMIZADO: Garantir preço atual (muito mais rápido)
            ensure_current_stock_price(stock_id, ticker)
            
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
            
            # OTIMIZADO: Garantir preço atual (muito mais rápido)
            ensure_current_stock_price(stock_id, ticker)
            
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


def update_portfolio_prices_on_login(user_id):
    """
    Atualiza preços de TODAS as ações da carteira (usado apenas no login)
    
    Esta função busca preços atuais da API para todas as ações da carteira
    do usuário. Deve ser chamada apenas quando o usuário faz login.
    
    Args:
        user_id: ID do usuário
        
    Returns:
        dict: {"success": bool, "updated_count": int, "message": str}
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar todas as ações da carteira do usuário
        portfolio_response = supabase.table('user_portfolio')\
            .select('stock_id, stocks(ticker, id)')\
            .eq('user_id', user_id)\
            .execute()
        
        if not portfolio_response.data or len(portfolio_response.data) == 0:
            return {
                "success": True,
                "updated_count": 0,
                "message": "Usuário não tem ações na carteira"
            }
        
        print(f"[LOGIN] Atualizando preços para {len(portfolio_response.data)} ações da carteira...")
        
        updated_count = 0
        for item in portfolio_response.data:
            try:
                if not item.get('stocks'):
                    continue
                
                ticker = item['stocks']['ticker']
                stock_id = item['stock_id']
                
                # Buscar preço atual da API e salvar
                success = ensure_current_stock_price(stock_id, ticker)
                if success:
                    updated_count += 1
                    
            except Exception as e:
                print(f"[ERRO] Erro ao atualizar preço de {ticker}: {str(e)}")
                continue
        
        print(f"[LOGIN] ✅ {updated_count} preços atualizados com sucesso")
        return {
            "success": True,
            "updated_count": updated_count,
            "message": f"{updated_count} preços atualizados no login"
        }
        
    except Exception as e:
        print(f"[ERRO] Erro ao atualizar preços no login: {str(e)}")
        return {
            "success": False,
            "updated_count": 0,
            "message": f"Erro ao atualizar preços: {str(e)}"
        }


def get_user_portfolio_full(user_id):
    """
    Retorna carteira completa do usuário com preços atuais e valores calculados
    
    Args:
        user_id: ID do usuário
        
    Returns:
        list: [
            {
                "ticker": "PETR4",
                "current_price": 30.50,
                "quantity": 43,
                "total_value": 1311.50
            },
            ...
        ]
        Retorna lista vazia [] se usuário não tiver ações
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar portfolio com join nas tabelas stocks e stock_prices
        # Query complexa para buscar:
        # - user_portfolio (quantity)
        # - stocks (ticker, id)
        # - stock_prices (price mais recente)
        
        portfolio_response = supabase.table('user_portfolio')\
            .select('quantity, stock_id, stocks(ticker, id)')\
            .eq('user_id', user_id)\
            .execute()
        
        if not portfolio_response.data or len(portfolio_response.data) == 0:
            print(f"[INFO] Usuário {user_id} não tem ações na carteira")
            return []
        
        print(f"[INFO] Carregando carteira para {len(portfolio_response.data)} ações...")
        print(f"[INFO] OTIMIZADO: Usando preços em cache (não busca API)")
        
        # 2. Para cada ação, buscar preços do cache (sem atualizar da API)
        result = []
        for item in portfolio_response.data:
            try:
                if not item.get('stocks'):
                    continue
                
                ticker = item['stocks']['ticker']
                stock_id = item['stock_id']
                quantity = item['quantity']
                
                # OTIMIZADO: Não busca API - apenas usa dados do cache
                
                # Buscar preço mais recente dessa ação (agora atualizado)
                price_response = supabase.table('stock_prices')\
                    .select('price')\
                    .eq('stock_id', stock_id)\
                    .order('date', desc=True)\
                    .limit(1)\
                    .execute()
                
                # Se não encontrou preço, usar None
                current_price = None
                if price_response.data and len(price_response.data) > 0:
                    current_price = float(price_response.data[0]['price'])
                
                # Calcular valor total
                total_value = None
                if current_price is not None:
                    total_value = quantity * current_price
                
                result.append({
                    'ticker': ticker,
                    'current_price': current_price,
                    'quantity': quantity,
                    'total_value': total_value
                })
                
            except Exception as e:
                print(f"[ERRO] Erro ao processar ação: {str(e)}")
                continue
        
        print(f"[OK] Portfolio completo retornado: {len(result)} ações")
        return result
        
    except Exception as e:
        print(f"[ERRO] Erro ao buscar portfolio completo: {str(e)}")
        return []