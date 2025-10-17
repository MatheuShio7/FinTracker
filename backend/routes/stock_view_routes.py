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
        # EXTRAÇÃO: Obter range do query parameter (padrão "3m")
        # ========================================================================
        range_param = request.args.get('range', default='3m', type=str)
        
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
        result = update_stock_on_page_view(ticker, range_param)
        
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

