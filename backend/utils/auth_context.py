"""
Utilitarios de contexto de autenticacao para rotas protegidas.

Permite validar o JWT do Supabase quando o frontend enviar Authorization: Bearer
e, durante a migracao, aceitar user_id legado vindo em query string ou body.
"""
from functools import wraps
from typing import Any, Dict, Optional, Tuple

from flask import g, jsonify, request

from config.supabase_config import get_supabase_admin_client


def _extract_bearer_token() -> Optional[str]:
    auth_header = request.headers.get('Authorization', '')
    if not auth_header:
        return None

    if not auth_header.lower().startswith('bearer '):
        return None

    token = auth_header.split(' ', 1)[1].strip()
    return token or None


def _extract_legacy_user_id() -> Optional[str]:
    legacy_user_id = request.args.get('user_id')
    if legacy_user_id:
        return legacy_user_id

    payload = request.get_json(silent=True) or {}
    if isinstance(payload, dict):
        legacy_user_id = payload.get('user_id')
        if legacy_user_id:
            return legacy_user_id

    return None


def _extract_user_from_response(response: Any) -> Optional[Dict[str, Any]]:
    if not response:
        return None

    user = getattr(response, 'user', None)
    if user is None and isinstance(response, dict):
        user = response.get('user')

    if user is None:
        data = getattr(response, 'data', None)
        if isinstance(data, dict):
            user = data.get('user')

    if user is None:
        return None

    if isinstance(user, dict):
        return user

    return {
        'id': getattr(user, 'id', None),
        'email': getattr(user, 'email', None),
    }


def resolve_authenticated_user(
    requested_user_id: Optional[str] = None,
    allow_legacy: bool = True
) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[Any, int]]]:
    """
    Resolve o usuario da requisicao.

    Prioridade:
    1. JWT do Supabase no header Authorization
    2. user_id legado em query/body, se allow_legacy=True
    """
    token = _extract_bearer_token()
    legacy_user_id = _extract_legacy_user_id()

    if token:
        try:
            supabase_admin = get_supabase_admin_client()
            auth_response = supabase_admin.auth.get_user(token)
            user = _extract_user_from_response(auth_response)

            if not user or not user.get('id'):
                return None, (jsonify({
                    'status': 'error',
                    'message': 'Token de autenticacao invalido'
                }), 401)

            authenticated_user_id = user['id']

            if requested_user_id and requested_user_id != authenticated_user_id:
                return None, (jsonify({
                    'status': 'error',
                    'message': 'Usuario autenticado nao corresponde ao recurso solicitado'
                }), 403)

            if legacy_user_id and legacy_user_id != authenticated_user_id:
                return None, (jsonify({
                    'status': 'error',
                    'message': 'user_id nao corresponde ao usuario autenticado'
                }), 403)

            return {
                'user_id': authenticated_user_id,
                'email': user.get('email'),
                'source': 'supabase_jwt',
                'access_token': token,
            }, None
        except Exception:
            return None, (jsonify({
                'status': 'error',
                'message': 'Token de autenticacao invalido ou expirado'
            }), 401)

    if not allow_legacy:
        return None, (jsonify({
            'status': 'error',
            'message': 'Autenticacao requerida'
        }), 401)

    effective_user_id = requested_user_id or legacy_user_id
    if not effective_user_id:
        return None, (jsonify({
            'status': 'error',
            'message': 'user_id e obrigatorio'
        }), 400)

    return {
        'user_id': effective_user_id,
        'email': None,
        'source': 'legacy_user_id',
        'access_token': None,
    }, None


def require_authenticated_user(allow_legacy: bool = True):
    """Decorator que resolve o usuario e o disponibiliza em flask.g."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            requested_user_id = kwargs.get('user_id')
            context, error_response = resolve_authenticated_user(
                requested_user_id=requested_user_id,
                allow_legacy=allow_legacy
            )

            if error_response is not None:
                return error_response

            g.auth_context = context
            g.auth_user_id = context['user_id']
            g.auth_source = context['source']
            g.auth_access_token = context.get('access_token')
            return view_func(*args, **kwargs)

        return wrapper

    return decorator
