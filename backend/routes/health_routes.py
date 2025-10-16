"""
Rotas de health check e status da API
"""
from flask import Blueprint, jsonify
from datetime import datetime

bp = Blueprint('health', __name__, url_prefix='/api')

@bp.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint para verificar se a API está funcionando
    
    Returns:
        JSON com status da API e timestamp
    """
    return jsonify({
        'status': 'success',
        'message': 'FinTracker API está funcionando!',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

