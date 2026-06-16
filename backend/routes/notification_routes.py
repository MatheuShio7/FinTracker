"""
Rotas para gerenciamento de notificações persistentes.
"""
from flask import Blueprint, jsonify, g

from services.notification_service import (
    list_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    delete_notification,
)
from utils.auth_context import require_authenticated_user


bp = Blueprint('notifications', __name__)


@bp.route('/api/notifications', methods=['GET'])
@require_authenticated_user(allow_legacy=False)
def get_notifications():
    """Lista notificações do usuário autenticado."""
    try:
        user_id = g.auth_user_id
        result = list_notifications(user_id)

        if result['success']:
            return jsonify({
                'status': 'success',
                'data': result.get('data', []),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao listar notificações'),
        }), 500
    except Exception as error:
        print(f'Erro na rota GET /api/notifications: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/notifications/<notification_id>/read', methods=['PATCH'])
@require_authenticated_user(allow_legacy=False)
def read_notification(notification_id):
    """Marca uma notificação como lida."""
    try:
        user_id = g.auth_user_id
        result = mark_notification_read(notification_id, user_id)

        if result['success']:
            return jsonify({
                'status': 'success',
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Notificação não encontrada'),
        }), 404
    except Exception as error:
        print(f'Erro na rota PATCH /api/notifications/{notification_id}/read: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/notifications/<notification_id>', methods=['DELETE'])
@require_authenticated_user(allow_legacy=False)
def remove_notification(notification_id):
    """Exclui uma notificação do usuário autenticado."""
    try:
        user_id = g.auth_user_id
        result = delete_notification(notification_id, user_id)

        if result['success']:
            return jsonify({'status': 'success'}), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Notificação não encontrada'),
        }), 404
    except Exception as error:
        print(f'Erro na rota DELETE /api/notifications/{notification_id}: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/notifications/read-all', methods=['PATCH'])
@require_authenticated_user(allow_legacy=False)
def read_all_notifications():
    """Marca todas as notificações do usuário como lidas."""
    try:
        user_id = g.auth_user_id
        result = mark_all_notifications_read(user_id)

        if result['success']:
            return jsonify({'status': 'success'}), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao marcar notificações como lidas'),
        }), 500
    except Exception as error:
        print(f'Erro na rota PATCH /api/notifications/read-all: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500
