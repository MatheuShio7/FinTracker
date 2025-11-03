"""
Rotas para gerenciamento de portfolio e watchlist
"""
from flask import Blueprint, request, jsonify
from services.portfolio_service import (
    add_to_portfolio,
    add_to_watchlist,
    remove_from_portfolio,
    remove_from_watchlist,
    check_user_stocks_status,
    get_user_portfolio,
    get_user_watchlist,
    get_stock_quantity,
    update_stock_quantity,
    get_user_portfolio_full
)

portfolio_bp = Blueprint('portfolio', __name__)

@portfolio_bp.route('/api/portfolio/add', methods=['POST'])
def add_portfolio():
    """
    POST /api/portfolio/add
    Body: {"user_id": "...", "ticker": "PETR4", "quantity": 1}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Dados não fornecidos"
            }), 400
        
        user_id = data.get('user_id')
        ticker = data.get('ticker')
        quantity = data.get('quantity', 1)
        
        if not user_id or not ticker:
            return jsonify({
                "status": "error",
                "message": "user_id e ticker são obrigatórios"
            }), 400
        
        result = add_to_portfolio(user_id, ticker, quantity)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['message']
            }), 400
            
    except Exception as e:
        print(f"Erro ao adicionar à carteira: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/watchlist/add', methods=['POST'])
def add_watchlist():
    """
    POST /api/watchlist/add
    Body: {"user_id": "...", "ticker": "PETR4"}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Dados não fornecidos"
            }), 400
        
        user_id = data.get('user_id')
        ticker = data.get('ticker')
        
        if not user_id or not ticker:
            return jsonify({
                "status": "error",
                "message": "user_id e ticker são obrigatórios"
            }), 400
        
        result = add_to_watchlist(user_id, ticker)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['message']
            }), 400
            
    except Exception as e:
        print(f"Erro ao adicionar à watchlist: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/portfolio/remove/<ticker>', methods=['DELETE'])
def remove_portfolio(ticker):
    """
    DELETE /api/portfolio/remove/<ticker>
    Query: ?user_id=...
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id é obrigatório"
            }), 400
        
        result = remove_from_portfolio(user_id, ticker)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['message']
            }), 400
            
    except Exception as e:
        print(f"Erro ao remover da carteira: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/watchlist/remove/<ticker>', methods=['DELETE'])
def remove_watchlist(ticker):
    """
    DELETE /api/watchlist/remove/<ticker>
    Query: ?user_id=...
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id é obrigatório"
            }), 400
        
        result = remove_from_watchlist(user_id, ticker)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['message']
            }), 400
            
    except Exception as e:
        print(f"Erro ao remover da watchlist: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/stocks/check-status', methods=['POST'])
def check_stocks_status():
    """
    POST /api/stocks/check-status
    Body: {"user_id": "...", "tickers": ["PETR4", "VALE3"]}
    Response: {
        "PETR4": {"in_portfolio": true, "in_watchlist": false},
        "VALE3": {"in_portfolio": false, "in_watchlist": true}
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Dados não fornecidos"
            }), 400
        
        user_id = data.get('user_id')
        tickers = data.get('tickers', [])
        
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id é obrigatório"
            }), 400
        
        if not tickers or not isinstance(tickers, list):
            return jsonify({
                "status": "error",
                "message": "tickers deve ser uma lista não vazia"
            }), 400
        
        result = check_user_stocks_status(user_id, tickers)
        
        return jsonify({
            "status": "success",
            "data": result
        }), 200
            
    except Exception as e:
        print(f"Erro ao verificar status das ações: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    """
    GET /api/portfolio?user_id=...
    Response: {
        "status": "success",
        "data": [
            {"ticker": "PETR4", "company_name": "Petrobras PN", "quantity": 10},
            {"ticker": "VALE3", "company_name": "Vale ON", "quantity": 5}
        ]
    }
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id é obrigatório"
            }), 400
        
        result = get_user_portfolio(user_id)
        
        return jsonify({
            "status": "success",
            "data": result
        }), 200
            
    except Exception as e:
        print(f"Erro ao buscar portfolio: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    """
    GET /api/watchlist?user_id=...
    Response: {
        "status": "success",
        "data": [
            {"ticker": "MGLU3", "company_name": "Magazine Luiza ON"},
            {"ticker": "BBDC4", "company_name": "Bradesco PN"}
        ]
    }
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id é obrigatório"
            }), 400
        
        result = get_user_watchlist(user_id)
        
        return jsonify({
            "status": "success",
            "data": result
        }), 200
            
    except Exception as e:
        print(f"Erro ao buscar watchlist: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/portfolio/quantity/<ticker>', methods=['GET'])
def get_quantity(ticker):
    """
    GET /api/portfolio/quantity/<ticker>?user_id=...
    
    Busca a quantidade de uma ação na carteira do usuário
    
    Response: {
        "status": "success",
        "quantity": 10
    }
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id é obrigatório"
            }), 400
        
        result = get_stock_quantity(user_id, ticker)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "quantity": result['quantity']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result.get('message', 'Erro ao buscar quantidade'),
                "quantity": 0
            }), 400
            
    except Exception as e:
        print(f"Erro ao buscar quantidade: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/portfolio/update-quantity', methods=['POST'])
def update_quantity():
    """
    POST /api/portfolio/update-quantity
    Body: {
        "user_id": "...",
        "ticker": "PETR4",
        "quantity": 10
    }
    
    Atualiza a quantidade de uma ação na carteira
    - Se quantity = 0: remove da carteira
    - Se quantity > 0: atualiza ou adiciona
    
    Response: {
        "status": "success",
        "message": "...",
        "quantity": 10
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Dados não fornecidos"
            }), 400
        
        user_id = data.get('user_id')
        ticker = data.get('ticker')
        quantity = data.get('quantity')
        
        if not user_id or not ticker:
            return jsonify({
                "status": "error",
                "message": "user_id e ticker são obrigatórios"
            }), 400
        
        if quantity is None:
            return jsonify({
                "status": "error",
                "message": "quantity é obrigatória"
            }), 400
        
        # Converter para int
        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            return jsonify({
                "status": "error",
                "message": "quantity deve ser um número inteiro"
            }), 400
        
        result = update_stock_quantity(user_id, ticker, quantity)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message'],
                "quantity": result['quantity']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['message']
            }), 400
            
    except Exception as e:
        print(f"Erro ao atualizar quantidade: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@portfolio_bp.route('/api/portfolio/full', methods=['GET'])
def get_portfolio_full():
    """
    GET /api/portfolio/full?user_id=...
    
    Retorna carteira completa do usuário com preços atuais e valores calculados
    
    Response: {
        "status": "success",
        "data": [
            {
                "ticker": "PETR4",
                "current_price": 30.50,
                "quantity": 43,
                "total_value": 1311.50
            },
            ...
        ]
    }
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id é obrigatório"
            }), 400
        
        result = get_user_portfolio_full(user_id)
        
        return jsonify({
            "status": "success",
            "data": result
        }), 200
            
    except Exception as e:
        print(f"Erro ao buscar portfolio completo: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500

