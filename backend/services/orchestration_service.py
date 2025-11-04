"""
Serviço de orquestração de atualização de dados
Coordena todas as operações quando o usuário acessa a página de uma ação
"""
from datetime import datetime
from typing import Dict, Optional

# Importa serviços de busca externa
from services.brapi_price_service import fetch_prices_from_brapi
from services.yahoo_dividend_service import fetch_dividends_from_yahoo

# Importa serviços de cache
from services.price_cache_service import (
    get_stock_id_by_ticker,
    get_prices_from_cache,
    get_most_recent_price_date
)
from services.dividend_cache_service import (
    get_dividends_from_cache,
    check_if_dividends_exist,
    get_most_recent_dividend_date
)

# Importa serviço de detecção de atualização
from services.update_detection_service import (
    should_update_prices,
    should_update_dividends,
    convert_range_to_days
)

# Importa serviço de salvamento
from services.save_service import save_prices, save_dividends


def update_stock_on_page_view(ticker: str, range_param: str, force_update: bool = False) -> Dict[str, any]:
    """
    Orquestra todas as operações para atualizar dados quando usuário acessa a página
    
    Args:
        ticker: Código da ação (ex: "PETR4")
        range_param: Período do histórico ("7d", "1m" ou "3m")
        force_update: Se True, força atualização ignorando cache (padrão: False)
        
    Returns:
        Dicionário com resultado da operação:
        {
            "success": True/False,
            "data": {
                "ticker": "PETR4",
                "prices": [...],
                "dividends": [...],
                "prices_updated": True/False,
                "dividends_updated": True/False,
                "timestamp": "2024-10-17T12:30:45"
            },
            "error": "mensagem" (apenas se erro)
        }
    """
    
    print(f"\n{'='*80}")
    print(f"ORQUESTRAÇÃO: Iniciando atualização para {ticker} (range={range_param})")
    print(f"{'='*80}\n")
    
    # Variáveis de controle
    prices_updated = False
    dividends_updated = False
    prices_result = []
    dividends_result = []
    
    try:
        # ============================================================================
        # PASSO 1: CONVERTER RANGE PARA DIAS
        # ============================================================================
        print("[PASSO 1] Convertendo range para dias...")
        range_days = convert_range_to_days(range_param)
        
        if range_days is None:
            error_msg = f"Range inválido: '{range_param}'. Use: 7d, 1m ou 3m"
            print(f"[ERRO] {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
        
        print(f"[OK] Range '{range_param}' convertido para {range_days} dias\n")
        
        # ============================================================================
        # PASSO 2: BUSCAR STOCK_ID
        # ============================================================================
        print("[PASSO 2] Buscando stock_id no banco de dados...")
        stock_id = get_stock_id_by_ticker(ticker)
        
        if stock_id is None:
            error_msg = f"Ação '{ticker}' não encontrada no banco de dados"
            print(f"[ERRO] {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
        
        print(f"[OK] stock_id encontrado: {stock_id}\n")
        
        # ============================================================================
        # PASSO 3: VERIFICAR E ATUALIZAR PREÇOS
        # ============================================================================
        print("[PASSO 3] Processando PREÇOS...")
        print("-" * 80)
        
        try:
            # PASSO 3a: Buscar data mais recente no cache
            print("[PASSO 3a] Buscando data do preço mais recente no cache...")
            last_price_date = get_most_recent_price_date(stock_id)
            
            if last_price_date:
                print(f"[OK] Último preço em cache: {last_price_date}")
            else:
                print("[AVISO] Nenhum preço encontrado em cache")
            
            # PASSO 3b: Verificar se precisa atualizar
            print("\n[PASSO 3b] Verificando se precisa atualizar preços...")
            
            # Se force_update=True, sempre atualiza (ignora cache)
            if force_update:
                print("[INFO] force_update=True - Forçando atualização de preços")
                needs_update = True
            else:
                needs_update = should_update_prices(last_price_date, range_days)
            
            # PASSO 3c: Atualizar se necessário
            if needs_update:
                print("\n[PASSO 3c] Buscando preços da BraAPI...")
                
                # Busca preços da API externa
                prices_from_api = fetch_prices_from_brapi(ticker, range_param)
                
                if prices_from_api is None:
                    print("[ERRO] Erro ao buscar preços da BraAPI - Continuando...")
                elif len(prices_from_api) == 0:
                    print("[AVISO] Nenhum preço retornado da BraAPI")
                else:
                    # Salva preços no banco
                    print(f"[INFO] Salvando {len(prices_from_api)} preços no banco...")
                    saved_count = save_prices(stock_id, prices_from_api)
                    
                    if saved_count > 0:
                        prices_updated = True
                        print(f"[OK] {saved_count} preços salvos com sucesso")
                    else:
                        print("[AVISO] Nenhum preço foi salvo")
            else:
                print("[INFO] Cache de preços está atualizado - Não precisa buscar API")
            
            # PASSO 3d: Buscar preços do cache (sempre)
            print("\n[PASSO 3d] Buscando preços do cache...")
            prices_result = get_prices_from_cache(stock_id, range_days)
            
            if prices_result:
                print(f"[OK] {len(prices_result)} preços retornados do cache")
            else:
                print("[AVISO] Nenhum preço encontrado no cache")
            
        except Exception as e:
            print(f"[ERRO] Erro ao processar preços: {str(e)}")
            print("[INFO] Continuando com dividendos...")
        
        print("-" * 80 + "\n")
        
        # ============================================================================
        # PASSO 4: VERIFICAR E ATUALIZAR DIVIDENDOS
        # ============================================================================
        print("[PASSO 4] Processando DIVIDENDOS...")
        print("-" * 80)
        
        try:
            # PASSO 4a: Buscar informações de dividendos
            print("[PASSO 4a] Verificando dividendos no cache...")
            has_dividends = check_if_dividends_exist(stock_id)
            
            last_dividend_date = None
            if has_dividends:
                print("[OK] Dividendos encontrados em cache")
                last_dividend_date = get_most_recent_dividend_date(stock_id)
                if last_dividend_date:
                    print(f"[OK] Último dividendo em cache: {last_dividend_date}")
            else:
                print("[AVISO] Nenhum dividendo encontrado em cache")
            
            # PASSO 4b: Verificar se precisa atualizar
            print("\n[PASSO 4b] Verificando se precisa atualizar dividendos...")
            
            # Se force_update=True, sempre atualiza (ignora cache)
            if force_update:
                print("[INFO] force_update=True - Forçando atualização de dividendos")
                needs_update = True
            else:
                needs_update = should_update_dividends(last_dividend_date, has_dividends)
            
            # PASSO 4c: Atualizar se necessário
            if needs_update:
                print("\n[PASSO 4c] Buscando dividendos do Yahoo Finance...")
                
                # Busca dividendos da API externa
                dividends_from_api = fetch_dividends_from_yahoo(ticker)
                
                if dividends_from_api is None:
                    print("[ERRO] Erro ao buscar dividendos do Yahoo Finance - Continuando...")
                else:
                    # Salva dividendos no banco (mesmo se lista vazia)
                    if len(dividends_from_api) == 0:
                        print("[INFO] Nenhum dividendo retornado (ação pode não pagar dividendos)")
                    else:
                        print(f"[INFO] Salvando {len(dividends_from_api)} dividendos no banco...")
                        saved_count = save_dividends(stock_id, dividends_from_api)
                        
                        if saved_count > 0:
                            dividends_updated = True
                            print(f"[OK] {saved_count} dividendos salvos com sucesso")
                        else:
                            print("[AVISO] Nenhum dividendo foi salvo")
            else:
                print("[INFO] Cache de dividendos está atualizado - Não precisa buscar API")
            
            # PASSO 4d: Buscar dividendos do cache (sempre)
            print("\n[PASSO 4d] Buscando dividendos do cache...")
            dividends_result = get_dividends_from_cache(stock_id)
            
            if dividends_result:
                print(f"[OK] {len(dividends_result)} dividendos retornados do cache")
            else:
                print("[INFO] Nenhum dividendo encontrado no cache")
            
        except Exception as e:
            print(f"[ERRO] Erro ao processar dividendos: {str(e)}")
            print("[INFO] Retornando dados de preços...")
        
        print("-" * 80 + "\n")
        
        # ============================================================================
        # PASSO 5: PREPARAR RESPOSTA
        # ============================================================================
        print("[PASSO 5] Preparando resposta...")
        
        response = {
            "success": True,
            "data": {
                "ticker": ticker.upper(),
                "prices": prices_result,
                "dividends": dividends_result,
                "prices_updated": prices_updated,
                "dividends_updated": dividends_updated,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        print(f"\n[OK] Operação concluída com sucesso!")
        print(f"  - Preços retornados: {len(prices_result)}")
        print(f"  - Dividendos retornados: {len(dividends_result)}")
        print(f"  - Preços atualizados: {prices_updated}")
        print(f"  - Dividendos atualizados: {dividends_updated}")
        
        print(f"\n{'='*80}\n")
        
        return response
        
    except Exception as e:
        error_msg = f"Erro inesperado na orquestração: {str(e)}"
        print(f"\n[ERRO CRÍTICO] {error_msg}")
        print(f"{'='*80}\n")
        
        return {
            "success": False,
            "error": error_msg
        }

