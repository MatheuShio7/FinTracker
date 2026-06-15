"""
Rotas de autenticação MFA (Multi-Factor Authentication)
Endpoints para verificar status de MFA (TOTP) de um usuário
"""
from flask import Blueprint, jsonify, g
from utils.auth_context import require_authenticated_user
from services.auth_service import get_mfa_status
from services.notification_service import sync_mfa_notification

# Cria blueprint para rotas de MFA
bp = Blueprint('mfa', __name__, url_prefix='/api/mfa')


@bp.route('/status', methods=['GET'])
@require_authenticated_user()
def mfa_status():
    """
    GET /api/mfa/status
    Retorna o status de autenticação em 2 fatores (MFA/TOTP) do usuário autenticado
    
    Requer autenticação (JWT token no header)
    
    Response:
        {
            "status": "success",
            "has_mfa": true,  # true se o usuário tem MFA TOTP ativado, false caso contrário
            "mfa_type": "totp"  # tipo de MFA ativado
        }
    """
    try:
        # Obtém o ID do usuário autenticado do contexto Flask
        user_id = g.auth_user_id
        
        # Chama serviço para obter status de MFA
        mfa_data = get_mfa_status(user_id)
        
        if not mfa_data:
            return jsonify({
                "status": "error",
                "message": "Não foi possível verificar o status de MFA"
            }), 500

        has_mfa = mfa_data.get('has_mfa', False)
        sync_mfa_notification(user_id, has_mfa)
        
        return jsonify({
            "status": "success",
            "has_mfa": has_mfa,
            "mfa_type": mfa_data.get('mfa_type', None)
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erro ao verificar status de MFA: {str(e)}"
        }), 500
