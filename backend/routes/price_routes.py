"""
Rotas para consulta de preços de ações
"""
from flask import Blueprint, jsonify, request
from services.brapi_price_service import fetch_prices_from_brapi, validate_range_period
from services.price_cache_service import get_latest_cached_price
from services.quote_cache_service import get_or_set
from utils.helpers import format_response, format_error

bp = Blueprint('prices', __name__, url_prefix='/api')


@bp.route('/prices/<ticker>', methods=['GET'])
def get_stock_prices(ticker):
    """
    Busca o histórico de preços de uma ação
    
    Args:
        ticker: Código da ação (ex: PETR4, VALE3)
        
    Query Parameters:
        range: Período do histórico (padrão: "3m")
               Opções: 7d, 1m, 3m, 6m, 1y, 5y
    
    Returns:
        JSON com histórico de preços
        
    Example:
        GET /api/prices/PETR4?range=7d
        
        Response:
        {
            "status": "success",
            "data": {
                "ticker": "PETR4",
                "prices": [
                    {"date": "2024-01-15", "price": 28.50},
                    {"date": "2024-01-16", "price": 28.75}
                ],
                "count": 2
            }
        }
    """
    try:
        # Obtém o parâmetro 'range' da query string (padrão: 3m)
        range_period = request.args.get('range', '3m')
        
        # Valida o período
        if not validate_range_period(range_period):
            return jsonify(format_error(
                message='Período inválido',
                code=400,
                details=f"Período '{range_period}' não é válido. Use: 7d, 1m, 3m, 6m, 1y, 5y"
            ))
        
        # Busca os preços na BraAPI
        prices = get_or_set(
            f"history:{ticker.upper()}:{range_period}",
            lambda: fetch_prices_from_brapi(ticker, range_period),
            force_refresh=request.args.get('force', '').lower() == 'true',
        )
        
        # Se não encontrou dados
        if prices is None:
            return jsonify(format_error(
                message='Não foi possível obter os preços',
                code=404,
                details=f"Verifique se o ticker '{ticker}' está correto ou tente novamente mais tarde"
            ))
        
        # Retorna os dados
        return jsonify(format_response(
            data={
                'ticker': ticker.upper(),
                'prices': prices,
                'count': len(prices),
                'period': range_period
            },
            message=f'Preços de {ticker.upper()} obtidos com sucesso'
        )), 200
        
    except Exception as e:
        return jsonify(format_error(
            message='Erro ao buscar preços',
            code=500,
            details=str(e)
        ))


@bp.route('/stocks/quote/<ticker>', methods=['GET'])
def get_stock_quote(ticker):
    """Return a current quote, using the latest local value on provider failure."""
    normalized_ticker = ticker.upper().strip()
    force_refresh = request.args.get('force', '').lower() == 'true'

    try:
        quote = get_or_set(
            f"quote:{normalized_ticker}",
            lambda: fetch_prices_from_brapi(normalized_ticker, '3m'),
            force_refresh=force_refresh,
        )
        if quote is not None:
            if isinstance(quote, list):
                payload = {
                    'ticker': normalized_ticker,
                    'prices': quote,
                    'count': len(quote),
                }
            else:
                payload = quote
            payload['isFallback'] = False
            return jsonify({'status': 'success', 'data': payload}), 200

        fallback = get_latest_cached_price(normalized_ticker)
        if fallback:
            fallback['isFallback'] = True
            return jsonify({'status': 'success', 'data': fallback}), 200
        return jsonify({
            'status': 'error',
            'message': 'Cotação indisponível e sem histórico local',
        }), 503
    except Exception as error:
        fallback = get_latest_cached_price(normalized_ticker)
        if fallback:
            fallback['isFallback'] = True
            return jsonify({'status': 'success', 'data': fallback}), 200
        return jsonify({
            'status': 'error',
            'message': 'Cotação indisponível',
            'details': str(error),
        }), 503


@bp.route('/prices/test', methods=['GET'])
def test_brapi_service():
    """
    Testa o serviço da BraAPI com um ticker padrão
    
    Returns:
        JSON com resultado do teste
    """
    try:
        # Testa com PETR4
        ticker = "PETR4"
        prices = fetch_prices_from_brapi(ticker, "7d")
        
        if prices:
            return jsonify(format_response(
                data={
                    'message': 'Serviço BraAPI funcionando corretamente!',
                    'test_ticker': ticker,
                    'sample_data': prices[-3:] if len(prices) >= 3 else prices
                },
                message='Teste bem-sucedido'
            )), 200
        else:
            return jsonify(format_error(
                message='Falha no teste do serviço',
                code=500,
                details='Não foi possível buscar dados de teste'
            ))
            
    except Exception as e:
        return jsonify(format_error(
            message='Erro no teste',
            code=500,
            details=str(e)
        ))
