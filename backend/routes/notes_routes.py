"""
Rotas para gerenciamento de observações sobre ações
"""
from flask import Blueprint, request, jsonify
from services.notes_service import get_stock_note, save_stock_note

notes_bp = Blueprint('notes', __name__)


@notes_bp.route('/api/notes/<ticker>', methods=['GET'])
def get_note(ticker):
    """
    GET /api/notes/<ticker>?user_id=...
    
    Busca a observação do usuário sobre uma ação
    
    Response: {
        "status": "success",
        "note_text": "...",
        "updated_at": "..."
    }
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id é obrigatório"
            }), 400
        
        result = get_stock_note(user_id, ticker)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "note_text": result.get('note_text', ''),
                "updated_at": result.get('updated_at')
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result.get('message', 'Erro ao buscar observação'),
                "note_text": "",
                "updated_at": None
            }), 400
            
    except Exception as e:
        print(f"Erro ao buscar observação: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500


@notes_bp.route('/api/notes/save', methods=['POST'])
def save_note():
    """
    POST /api/notes/save
    Body: {
        "user_id": "...",
        "ticker": "PETR4",
        "note_text": "..."
    }
    
    Salva ou atualiza a observação do usuário sobre uma ação
    
    Response: {
        "status": "success",
        "message": "...",
        "note_text": "...",
        "updated_at": "..."
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
        note_text = data.get('note_text', '')
        
        if not user_id or not ticker:
            return jsonify({
                "status": "error",
                "message": "user_id e ticker são obrigatórios"
            }), 400
        
        result = save_stock_note(user_id, ticker, note_text)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message'],
                "note_text": result.get('note_text', ''),
                "updated_at": result.get('updated_at')
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['message']
            }), 400
            
    except Exception as e:
        print(f"Erro ao salvar observação: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500

