"""
Serviço para gerenciamento de grupos.
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from config.supabase_config import get_supabase_admin_client
from services.notification_service import create_notification

VALID_VISIBILITY = {'publico', 'restrito', 'privado'}
VALID_PERMISSIONS = {'todos', 'lideres', 'ninguem'}
PERMISSION_LEVELS = {'ninguem': 0, 'lideres': 1, 'todos': 2}
ACTIVE_MEMBER_STATUSES = ('active', 'pending_reconsent', 'pending_approval', 'invited')


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _format_display_name(user: Optional[Dict[str, Any]]) -> str:
    if not user:
        return 'Usuário'

    name = (user.get('name') or '').strip()
    last_name = (user.get('last_name') or '').strip()
    full_name = f'{name} {last_name}'.strip()
    return full_name or user.get('email') or 'Usuário'


def _member_roles(member: Dict[str, Any]) -> List[str]:
    roles = []
    if member.get('is_founder'):
        roles.append('Fundador')
    if member.get('is_leader'):
        roles.append('Líder')
    return roles


def _serialize_member(member: Dict[str, Any]) -> Dict[str, Any]:
    user = member.get('users') or {}
    if isinstance(user, list):
        user = user[0] if user else {}

    return {
        'id': member.get('id'),
        'user_id': member.get('user_id'),
        'name': _format_display_name(user),
        'email': user.get('email'),
        'is_founder': bool(member.get('is_founder')),
        'is_leader': bool(member.get('is_leader')),
        'status': member.get('status'),
        'roles': _member_roles(member),
    }


def _serialize_membership(member: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not member:
        return None

    return {
        'is_founder': bool(member.get('is_founder')),
        'is_leader': bool(member.get('is_leader')),
        'status': member.get('status'),
    }


def _serialize_group(
    group: Dict[str, Any],
    members_count: int,
    members: Optional[List[Dict[str, Any]]] = None,
    current_membership: Optional[Dict[str, Any]] = None,
    current_join_request: Optional[Dict[str, Any]] = None,
    pending_join_requests: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    payload = {
        'id': group.get('id'),
        'name': group.get('name'),
        'description': group.get('description') or '',
        'visibility': group.get('visibility'),
        'maxMembers': group.get('max_members'),
        'membersCount': members_count,
        'permissions': {
            'view': group.get('view_permission'),
            'manage': group.get('manage_permission'),
        },
        'founderId': group.get('founder_id'),
        'createdAt': group.get('created_at'),
        'updatedAt': group.get('updated_at'),
    }

    if members is not None:
        payload['members'] = members

    if current_membership is not None:
        payload['currentUserMembership'] = current_membership

    if current_join_request is not None:
        payload['currentUserJoinRequest'] = current_join_request

    if pending_join_requests is not None:
        payload['pendingJoinRequests'] = pending_join_requests

    return payload


def _validate_group_payload(payload: Dict[str, Any], *, require_name: bool = False) -> Tuple[bool, str]:
    if require_name:
        name = (payload.get('name') or '').strip()
        if not name:
            return False, 'Nome do grupo é obrigatório'

    visibility = payload.get('visibility')
    if visibility is not None and visibility not in VALID_VISIBILITY:
        return False, 'Visibilidade inválida'

    view_permission = payload.get('view_permission', payload.get('view'))
    manage_permission = payload.get('manage_permission', payload.get('manage'))

    if view_permission is not None and view_permission not in VALID_PERMISSIONS:
        return False, 'Permissão de visualização inválida'

    if manage_permission is not None and manage_permission not in VALID_PERMISSIONS:
        return False, 'Permissão de gerenciamento inválida'

    if view_permission is not None and manage_permission is not None:
        if PERMISSION_LEVELS[manage_permission] > PERMISSION_LEVELS[view_permission]:
            return False, 'Gerenciar não pode ser mais permissivo que visualizar'

    max_members = payload.get('max_members', payload.get('maxMembers'))
    if max_members is not None:
        try:
            max_members_int = int(max_members)
        except (TypeError, ValueError):
            return False, 'Número máximo de membros inválido'

        if max_members_int <= 0:
            return False, 'Número máximo de membros deve ser maior que zero'

    return True, ''


def _count_active_members(supabase, group_id: str) -> int:
    response = supabase.table('group_members')\
        .select('id', count='exact')\
        .eq('group_id', group_id)\
        .eq('status', 'active')\
        .execute()

    return response.count or 0


def _get_user_membership(supabase, group_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    response = supabase.table('group_members')\
        .select('id, user_id, is_founder, is_leader, status')\
        .eq('group_id', group_id)\
        .eq('user_id', user_id)\
        .limit(1)\
        .execute()

    if response.data:
        return response.data[0]

    return None


def _is_leader_or_founder(membership: Optional[Dict[str, Any]]) -> bool:
    if not membership:
        return False

    if membership.get('status') != 'active':
        return False

    return bool(membership.get('is_founder') or membership.get('is_leader'))


def _fetch_group_members(supabase, group_id: str) -> List[Dict[str, Any]]:
    response = supabase.table('group_members')\
        .select('id, user_id, is_founder, is_leader, status, users(id, name, last_name, email)')\
        .eq('group_id', group_id)\
        .in_('status', ['active', 'pending_reconsent', 'pending_approval', 'invited'])\
        .order('is_founder', desc=True)\
        .order('is_leader', desc=True)\
        .order('joined_at', desc=False)\
        .execute()

    return [_serialize_member(member) for member in (response.data or [])]


def _normalize_create_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    max_members = payload.get('max_members', payload.get('maxMembers'))

    return {
        'name': (payload.get('name') or '').strip(),
        'description': (payload.get('description') or '').strip(),
        'visibility': payload.get('visibility', 'publico'),
        'view_permission': payload.get('view_permission', payload.get('view', 'ninguem')),
        'manage_permission': payload.get('manage_permission', payload.get('manage', 'ninguem')),
        'max_members': int(max_members) if max_members not in (None, '') else None,
    }


def _normalize_update_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    update_data: Dict[str, Any] = {}

    if 'name' in payload:
        update_data['name'] = (payload.get('name') or '').strip()

    if 'description' in payload:
        update_data['description'] = (payload.get('description') or '').strip()

    if 'visibility' in payload:
        update_data['visibility'] = payload.get('visibility')

    if 'view_permission' in payload or 'view' in payload:
        update_data['view_permission'] = payload.get('view_permission', payload.get('view'))

    if 'manage_permission' in payload or 'manage' in payload:
        update_data['manage_permission'] = payload.get('manage_permission', payload.get('manage'))

    if 'max_members' in payload or 'maxMembers' in payload:
        max_members = payload.get('max_members', payload.get('maxMembers'))
        update_data['max_members'] = int(max_members) if max_members not in (None, '') else None

    if update_data:
        update_data['updated_at'] = _now_iso()

    return update_data


def create_group(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        normalized = _normalize_create_payload(payload)
        is_valid, message = _validate_group_payload(normalized, require_name=True)

        if not is_valid:
            return {'success': False, 'message': message}

        supabase = get_supabase_admin_client()
        invite_code = secrets.token_urlsafe(16)

        group_response = supabase.table('groups').insert({
            'name': normalized['name'],
            'description': normalized['description'],
            'visibility': normalized['visibility'],
            'view_permission': normalized['view_permission'],
            'manage_permission': normalized['manage_permission'],
            'max_members': normalized['max_members'],
            'founder_id': user_id,
            'invite_code': invite_code,
        }).execute()

        if not group_response.data:
            return {'success': False, 'message': 'Erro ao criar grupo'}

        group = group_response.data[0]
        group_id = group['id']

        member_response = supabase.table('group_members').insert({
            'group_id': group_id,
            'user_id': user_id,
            'is_founder': True,
            'is_leader': True,
            'status': 'active',
            'consented_view': normalized['view_permission'],
            'consented_manage': normalized['manage_permission'],
            'consented_at': _now_iso(),
        }).execute()

        if not member_response.data:
            supabase.table('groups').delete().eq('id', group_id).execute()
            return {'success': False, 'message': 'Erro ao registrar fundador do grupo'}

        members = _fetch_group_members(supabase, group_id)
        members_count = _count_active_members(supabase, group_id)
        membership = _serialize_membership(member_response.data[0])

        return {
            'success': True,
            'message': 'Grupo criado com sucesso',
            'data': _serialize_group(group, members_count, members, membership),
        }
    except Exception as error:
        print(f'Erro ao criar grupo: {error}')
        return {'success': False, 'message': 'Erro ao criar grupo'}


def list_my_groups(user_id: str) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        memberships_response = supabase.table('group_members')\
            .select('group_id, is_founder, is_leader, status')\
            .eq('user_id', user_id)\
            .in_('status', list(ACTIVE_MEMBER_STATUSES))\
            .execute()

        memberships = memberships_response.data or []
        if not memberships:
            return {'success': True, 'data': []}

        membership_by_group = {item['group_id']: item for item in memberships}
        group_ids = list(membership_by_group.keys())

        groups_response = supabase.table('groups')\
            .select('*')\
            .in_('id', group_ids)\
            .order('created_at', desc=True)\
            .execute()

        groups = []
        for group in (groups_response.data or []):
            group_id = group['id']
            members_count = _count_active_members(supabase, group_id)
            membership = _serialize_membership(membership_by_group.get(group_id))
            groups.append(_serialize_group(group, members_count, current_membership=membership))

        return {'success': True, 'data': groups}
    except Exception as error:
        print(f'Erro ao listar grupos do usuário: {error}')
        return {'success': False, 'message': 'Erro ao listar grupos'}


def list_public_groups(user_id: str) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        memberships_response = supabase.table('group_members')\
            .select('group_id')\
            .eq('user_id', user_id)\
            .in_('status', list(ACTIVE_MEMBER_STATUSES))\
            .execute()

        excluded_group_ids = {item['group_id'] for item in (memberships_response.data or [])}

        groups_response = supabase.table('groups')\
            .select('*')\
            .in_('visibility', ['publico', 'restrito'])\
            .order('created_at', desc=True)\
            .execute()

        groups = []
        for group in (groups_response.data or []):
            if group['id'] in excluded_group_ids:
                continue

            members_count = _count_active_members(supabase, group['id'])
            groups.append(_serialize_group(group, members_count))

        return {'success': True, 'data': groups}
    except Exception as error:
        print(f'Erro ao listar grupos públicos: {error}')
        return {'success': False, 'message': 'Erro ao listar grupos públicos'}


def get_group(group_id: str, user_id: str) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]
        membership = _get_user_membership(supabase, group_id, user_id)
        join_request = _get_user_join_request(supabase, group_id, user_id)

        is_member = membership is not None
        has_pending_request = join_request is not None
        is_discoverable = group.get('visibility') in ('publico', 'restrito')

        if not is_member and not has_pending_request and not is_discoverable:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        return {
            'success': True,
            'data': _build_group_detail(supabase, group, user_id),
        }
    except Exception as error:
        print(f'Erro ao buscar grupo: {error}')
        return {'success': False, 'message': 'Erro ao buscar grupo'}


def update_group(group_id: str, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        update_data = _normalize_update_payload(payload)

        if not update_data:
            return {'success': False, 'message': 'Nenhum dado para atualizar'}

        is_valid, message = _validate_group_payload(update_data, require_name='name' in update_data)

        if not is_valid:
            return {'success': False, 'message': message}

        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]
        membership = _get_user_membership(supabase, group_id, user_id)

        if not _is_leader_or_founder(membership):
            return {
                'success': False,
                'message': 'Sem permissão para editar este grupo',
                'status_code': 403,
            }

        merged_permissions = {
            'view_permission': update_data.get('view_permission', group.get('view_permission')),
            'manage_permission': update_data.get('manage_permission', group.get('manage_permission')),
        }

        is_valid, message = _validate_group_payload(merged_permissions)

        if not is_valid:
            return {'success': False, 'message': message}

        updated_response = supabase.table('groups')\
            .update(update_data)\
            .eq('id', group_id)\
            .execute()

        if not updated_response.data:
            return {'success': False, 'message': 'Erro ao atualizar grupo'}

        updated_group = updated_response.data[0]

        return {
            'success': True,
            'message': 'Grupo atualizado com sucesso',
            'data': _build_group_detail(supabase, updated_group, user_id),
        }
    except Exception as error:
        print(f'Erro ao atualizar grupo: {error}')
        return {'success': False, 'message': 'Erro ao atualizar grupo'}


def _is_founder(membership: Optional[Dict[str, Any]]) -> bool:
    if not membership or membership.get('status') != 'active':
        return False

    return bool(membership.get('is_founder'))


def _get_target_member(supabase, group_id: str, target_user_id: str) -> Optional[Dict[str, Any]]:
    response = supabase.table('group_members')\
        .select('id, user_id, is_founder, is_leader, status')\
        .eq('group_id', group_id)\
        .eq('user_id', target_user_id)\
        .limit(1)\
        .execute()

    if response.data:
        return response.data[0]

    return None


def _get_user_join_request(
    supabase,
    group_id: str,
    user_id: str,
    *,
    status: str = 'pending',
) -> Optional[Dict[str, Any]]:
    query = supabase.table('group_join_requests')\
        .select('id, user_id, status, consented_view, consented_manage, created_at')\
        .eq('group_id', group_id)\
        .eq('user_id', user_id)

    if status:
        query = query.eq('status', status)

    response = query.limit(1).execute()

    if response.data:
        return response.data[0]

    return None


def _serialize_join_request(row: Dict[str, Any]) -> Dict[str, Any]:
    user = row.get('users') or {}
    if isinstance(user, list):
        user = user[0] if user else {}

    return {
        'id': row.get('id'),
        'userId': row.get('user_id'),
        'status': row.get('status'),
        'name': _format_display_name(user),
        'email': user.get('email'),
        'consentedView': row.get('consented_view'),
        'consentedManage': row.get('consented_manage'),
        'createdAt': row.get('created_at'),
    }


def _fetch_pending_join_requests(supabase, group_id: str) -> List[Dict[str, Any]]:
    response = supabase.table('group_join_requests')\
        .select('id, user_id, status, consented_view, consented_manage, created_at, users(id, name, last_name, email)')\
        .eq('group_id', group_id)\
        .eq('status', 'pending')\
        .order('created_at', desc=False)\
        .execute()

    return [_serialize_join_request(row) for row in (response.data or [])]


def _fetch_group_leaders(supabase, group_id: str) -> List[str]:
    response = supabase.table('group_members')\
        .select('user_id')\
        .eq('group_id', group_id)\
        .eq('status', 'active')\
        .or_('is_founder.eq.true,is_leader.eq.true')\
        .execute()

    return [row['user_id'] for row in (response.data or [])]


def _fetch_user_profile(supabase, user_id: str) -> Dict[str, Any]:
    response = supabase.table('users')\
        .select('id, name, last_name, email')\
        .eq('id', user_id)\
        .limit(1)\
        .execute()

    if response.data:
        return response.data[0]

    return {}


def _group_requires_consent(group: Dict[str, Any]) -> bool:
    return not (
        group.get('view_permission') == 'ninguem'
        and group.get('manage_permission') == 'ninguem'
    )


def _is_group_at_capacity(supabase, group: Dict[str, Any]) -> bool:
    max_members = group.get('max_members')
    if not max_members:
        return False

    members_count = _count_active_members(supabase, group['id'])
    return members_count >= max_members


def _notify_group_leaders_join_pending(
    supabase,
    group: Dict[str, Any],
    requester_id: str,
    request_id: str,
) -> None:
    requester = _fetch_user_profile(supabase, requester_id)
    requester_name = _format_display_name(requester)
    group_name = group.get('name') or 'Grupo'

    for leader_id in _fetch_group_leaders(supabase, group['id']):
        if leader_id == requester_id:
            continue

        create_notification(
            user_id=leader_id,
            notification_type='group_join_pending',
            title='Nova solicitação de entrada',
            description=f'{requester_name} solicitou entrar no grupo {group_name}.',
            icon='person-plus',
            metadata={
                'group_id': group['id'],
                'request_id': request_id,
                'user_id': requester_id,
            },
        )


def _build_group_detail(supabase, group: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    group_id = group['id']
    membership = _get_user_membership(supabase, group_id, user_id)
    members = _fetch_group_members(supabase, group_id)
    members_count = _count_active_members(supabase, group_id)
    current_membership = _serialize_membership(membership)

    join_request = _get_user_join_request(supabase, group_id, user_id)
    current_join_request = _serialize_join_request(join_request) if join_request else None

    pending_join_requests = None
    if _is_leader_or_founder(membership):
        pending = _fetch_pending_join_requests(supabase, group_id)
        pending_join_requests = pending

    return _serialize_group(
        group,
        members_count,
        members,
        current_membership,
        current_join_request=current_join_request,
        pending_join_requests=pending_join_requests,
    )


def _can_manage_target_member(
    actor_membership: Optional[Dict[str, Any]],
    target_member: Optional[Dict[str, Any]],
) -> Tuple[bool, str]:
    if not _is_leader_or_founder(actor_membership):
        return False, 'Sem permissão para gerenciar membros'

    if not target_member or target_member.get('status') != 'active':
        return False, 'Membro não encontrado'

    if target_member.get('is_founder'):
        return False, 'O fundador não pode ser removido ou alterado por outros membros'

    return True, ''


def promote_member(group_id: str, actor_id: str, target_user_id: str) -> Dict[str, Any]:
    try:
        if actor_id == target_user_id:
            return {'success': False, 'message': 'Você não pode promover a si mesmo'}

        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        actor_membership = _get_user_membership(supabase, group_id, actor_id)

        if not _is_founder(actor_membership):
            return {
                'success': False,
                'message': 'Apenas o fundador pode promover membros a líder',
                'status_code': 403,
            }

        target_member = _get_target_member(supabase, group_id, target_user_id)
        can_manage, message = _can_manage_target_member(actor_membership, target_member)

        if not can_manage:
            return {'success': False, 'message': message, 'status_code': 403}

        if target_member.get('is_leader'):
            return {'success': False, 'message': 'Este membro já é líder'}

        updated_response = supabase.table('group_members')\
            .update({'is_leader': True})\
            .eq('id', target_member['id'])\
            .execute()

        if not updated_response.data:
            return {'success': False, 'message': 'Erro ao promover membro'}

        group = group_response.data[0]

        return {
            'success': True,
            'message': 'Membro promovido a líder',
            'data': _build_group_detail(supabase, group, actor_id),
        }
    except Exception as error:
        print(f'Erro ao promover membro: {error}')
        return {'success': False, 'message': 'Erro ao promover membro'}


def demote_member(group_id: str, actor_id: str, target_user_id: str) -> Dict[str, Any]:
    try:
        if actor_id == target_user_id:
            return {'success': False, 'message': 'Você não pode rebaixar a si mesmo'}

        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        actor_membership = _get_user_membership(supabase, group_id, actor_id)

        if not _is_founder(actor_membership):
            return {
                'success': False,
                'message': 'Apenas o fundador pode rebaixar líderes',
                'status_code': 403,
            }

        target_member = _get_target_member(supabase, group_id, target_user_id)
        can_manage, message = _can_manage_target_member(actor_membership, target_member)

        if not can_manage:
            return {'success': False, 'message': message, 'status_code': 403}

        if not target_member.get('is_leader'):
            return {'success': False, 'message': 'Este membro não é líder'}

        updated_response = supabase.table('group_members')\
            .update({'is_leader': False})\
            .eq('id', target_member['id'])\
            .execute()

        if not updated_response.data:
            return {'success': False, 'message': 'Erro ao rebaixar membro'}

        group = group_response.data[0]

        return {
            'success': True,
            'message': 'Líder rebaixado a membro',
            'data': _build_group_detail(supabase, group, actor_id),
        }
    except Exception as error:
        print(f'Erro ao rebaixar membro: {error}')
        return {'success': False, 'message': 'Erro ao rebaixar membro'}


def remove_member(group_id: str, actor_id: str, target_user_id: str) -> Dict[str, Any]:
    try:
        if actor_id == target_user_id:
            return {'success': False, 'message': 'Use a opção de sair do grupo para remover a si mesmo'}

        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        actor_membership = _get_user_membership(supabase, group_id, actor_id)
        target_member = _get_target_member(supabase, group_id, target_user_id)

        can_manage, message = _can_manage_target_member(actor_membership, target_member)

        if not can_manage:
            return {'success': False, 'message': message, 'status_code': 403}

        if target_member.get('is_leader') and not _is_founder(actor_membership):
            return {
                'success': False,
                'message': 'Apenas o fundador pode expulsar líderes',
                'status_code': 403,
            }

        supabase.table('group_members')\
            .delete()\
            .eq('id', target_member['id'])\
            .execute()

        group = group_response.data[0]

        return {
            'success': True,
            'message': 'Membro expulso do grupo',
            'data': _build_group_detail(supabase, group, actor_id),
        }
    except Exception as error:
        print(f'Erro ao expulsar membro: {error}')
        return {'success': False, 'message': 'Erro ao expulsar membro'}


def transfer_founder(group_id: str, actor_id: str, new_founder_user_id: str) -> Dict[str, Any]:
    try:
        if actor_id == new_founder_user_id:
            return {'success': False, 'message': 'Selecione outro membro para transferir a fundação'}

        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]
        actor_membership = _get_user_membership(supabase, group_id, actor_id)

        if not _is_founder(actor_membership):
            return {
                'success': False,
                'message': 'Apenas o fundador pode transferir a fundação',
                'status_code': 403,
            }

        new_founder_member = _get_target_member(supabase, group_id, new_founder_user_id)

        if not new_founder_member or new_founder_member.get('status') != 'active':
            return {'success': False, 'message': 'Membro alvo não encontrado ou inativo'}

        supabase.table('group_members')\
            .update({'is_founder': False, 'is_leader': False})\
            .eq('id', actor_membership['id'])\
            .execute()

        supabase.table('group_members')\
            .update({'is_founder': True, 'is_leader': True})\
            .eq('id', new_founder_member['id'])\
            .execute()

        updated_group_response = supabase.table('groups')\
            .update({
                'founder_id': new_founder_user_id,
                'updated_at': _now_iso(),
            })\
            .eq('id', group_id)\
            .execute()

        if not updated_group_response.data:
            return {'success': False, 'message': 'Erro ao transferir fundação'}

        updated_group = updated_group_response.data[0]

        return {
            'success': True,
            'message': 'Fundação transferida com sucesso',
            'data': _build_group_detail(supabase, updated_group, actor_id),
        }
    except Exception as error:
        print(f'Erro ao transferir fundação: {error}')
        return {'success': False, 'message': 'Erro ao transferir fundação'}


def delete_group(group_id: str, user_id: str) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]
        membership = _get_user_membership(supabase, group_id, user_id)

        if not _is_founder(membership) and group.get('founder_id') != user_id:
            return {
                'success': False,
                'message': 'Apenas o fundador pode excluir o grupo',
                'status_code': 403,
            }

        supabase.table('groups')\
            .delete()\
            .eq('id', group_id)\
            .execute()

        return {
            'success': True,
            'message': 'Grupo excluído com sucesso',
        }
    except Exception as error:
        print(f'Erro ao excluir grupo: {error}')
        return {'success': False, 'message': 'Erro ao excluir grupo'}


def join_group(group_id: str, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]

        if group.get('visibility') == 'privado':
            return {
                'success': False,
                'message': 'Este grupo é privado. Entrada apenas por convite.',
                'status_code': 403,
            }

        existing_membership = _get_user_membership(supabase, group_id, user_id)
        if existing_membership and existing_membership.get('status') == 'active':
            return {'success': False, 'message': 'Você já é membro deste grupo'}

        if existing_membership and existing_membership.get('status') in ('pending_approval', 'invited'):
            return {'success': False, 'message': 'Sua entrada neste grupo já está pendente'}

        existing_request = _get_user_join_request(supabase, group_id, user_id)
        if existing_request:
            return {'success': False, 'message': 'Sua solicitação de entrada já está pendente'}

        if _is_group_at_capacity(supabase, group):
            return {'success': False, 'message': 'Este grupo atingiu o limite de membros'}

        requires_consent = _group_requires_consent(group)
        consented = bool(payload.get('consented'))

        if requires_consent and not consented:
            return {
                'success': False,
                'message': 'É necessário consentir com as permissões do grupo para entrar',
            }

        consented_view = group.get('view_permission') if requires_consent else 'ninguem'
        consented_manage = group.get('manage_permission') if requires_consent else 'ninguem'

        if group.get('visibility') == 'publico':
            member_response = supabase.table('group_members').insert({
                'group_id': group_id,
                'user_id': user_id,
                'is_founder': False,
                'is_leader': False,
                'status': 'active',
                'consented_view': consented_view,
                'consented_manage': consented_manage,
                'consented_at': _now_iso() if requires_consent else None,
            }).execute()

            if not member_response.data:
                return {'success': False, 'message': 'Erro ao entrar no grupo'}

            return {
                'success': True,
                'message': 'Você entrou no grupo com sucesso',
                'data': _build_group_detail(supabase, group, user_id),
            }

        request_response = supabase.table('group_join_requests').insert({
            'group_id': group_id,
            'user_id': user_id,
            'status': 'pending',
            'consented_view': consented_view,
            'consented_manage': consented_manage,
        }).execute()

        if not request_response.data:
            return {'success': False, 'message': 'Erro ao solicitar entrada no grupo'}

        request = request_response.data[0]
        _notify_group_leaders_join_pending(supabase, group, user_id, request['id'])

        return {
            'success': True,
            'message': 'Solicitação enviada. Aguarde aprovação de um líder.',
            'data': _build_group_detail(supabase, group, user_id),
        }
    except Exception as error:
        print(f'Erro ao entrar no grupo: {error}')
        return {'success': False, 'message': 'Erro ao entrar no grupo'}


def leave_group(group_id: str, user_id: str) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        membership = _get_user_membership(supabase, group_id, user_id)

        if not membership or membership.get('status') != 'active':
            return {'success': False, 'message': 'Você não é membro ativo deste grupo'}

        if membership.get('is_founder') or group_response.data[0].get('founder_id') == user_id:
            return {
                'success': False,
                'message': 'O fundador não pode sair do grupo. Transfira a fundação ou exclua o grupo.',
            }

        supabase.table('group_members')\
            .delete()\
            .eq('id', membership['id'])\
            .execute()

        return {
            'success': True,
            'message': 'Você saiu do grupo',
        }
    except Exception as error:
        print(f'Erro ao sair do grupo: {error}')
        return {'success': False, 'message': 'Erro ao sair do grupo'}


def approve_join_request(group_id: str, actor_id: str, request_id: str) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]
        actor_membership = _get_user_membership(supabase, group_id, actor_id)

        if not _is_leader_or_founder(actor_membership):
            return {
                'success': False,
                'message': 'Sem permissão para aprovar solicitações',
                'status_code': 403,
            }

        request_response = supabase.table('group_join_requests')\
            .select('id, user_id, status, consented_view, consented_manage')\
            .eq('id', request_id)\
            .eq('group_id', group_id)\
            .limit(1)\
            .execute()

        if not request_response.data:
            return {'success': False, 'message': 'Solicitação não encontrada', 'status_code': 404}

        join_request = request_response.data[0]

        if join_request.get('status') != 'pending':
            return {'success': False, 'message': 'Esta solicitação já foi processada'}

        if _is_group_at_capacity(supabase, group):
            return {'success': False, 'message': 'Este grupo atingiu o limite de membros'}

        requester_id = join_request['user_id']
        existing_membership = _get_user_membership(supabase, group_id, requester_id)

        if existing_membership and existing_membership.get('status') == 'active':
            supabase.table('group_join_requests')\
                .update({'status': 'approved'})\
                .eq('id', request_id)\
                .execute()
            return {'success': False, 'message': 'Este usuário já é membro do grupo'}

        if existing_membership:
            supabase.table('group_members')\
                .update({
                    'status': 'active',
                    'consented_view': join_request.get('consented_view'),
                    'consented_manage': join_request.get('consented_manage'),
                    'consented_at': _now_iso(),
                    'is_founder': False,
                    'is_leader': False,
                })\
                .eq('id', existing_membership['id'])\
                .execute()
        else:
            supabase.table('group_members').insert({
                'group_id': group_id,
                'user_id': requester_id,
                'is_founder': False,
                'is_leader': False,
                'status': 'active',
                'consented_view': join_request.get('consented_view'),
                'consented_manage': join_request.get('consented_manage'),
                'consented_at': _now_iso(),
            }).execute()

        supabase.table('group_join_requests')\
            .update({'status': 'approved'})\
            .eq('id', request_id)\
            .execute()

        requester = _fetch_user_profile(supabase, requester_id)
        create_notification(
            user_id=requester_id,
            notification_type='group_join_approved',
            title='Entrada aprovada',
            description=f'Sua entrada no grupo {group.get("name")} foi aprovada.',
            icon='check-circle',
            metadata={
                'group_id': group_id,
                'request_id': request_id,
            },
        )

        return {
            'success': True,
            'message': f'Entrada de {_format_display_name(requester)} aprovada',
            'data': _build_group_detail(supabase, group, actor_id),
        }
    except Exception as error:
        print(f'Erro ao aprovar solicitação: {error}')
        return {'success': False, 'message': 'Erro ao aprovar solicitação'}


def reject_join_request(group_id: str, actor_id: str, request_id: str) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]
        actor_membership = _get_user_membership(supabase, group_id, actor_id)

        if not _is_leader_or_founder(actor_membership):
            return {
                'success': False,
                'message': 'Sem permissão para rejeitar solicitações',
                'status_code': 403,
            }

        request_response = supabase.table('group_join_requests')\
            .select('id, user_id, status')\
            .eq('id', request_id)\
            .eq('group_id', group_id)\
            .limit(1)\
            .execute()

        if not request_response.data:
            return {'success': False, 'message': 'Solicitação não encontrada', 'status_code': 404}

        join_request = request_response.data[0]

        if join_request.get('status') != 'pending':
            return {'success': False, 'message': 'Esta solicitação já foi processada'}

        supabase.table('group_join_requests')\
            .update({'status': 'rejected'})\
            .eq('id', request_id)\
            .execute()

        return {
            'success': True,
            'message': 'Solicitação rejeitada',
            'data': _build_group_detail(supabase, group, actor_id),
        }
    except Exception as error:
        print(f'Erro ao rejeitar solicitação: {error}')
        return {'success': False, 'message': 'Erro ao rejeitar solicitação'}


INVITE_EXPIRY_DAYS = 30


def _invite_expires_at() -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=INVITE_EXPIRY_DAYS)
    return expires.isoformat()


def _is_invite_expired(expires_at: Optional[str]) -> bool:
    if not expires_at:
        return False

    try:
        expires = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        return expires < datetime.now(timezone.utc)
    except (TypeError, ValueError):
        return False


def _serialize_invite_preview(
    group: Dict[str, Any],
    members_count: int,
    invite_type: str,
) -> Dict[str, Any]:
    return {
        'inviteType': invite_type,
        'requiresConsent': _group_requires_consent(group),
        'group': {
            'id': group.get('id'),
            'name': group.get('name'),
            'description': group.get('description') or '',
            'visibility': group.get('visibility'),
            'maxMembers': group.get('max_members'),
            'membersCount': members_count,
            'permissions': {
                'view': group.get('view_permission'),
                'manage': group.get('manage_permission'),
            },
        },
    }


def _find_invite_context(supabase, token: str) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], Optional[str]]:
    invite_response = supabase.table('group_invites')\
        .select('id, group_id, invited_by, invited_user_id, token, status, expires_at')\
        .eq('token', token)\
        .eq('status', 'pending')\
        .limit(1)\
        .execute()

    if invite_response.data:
        invite = invite_response.data[0]
        if _is_invite_expired(invite.get('expires_at')):
            return None, None, None

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', invite['group_id'])\
            .limit(1)\
            .execute()

        if group_response.data:
            invite_type = 'direct' if invite.get('invited_user_id') else 'link'
            return group_response.data[0], invite, invite_type

    group_response = supabase.table('groups')\
        .select('*')\
        .eq('invite_code', token)\
        .limit(1)\
        .execute()

    if group_response.data:
        return group_response.data[0], None, 'link'

    return None, None, None


def _activate_group_member(
    supabase,
    group: Dict[str, Any],
    user_id: str,
    consented_view: str,
    consented_manage: str,
    requires_consent: bool,
) -> Tuple[bool, str]:
    existing_membership = _get_user_membership(supabase, group['id'], user_id)

    if existing_membership and existing_membership.get('status') == 'active':
        return False, 'Você já é membro deste grupo'

    member_payload = {
        'status': 'active',
        'is_founder': False,
        'is_leader': False,
        'consented_view': consented_view,
        'consented_manage': consented_manage,
        'consented_at': _now_iso() if requires_consent else None,
    }

    if existing_membership:
        updated = supabase.table('group_members')\
            .update(member_payload)\
            .eq('id', existing_membership['id'])\
            .execute()

        if not updated.data:
            return False, 'Erro ao ativar membro do grupo'
    else:
        inserted = supabase.table('group_members').insert({
            'group_id': group['id'],
            'user_id': user_id,
            **member_payload,
        }).execute()

        if not inserted.data:
            return False, 'Erro ao entrar no grupo'

    return True, ''


def create_direct_invite(group_id: str, actor_id: str, target_user_id: str) -> Dict[str, Any]:
    try:
        if actor_id == target_user_id:
            return {'success': False, 'message': 'Você não pode convidar a si mesmo'}

        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]
        actor_membership = _get_user_membership(supabase, group_id, actor_id)

        if not _is_leader_or_founder(actor_membership):
            return {
                'success': False,
                'message': 'Sem permissão para convidar membros',
                'status_code': 403,
            }

        target_membership = _get_user_membership(supabase, group_id, target_user_id)
        if target_membership and target_membership.get('status') == 'active':
            return {'success': False, 'message': 'Este usuário já é membro do grupo'}

        existing_invite = supabase.table('group_invites')\
            .select('id')\
            .eq('group_id', group_id)\
            .eq('invited_user_id', target_user_id)\
            .eq('status', 'pending')\
            .limit(1)\
            .execute()

        if existing_invite.data:
            return {'success': False, 'message': 'Este usuário já possui um convite pendente'}

        token = secrets.token_urlsafe(16)
        invite_response = supabase.table('group_invites').insert({
            'group_id': group_id,
            'invited_by': actor_id,
            'invited_user_id': target_user_id,
            'token': token,
            'status': 'pending',
            'expires_at': _invite_expires_at(),
        }).execute()

        if not invite_response.data:
            return {'success': False, 'message': 'Erro ao criar convite'}

        invite = invite_response.data[0]
        target_user = _fetch_user_profile(supabase, target_user_id)
        inviter = _fetch_user_profile(supabase, actor_id)

        create_notification(
            user_id=target_user_id,
            notification_type='group_invite_received',
            title='Convite para grupo',
            description=(
                f'{_format_display_name(inviter)} convidou você para o grupo {group.get("name")}.'
            ),
            icon='envelope',
            metadata={
                'group_id': group_id,
                'invite_id': invite['id'],
                'invite_token': token,
            },
        )

        return {
            'success': True,
            'message': f'Convite enviado para {_format_display_name(target_user)}',
            'data': {
                'inviteId': invite['id'],
                'token': token,
            },
        }
    except Exception as error:
        print(f'Erro ao criar convite direto: {error}')
        return {'success': False, 'message': 'Erro ao enviar convite'}


def get_invite_link(group_id: str, actor_id: str, regenerate: bool = False) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()

        group_response = supabase.table('groups')\
            .select('*')\
            .eq('id', group_id)\
            .limit(1)\
            .execute()

        if not group_response.data:
            return {'success': False, 'message': 'Grupo não encontrado', 'status_code': 404}

        group = group_response.data[0]
        actor_membership = _get_user_membership(supabase, group_id, actor_id)

        if not _is_leader_or_founder(actor_membership):
            return {
                'success': False,
                'message': 'Sem permissão para gerar link de convite',
                'status_code': 403,
            }

        if group.get('visibility') != 'privado':
            return {
                'success': False,
                'message': 'Link de convite disponível apenas para grupos privados',
            }

        invite_code = group.get('invite_code')

        if regenerate or not invite_code:
            invite_code = secrets.token_urlsafe(16)
            updated = supabase.table('groups')\
                .update({
                    'invite_code': invite_code,
                    'updated_at': _now_iso(),
                })\
                .eq('id', group_id)\
                .execute()

            if not updated.data:
                return {'success': False, 'message': 'Erro ao gerar link de convite'}

        return {
            'success': True,
            'data': {
                'token': invite_code,
            },
        }
    except Exception as error:
        print(f'Erro ao obter link de convite: {error}')
        return {'success': False, 'message': 'Erro ao gerar link de convite'}


def get_invite_preview(token: str, user_id: str) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()
        group, invite, invite_type = _find_invite_context(supabase, token)

        if not group or not invite_type:
            return {'success': False, 'message': 'Convite inválido ou expirado', 'status_code': 404}

        if invite_type == 'direct' and invite:
            if invite.get('invited_user_id') != user_id:
                return {
                    'success': False,
                    'message': 'Este convite não é destinado a você',
                    'status_code': 403,
                }

        membership = _get_user_membership(supabase, group['id'], user_id)
        if membership and membership.get('status') == 'active':
            return {'success': False, 'message': 'Você já é membro deste grupo'}

        members_count = _count_active_members(supabase, group['id'])

        return {
            'success': True,
            'data': _serialize_invite_preview(group, members_count, invite_type),
        }
    except Exception as error:
        print(f'Erro ao buscar preview do convite: {error}')
        return {'success': False, 'message': 'Erro ao carregar convite'}


def accept_invite(token: str, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        supabase = get_supabase_admin_client()
        group, invite, invite_type = _find_invite_context(supabase, token)

        if not group or not invite_type:
            return {'success': False, 'message': 'Convite inválido ou expirado', 'status_code': 404}

        if invite_type == 'direct' and invite:
            if invite.get('invited_user_id') != user_id:
                return {
                    'success': False,
                    'message': 'Este convite não é destinado a você',
                    'status_code': 403,
                }

        if _is_group_at_capacity(supabase, group):
            return {'success': False, 'message': 'Este grupo atingiu o limite de membros'}

        requires_consent = _group_requires_consent(group)
        consented = bool(payload.get('consented'))

        if requires_consent and not consented:
            return {
                'success': False,
                'message': 'É necessário consentir com as permissões do grupo para entrar',
            }

        consented_view = group.get('view_permission') if requires_consent else 'ninguem'
        consented_manage = group.get('manage_permission') if requires_consent else 'ninguem'

        activated, message = _activate_group_member(
            supabase,
            group,
            user_id,
            consented_view,
            consented_manage,
            requires_consent,
        )

        if not activated:
            return {'success': False, 'message': message}

        if invite:
            supabase.table('group_invites')\
                .update({'status': 'accepted'})\
                .eq('id', invite['id'])\
                .execute()

        return {
            'success': True,
            'message': 'Você entrou no grupo com sucesso',
            'data': _build_group_detail(supabase, group, user_id),
        }
    except Exception as error:
        print(f'Erro ao aceitar convite: {error}')
        return {'success': False, 'message': 'Erro ao aceitar convite'}
