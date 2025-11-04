"""
Rotas para visualização de ações
Endpoint chamado quando usuário acessa a página de uma ação
"""
from flask import Blueprint, jsonify, request
from datetime import datetime
from services.orchestration_service import update_stock_on_page_view

bp = Blueprint('stock_view', __name__, url_prefix='/api')


@bp.route('/stocks/<ticker>/view', methods=['POST'])
def view_stock(ticker: str):
    """
    Endpoint chamado quando usuário acessa a página de uma ação
    
    Args:
        ticker: Código da ação na URL (ex: PETR4)
        
    Query Parameters:
        range: Período do histórico (padrão: "3m")
               Opções: "7d", "1m", "3m"
    
    Returns:
        JSON com dados da ação (preços e dividendos)
        
    Example:
        POST /api/stocks/PETR4/view?range=3m
        
        Response (Sucesso - 200):
        {
            "status": "success",
            "message": "Dados de PETR4 obtidos com sucesso",
            "timestamp": "2024-10-17T12:30:45",
            "data": {
                "ticker": "PETR4",
                "prices": [...],
                "dividends": [...],
                "prices_updated": true,
                "dividends_updated": false
            }
        }
        
        Response (Erro - 400):
        {
            "status": "error",
            "message": "Ação INVALID não encontrada",
            "timestamp": "2024-10-17T12:30:45",
            "error": "Stock not found"
        }
    """
    
    try:
        # ========================================================================
        # VALIDAÇÃO: Verificar se ticker está vazio
        # ========================================================================
        if not ticker or ticker.strip() == "":
            return jsonify({
                "status": "error",
                "message": "Ticker não pode ser vazio",
                "timestamp": datetime.utcnow().isoformat(),
                "error": "Invalid ticker"
            }), 400
        
        # ========================================================================
        # EXTRAÇÃO: Obter range e force_update dos query parameters
        # ========================================================================
        range_param = request.args.get('range', default='3m', type=str)
        force_update = request.args.get('force_update', default='false', type=str).lower() == 'true'
        
        # ========================================================================
        # VALIDAÇÃO: Verificar se range é válido
        # ========================================================================
        valid_ranges = ["7d", "1m", "3m"]
        if range_param.lower() not in valid_ranges:
            return jsonify({
                "status": "error",
                "message": f"Range inválido: '{range_param}'. Use: 7d, 1m ou 3m",
                "timestamp": datetime.utcnow().isoformat(),
                "error": "Invalid range parameter"
            }), 400
        
        # ========================================================================
        # ORQUESTRAÇÃO: Chamar função que coordena todas as operações
        # ========================================================================
        print(f"[INFO] force_update={force_update}")
        result = update_stock_on_page_view(ticker, range_param, force_update)
        
        # ========================================================================
        # RESPOSTA: Processar resultado da orquestração
        # ========================================================================
        if result.get("success"):
            # Sucesso - Retorna HTTP 200
            return jsonify({
                "status": "success",
                "message": f"Dados de {ticker.upper()} obtidos com sucesso",
                "timestamp": datetime.utcnow().isoformat(),
                "data": result["data"]
            }), 200
        else:
            # Erro - Retorna HTTP 400
            error_message = result.get("error", "Erro desconhecido")
            return jsonify({
                "status": "error",
                "message": error_message,
                "timestamp": datetime.utcnow().isoformat(),
                "error": "Operation failed"
            }), 400
    
    except Exception as e:
        # Erro inesperado - Retorna HTTP 500
        return jsonify({
            "status": "error",
            "message": f"Erro interno ao processar requisição: {str(e)}",
            "timestamp": datetime.utcnow().isoformat(),
            "error": "Internal server error"
        }), 500


@bp.route('/stocks/<ticker>/refresh', methods=['POST'])
def refresh_stock(ticker: str):
    """
    Endpoint para atualização rápida e forçada de preço atual e dividendos
    
    Diferenças do endpoint /view:
    - NÃO busca histórico completo de preços (mais rápido)
    - Busca APENAS preço atual e dividendos
    - SEMPRE força atualização (ignora cache/should_update)
    - Retorna apenas dados essenciais
    
    Args:
        ticker: Código da ação na URL (ex: PETR4)
        
    Returns:
        JSON com dados atualizados
        
    Example:
        POST /api/stocks/PETR4/refresh
        
        Response (Sucesso - 200):
        {
            "status": "success",
            "message": "Dados de PETR4 atualizados com sucesso",
            "timestamp": "2024-10-17T12:30:45",
            "current_price": 30.50,
            "dividends": [...]
        }
    """
    
    try:
        # ========================================================================
        # VALIDAÇÃO: Verificar se ticker está vazio
        # ========================================================================
        if not ticker or ticker.strip() == "":
            return jsonify({
                "status": "error",
                "message": "Ticker não pode ser vazio",
                "timestamp": datetime.utcnow().isoformat(),
                "error": "Invalid ticker"
            }), 400
        
        print(f"\n{'='*80}")
        print(f"REFRESH RÁPIDO: Iniciando atualização forçada para {ticker}")
        print(f"{'='*80}\n")
        
        # ========================================================================
        # IMPORTAÇÕES NECESSÁRIAS (dentro da função para evitar importação circular)
        # ========================================================================
        from services.brapi_price_service import fetch_prices_from_brapi
        from services.yahoo_dividend_service import fetch_dividends_from_yahoo
        from services.price_cache_service import get_stock_id_by_ticker
        from services.save_service import save_prices, save_dividends
        from services.dividend_cache_service import get_dividends_from_cache
        
        # ========================================================================
        # PASSO 1: BUSCAR STOCK_ID
        # ========================================================================
        print("[PASSO 1] Buscando stock_id no banco de dados...")
        stock_id = get_stock_id_by_ticker(ticker)
        
        if stock_id is None:
            error_msg = f"Ação '{ticker}' não encontrada no banco de dados"
            print(f"[ERRO] {error_msg}")
            return jsonify({
                "status": "error",
                "message": error_msg,
                "timestamp": datetime.utcnow().isoformat(),
                "error": "Stock not found"
            }), 400
        
        print(f"[OK] stock_id encontrado: {stock_id}\n")
        
        # ========================================================================
        # PASSO 2: FORÇAR BUSCA DE PREÇO ATUAL
        # ========================================================================
        print("[PASSO 2] Forçando busca de preço atual (1d)...")
        print("-" * 80)
        
        current_price = None
        
        try:
            # Busca preços de 1 dia da BraPI (retorna lista com preço atual)
            prices_from_api = fetch_prices_from_brapi(ticker, "1d")
            
            if prices_from_api and len(prices_from_api) > 0:
                # Pega o último preço (mais recente)
                latest_price_data = prices_from_api[-1]
                current_price = latest_price_data['price']
                
                print(f"[INFO] Preço atual obtido: R$ {current_price:.2f}")
                
                # Salva no banco
                print(f"[INFO] Salvando preço no banco...")
                saved_count = save_prices(stock_id, prices_from_api)
                
                if saved_count > 0:
                    print(f"[OK] Preço salvo com sucesso")
                else:
                    print("[AVISO] Preço não foi salvo")
            else:
                print("[AVISO] Nenhum preço retornado da BraAPI")
        
        except Exception as e:
            print(f"[ERRO] Erro ao buscar preço atual: {str(e)}")
        
        print("-" * 80 + "\n")
        
        # ========================================================================
        # PASSO 3: FORÇAR BUSCA DE DIVIDENDOS
        # ========================================================================
        print("[PASSO 3] Forçando busca de dividendos...")
        print("-" * 80)
        
        dividends_result = []
        
        try:
            # Busca dividendos do Yahoo Finance
            dividends_from_api = fetch_dividends_from_yahoo(ticker)
            
            if dividends_from_api is not None:
                if len(dividends_from_api) > 0:
                    print(f"[INFO] {len(dividends_from_api)} dividendos obtidos")
                    
                    # Salva no banco
                    print(f"[INFO] Salvando dividendos no banco...")
                    saved_count = save_dividends(stock_id, dividends_from_api)
                    
                    if saved_count > 0:
                        print(f"[OK] {saved_count} dividendos salvos com sucesso")
                else:
                    print("[INFO] Nenhum dividendo encontrado (ação pode não pagar dividendos)")
                
                # Busca dividendos do cache (dados atualizados)
                dividends_result = get_dividends_from_cache(stock_id)
            else:
                print("[AVISO] Erro ao buscar dividendos do Yahoo Finance")
        
        except Exception as e:
            print(f"[ERRO] Erro ao buscar dividendos: {str(e)}")
        
        print("-" * 80 + "\n")
        
        # ========================================================================
        # PASSO 4: PREPARAR RESPOSTA
        # ========================================================================
        print("[PASSO 4] Preparando resposta...")
        
        print(f"\n[OK] Atualização forçada concluída!")
        print(f"  - Preço atual: R$ {current_price:.2f}" if current_price else "  - Preço atual: Não disponível")
        print(f"  - Dividendos retornados: {len(dividends_result)}")
        print(f"\n{'='*80}\n")
        
        return jsonify({
            "status": "success",
            "message": f"Dados de {ticker.upper()} atualizados com sucesso",
            "timestamp": datetime.utcnow().isoformat(),
            "current_price": current_price,
            "dividends": dividends_result
        }), 200
    
    except Exception as e:
        # Erro inesperado - Retorna HTTP 500
        print(f"\n[ERRO CRÍTICO] {str(e)}")
        print(f"{'='*80}\n")
        
        return jsonify({
            "status": "error",
            "message": f"Erro interno ao processar requisição: {str(e)}",
            "timestamp": datetime.utcnow().isoformat(),
            "error": "Internal server error"
        }), 500
