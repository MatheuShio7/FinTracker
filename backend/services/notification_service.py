"""
Serviço para gerenciamento de notificações persistentes.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from config.supabase_config import get_supabase_admin_client

MFA_NOTIFICATION_TYPE = 'mfa_disabled'


def _serialize_notification(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': row.get('id'),
        'type': row.get('type'),
        'title': row.get('title'),
        'description': row.get('description') or '',
        'icon': row.get('icon'),
        'metadata': row.get('metadata') or {},
        'read_at': row.get('read_at'),
        'created_at': row.get('created_at'),
    }


def list_notifications(user_id: str) -> Dict[str, Any]:
    """Lista notificações do usuário, mais recentes primeiro."""
    try:
        supabase = get_supabase_admin_client()
        response = supabase.table('notifications')\
            .select('id, type, title, description, icon, metadata, read_at, created_at')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .execute()

        data = [_serialize_notification(row) for row in (response.data or [])]
        return {'success': True, 'data': data}
    except Exception as error:
        print(f'Erro ao listar notificações: {error}')
        return {'success': False, 'message': 'Erro ao listar notificações'}


def mark_notification_read(notification_id: str, user_id: str) -> Dict[str, Any]:
    """Marca uma notificação como lida."""
    try:
        supabase = get_supabase_admin_client()
        now = datetime.now(timezone.utc).isoformat()

        response = supabase.table('notifications')\
            .update({'read_at': now})\
            .eq('id', notification_id)\
            .eq('user_id', user_id)\
            .execute()

        if not response.data:
            return {'success': False, 'message': 'Notificação não encontrada'}

        return {
            'success': True,
            'data': _serialize_notification(response.data[0]),
        }
    except Exception as error:
        print(f'Erro ao marcar notificação como lida: {error}')
        return {'success': False, 'message': 'Erro ao marcar notificação como lida'}


def mark_all_notifications_read(user_id: str) -> Dict[str, Any]:
    """Marca todas as notificações do usuário como lidas."""
    try:
        supabase = get_supabase_admin_client()
        now = datetime.now(timezone.utc).isoformat()

        supabase.table('notifications')\
            .update({'read_at': now})\
            .eq('user_id', user_id)\
            .is_('read_at', 'null')\
            .execute()

        return {'success': True}
    except Exception as error:
        print(f'Erro ao marcar todas as notificações como lidas: {error}')
        return {'success': False, 'message': 'Erro ao marcar notificações como lidas'}


def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    description: str = '',
    icon: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Cria uma notificação para o usuário."""
    try:
        supabase = get_supabase_admin_client()
        payload = {
            'user_id': user_id,
            'type': notification_type,
            'title': title,
            'description': description,
            'icon': icon,
            'metadata': metadata or {},
        }

        response = supabase.table('notifications')\
            .insert(payload)\
            .execute()

        if not response.data:
            return {'success': False, 'message': 'Erro ao criar notificação'}

        return {
            'success': True,
            'data': _serialize_notification(response.data[0]),
        }
    except Exception as error:
        print(f'Erro ao criar notificação: {error}')
        return {'success': False, 'message': 'Erro ao criar notificação'}


def delete_notifications_by_type(user_id: str, notification_type: str) -> Dict[str, Any]:
    """Remove notificações de um tipo específico do usuário."""
    try:
        supabase = get_supabase_admin_client()
        supabase.table('notifications')\
            .delete()\
            .eq('user_id', user_id)\
            .eq('type', notification_type)\
            .execute()

        return {'success': True}
    except Exception as error:
        print(f'Erro ao remover notificações: {error}')
        return {'success': False, 'message': 'Erro ao remover notificações'}


def sync_mfa_notification(user_id: str, has_mfa: bool) -> Dict[str, Any]:
    """
    Garante que a notificação de MFA reflita o status atual do usuário.
    Cria se MFA desativado; remove se MFA ativado.
    """
    if has_mfa:
        return delete_notifications_by_type(user_id, MFA_NOTIFICATION_TYPE)

    try:
        supabase = get_supabase_admin_client()
        existing = supabase.table('notifications')\
            .select('id')\
            .eq('user_id', user_id)\
            .eq('type', MFA_NOTIFICATION_TYPE)\
            .limit(1)\
            .execute()

        if existing.data:
            return {'success': True, 'data': existing.data[0]}

        return create_notification(
            user_id=user_id,
            notification_type=MFA_NOTIFICATION_TYPE,
            title='Autenticação em 2 Fatores Desativada',
            description='Ative a autenticação em 2 fatores para aumentar a segurança da sua conta.',
            icon='shield-exclamation',
            metadata={'source': 'mfa_status_check'},
        )
    except Exception as error:
        print(f'Erro ao sincronizar notificação de MFA: {error}')
        return {'success': False, 'message': 'Erro ao sincronizar notificação de MFA'}
