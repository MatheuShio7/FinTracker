"""
Rotas para consulta de dividendos de ações
"""
from flask import Blueprint, jsonify, request
from services.yahoo_dividend_service import fetch_dividends_from_yahoo
from utils.helpers import format_response, format_error

bp = Blueprint('dividends', __name__, url_prefix='/api')


@bp.route('/dividends/<ticker>', methods=['GET'])
def get_stock_dividends(ticker):
    """
    Busca o histórico de dividendos de uma ação
    
    Args:
        ticker: Código da ação (ex: PETR4, VALE3)
        
    Returns:
        JSON com histórico de dividendos (últimos 12)
        
    Example:
        GET /api/dividends/PETR4
        
        Response:
        {
            "status": "success",
            "data": {
                "ticker": "PETR4",
                "dividends": [
                    {"payment_date": "2024-03-30", "value": 1.25},
                    {"payment_date": "2024-06-28", "value": 1.30}
                ],
                "count": 2
            }
        }
    """
    try:
        # Busca os dividendos no Yahoo Finance
        dividends = fetch_dividends_from_yahoo(ticker)
        
        # Se o ticker não existe
        if dividends is None:
            return jsonify(format_error(
                message='Ticker não encontrado',
                code=404,
                details=f"O ticker '{ticker}' não foi encontrado no Yahoo Finance"
            ))
        
        # Se não há dividendos
        if not dividends:
            return jsonify(format_response(
                data={
                    'ticker': ticker.upper(),
                    'dividends': [],
                    'count': 0,
                    'message': 'Nenhum dividendo encontrado para esta ação'
                },
                message=f'Nenhum dividendo encontrado para {ticker.upper()}'
            )), 200
        
        # Retorna os dados
        return jsonify(format_response(
            data={
                'ticker': ticker.upper(),
                'dividends': dividends,
                'count': len(dividends)
            },
            message=f'Dividendos de {ticker.upper()} obtidos com sucesso'
        )), 200
        
    except Exception as e:
        return jsonify(format_error(
            message='Erro ao buscar dividendos',
            code=500,
            details=str(e)
        ))


@bp.route('/dividends/test', methods=['GET'])
def test_dividend_service():
    """
    Testa o serviço de dividendos com um ticker padrão
    
    Returns:
        JSON com resultado do teste
    """
    try:
        # Testa com PETR4
        ticker = "PETR4"
        dividends = fetch_dividends_from_yahoo(ticker)
        
        if dividends is not None and dividends:
            return jsonify(format_response(
                data={
                    'message': 'Serviço de dividendos funcionando corretamente!',
                    'test_ticker': ticker,
                    'sample_data': dividends[-3:] if len(dividends) >= 3 else dividends
                },
                message='Teste bem-sucedido'
            )), 200
        elif dividends is not None:
            return jsonify(format_response(
                data={
                    'message': 'Serviço funcionando, mas ticker sem dividendos',
                    'test_ticker': ticker
                },
                message='Teste parcialmente bem-sucedido'
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

