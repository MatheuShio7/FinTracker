"""
Rotas para gerenciamento de transações do usuário.
"""
from flask import Blueprint, request, jsonify, g

from services.transaction_service import (
    create_transaction,
    list_transactions,
    update_transaction,
    delete_transaction,
)
from utils.auth_context import require_authenticated_user


transactions_bp = Blueprint('transactions', __name__)


@transactions_bp.route('/api/transactions', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def create_transaction_route():
    """Cria uma transação para o usuário autenticado."""
    try:
        payload = request.get_json(silent=True) or {}
        user_id = g.auth_user_id

        result = create_transaction(user_id, payload)

        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message'],
                "data": result.get('data')
            }), 201

        return jsonify({
            "status": "error",
            "message": result.get('message', 'Erro ao criar transação')
        }), 400
    except Exception as error:
        print(f"Erro ao criar transação: {str(error)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(error)}"
        }), 500


@transactions_bp.route('/api/transactions', methods=['GET'])
@require_authenticated_user(allow_legacy=False)
def list_transactions_route():
    """Lista transações do usuário autenticado."""
    try:
        user_id = g.auth_user_id
        stock_id = request.args.get('stock_id')

        result = list_transactions(user_id, stock_id=stock_id)

        if result['success']:
            return jsonify({
                "status": "success",
                "data": result.get('data', [])
            }), 200

        return jsonify({
            "status": "error",
            "message": result.get('message', 'Erro ao listar transações')
        }), 400
    except Exception as error:
        print(f"Erro ao listar transações: {str(error)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(error)}"
        }), 500


@transactions_bp.route('/api/transactions/<transaction_id>', methods=['PATCH'])
@require_authenticated_user(allow_legacy=False)
def update_transaction_route(transaction_id):
    """Atualiza uma transação do usuário autenticado."""
    try:
        payload = request.get_json(silent=True) or {}
        user_id = g.auth_user_id

        result = update_transaction(user_id, transaction_id, payload)

        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message'],
                "data": result.get('data')
            }), 200

        return jsonify({
            "status": "error",
            "message": result.get('message', 'Erro ao atualizar transação')
        }), 400
    except Exception as error:
        print(f"Erro ao atualizar transação: {str(error)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(error)}"
        }), 500


@transactions_bp.route('/api/transactions/<transaction_id>', methods=['DELETE'])
@require_authenticated_user(allow_legacy=False)
def delete_transaction_route(transaction_id):
    """Remove uma transação do usuário autenticado."""
    try:
        user_id = g.auth_user_id

        result = delete_transaction(user_id, transaction_id)

        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message']
            }), 200

        return jsonify({
            "status": "error",
            "message": result.get('message', 'Erro ao remover transação')
        }), 400
    except Exception as error:
        print(f"Erro ao remover transação: {str(error)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(error)}"
        }), 500
