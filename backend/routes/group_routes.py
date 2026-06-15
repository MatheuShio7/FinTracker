"""
Rotas para gerenciamento de grupos.
"""
from flask import Blueprint, jsonify, g, request

from services.group_service import (
    accept_invite,
    approve_join_request,
    create_direct_invite,
    create_group,
    delete_group,
    demote_member,
    get_group,
    get_invite_link,
    get_invite_preview,
    join_group,
    leave_group,
    list_my_groups,
    list_public_groups,
    promote_member,
    reject_join_request,
    remove_member,
    transfer_founder,
    update_group,
)
from utils.auth_context import require_authenticated_user


bp = Blueprint('groups', __name__)


@bp.route('/api/groups', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def create_group_route():
    """Cria um novo grupo."""
    try:
        payload = request.get_json(silent=True) or {}
        result = create_group(g.auth_user_id, payload)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 201

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao criar grupo'),
        }), 400
    except Exception as error:
        print(f'Erro na rota POST /api/groups: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/mine', methods=['GET'])
@require_authenticated_user(allow_legacy=False)
def list_my_groups_route():
    """Lista grupos em que o usuário participa."""
    try:
        result = list_my_groups(g.auth_user_id)

        if result['success']:
            return jsonify({
                'status': 'success',
                'data': result.get('data', []),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao listar grupos'),
        }), 500
    except Exception as error:
        print(f'Erro na rota GET /api/groups/mine: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/public', methods=['GET'])
@require_authenticated_user(allow_legacy=False)
def list_public_groups_route():
    """Lista grupos públicos disponíveis para descoberta."""
    try:
        result = list_public_groups(g.auth_user_id)

        if result['success']:
            return jsonify({
                'status': 'success',
                'data': result.get('data', []),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao listar grupos públicos'),
        }), 500
    except Exception as error:
        print(f'Erro na rota GET /api/groups/public: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>', methods=['GET'])
@require_authenticated_user(allow_legacy=False)
def get_group_route(group_id):
    """Retorna detalhes de um grupo."""
    try:
        result = get_group(group_id, g.auth_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao buscar grupo'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota GET /api/groups/{group_id}: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>', methods=['PATCH'])
@require_authenticated_user(allow_legacy=False)
def update_group_route(group_id):
    """Atualiza metadados de um grupo."""
    try:
        payload = request.get_json(silent=True) or {}
        result = update_group(group_id, g.auth_user_id, payload)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao atualizar grupo'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota PATCH /api/groups/{group_id}: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>', methods=['DELETE'])
@require_authenticated_user(allow_legacy=False)
def delete_group_route(group_id):
    """Exclui um grupo (somente fundador)."""
    try:
        result = delete_group(group_id, g.auth_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao excluir grupo'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota DELETE /api/groups/{group_id}: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/members/<member_user_id>/promote', methods=['PATCH'])
@require_authenticated_user(allow_legacy=False)
def promote_member_route(group_id, member_user_id):
    """Promove um membro a líder (somente fundador)."""
    try:
        result = promote_member(group_id, g.auth_user_id, member_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao promover membro'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota PATCH promote: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/members/<member_user_id>/demote', methods=['PATCH'])
@require_authenticated_user(allow_legacy=False)
def demote_member_route(group_id, member_user_id):
    """Rebaixa um líder a membro (somente fundador)."""
    try:
        result = demote_member(group_id, g.auth_user_id, member_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao rebaixar membro'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota PATCH demote: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/members/<member_user_id>', methods=['DELETE'])
@require_authenticated_user(allow_legacy=False)
def remove_member_route(group_id, member_user_id):
    """Expulsa um membro do grupo."""
    try:
        result = remove_member(group_id, g.auth_user_id, member_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao expulsar membro'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota DELETE member: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/transfer-founder', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def transfer_founder_route(group_id):
    """Transfere a fundação do grupo para outro membro."""
    try:
        payload = request.get_json(silent=True) or {}
        new_founder_user_id = payload.get('user_id')

        if not new_founder_user_id:
            return jsonify({
                'status': 'error',
                'message': 'user_id é obrigatório',
            }), 400

        result = transfer_founder(group_id, g.auth_user_id, new_founder_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao transferir fundação'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota POST transfer-founder: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/join', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def join_group_route(group_id):
    """Solicita entrada ou entra em um grupo público."""
    try:
        payload = request.get_json(silent=True) or {}
        result = join_group(group_id, g.auth_user_id, payload)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao entrar no grupo'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota POST /api/groups/{group_id}/join: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/leave', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def leave_group_route(group_id):
    """Sai de um grupo."""
    try:
        result = leave_group(group_id, g.auth_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao sair do grupo'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota POST /api/groups/{group_id}/leave: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/join-requests/<request_id>/approve', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def approve_join_request_route(group_id, request_id):
    """Aprova solicitação de entrada."""
    try:
        result = approve_join_request(group_id, g.auth_user_id, request_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao aprovar solicitação'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota POST approve join request: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/join-requests/<request_id>/reject', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def reject_join_request_route(group_id, request_id):
    """Rejeita solicitação de entrada."""
    try:
        result = reject_join_request(group_id, g.auth_user_id, request_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao rejeitar solicitação'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota POST reject join request: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/invites/direct', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def create_direct_invite_route(group_id):
    """Envia convite direto para um usuário."""
    try:
        payload = request.get_json(silent=True) or {}
        target_user_id = payload.get('user_id')

        if not target_user_id:
            return jsonify({
                'status': 'error',
                'message': 'user_id é obrigatório',
            }), 400

        result = create_direct_invite(group_id, g.auth_user_id, target_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao enviar convite'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota POST direct invite: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/<group_id>/invites/link', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def get_invite_link_route(group_id):
    """Obtém ou regenera o link de convite do grupo."""
    try:
        payload = request.get_json(silent=True) or {}
        regenerate = bool(payload.get('regenerate'))

        result = get_invite_link(group_id, g.auth_user_id, regenerate=regenerate)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao gerar link de convite'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota POST invite link: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/invites/<token>', methods=['GET'])
@require_authenticated_user(allow_legacy=False)
def get_invite_preview_route(token):
    """Retorna preview de um convite pelo token."""
    try:
        result = get_invite_preview(token, g.auth_user_id)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Convite inválido'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota GET invite preview: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500


@bp.route('/api/groups/invites/<token>/accept', methods=['POST'])
@require_authenticated_user(allow_legacy=False)
def accept_invite_route(token):
    """Aceita um convite de grupo."""
    try:
        payload = request.get_json(silent=True) or {}
        result = accept_invite(token, g.auth_user_id, payload)
        status_code = result.get('status_code', 200 if result['success'] else 400)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': result.get('message'),
                'data': result.get('data'),
            }), 200

        return jsonify({
            'status': 'error',
            'message': result.get('message', 'Erro ao aceitar convite'),
        }), status_code
    except Exception as error:
        print(f'Erro na rota POST accept invite: {error}')
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(error)}',
        }), 500
