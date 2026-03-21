"""
Serviço de autenticação de usuários
Gerencia registro, login e busca de usuários usando Supabase Auth
"""
import re
from config.supabase_config import get_supabase_client, get_supabase_admin_client
from typing import Dict, Any, Optional


def validate_email(email: str) -> bool:
    """
    Valida formato do email usando regex
    
    Args:
        email: Email a ser validado
        
    Returns:
        bool: True se email é válido, False caso contrário
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None


def _extract_auth_user_id(auth_response: Any) -> Optional[str]:
    """Extrai o ID do usuário de respostas do Supabase Auth (objeto ou dict)."""
    if not auth_response:
        return None

    user = getattr(auth_response, 'user', None)
    if user is None and isinstance(auth_response, dict):
        user = auth_response.get('user')

    if user is None:
        data = getattr(auth_response, 'data', None)
        if isinstance(data, dict):
            user = data.get('user')

    if user is None:
        return None

    if isinstance(user, dict):
        return user.get('id')

    return getattr(user, 'id', None)


def _extract_auth_user_metadata(auth_response: Any) -> Dict[str, Any]:
    """Extrai metadados do usuário da resposta do Auth de forma resiliente."""
    if not auth_response:
        return {}

    user = getattr(auth_response, 'user', None)
    if user is None and isinstance(auth_response, dict):
        user = auth_response.get('user')

    if user is None:
        data = getattr(auth_response, 'data', None)
        if isinstance(data, dict):
            user = data.get('user')

    if isinstance(user, dict):
        return user.get('user_metadata') or user.get('raw_user_meta_data') or {}

    return (
        getattr(user, 'user_metadata', None)
        or getattr(user, 'raw_user_meta_data', None)
        or {}
    )


def _upsert_custom_user(
    supabase: Any,
    user_id: str,
    name: str,
    last_name: str,
    email: str
) -> Dict[str, Any]:
    """Faz upsert do perfil na tabela users usando o mesmo UUID do Auth."""
    payload = {
        'id': user_id,
        'name': name,
        'last_name': last_name,
        'email': email
    }

    try:
        result = supabase.table('users').upsert(payload, on_conflict='id').execute()

        # Em alguns cenários o Supabase pode retornar data vazia mesmo com sucesso.
        if result.data and len(result.data) > 0:
            return {'success': True, 'user': result.data[0]}

        try:
            read_result = supabase.table('users').select('*').eq('id', user_id).execute()
            if read_result.data and len(read_result.data) > 0:
                return {'success': True, 'user': read_result.data[0]}
        except Exception:
            pass

        return {'success': True, 'user': payload}
    except Exception as e:
        return {
            'success': False,
            'error': f"Erro ao sincronizar perfil na tabela users: {str(e)}"
        }


def register_user(name: str, last_name: str, email: str, password: str) -> Dict[str, Any]:
    """
    Registra um novo usuário no sistema
    
    Args:
        name: Nome do usuário
        last_name: Sobrenome do usuário
        email: Email do usuário
        password: Senha em texto plano
        
    Returns:
        Dict com:
        - success (bool): True se registro foi bem-sucedido
        - user_id (str): ID do usuário criado (se sucesso)
        - error (str): Mensagem de erro (se falha)
    """
    try:
        # Validações
        if not name or not name.strip():
            return {"success": False, "error": "Nome não pode estar vazio"}
        
        if not last_name or not last_name.strip():
            return {"success": False, "error": "Sobrenome não pode estar vazio"}
        
        if not validate_email(email):
            return {"success": False, "error": "Email inválido"}
        
        if len(password) < 8:
            return {"success": False, "error": "Senha deve ter pelo menos 8 caracteres"}
        
        # Conecta ao Supabase
        supabase = get_supabase_client()

        normalized_name = name.strip()
        normalized_last_name = last_name.strip()
        normalized_email = email.lower().strip()
        full_name = f"{normalized_name} {normalized_last_name}".strip()

        auth_user_id = None

        try:
            sign_up_response = supabase.auth.sign_up({
                'email': normalized_email,
                'password': password,
                'options': {
                    'data': {
                        'full_name': full_name
                    }
                }
            })
            auth_user_id = _extract_auth_user_id(sign_up_response)
        except Exception as sign_up_error:
            error_message = str(sign_up_error).lower()

            # Se o usuário já existir no Auth, tenta login para recuperar o UUID.
            if 'already registered' in error_message or 'already exists' in error_message:
                try:
                    sign_in_response = supabase.auth.sign_in_with_password({
                        'email': normalized_email,
                        'password': password
                    })
                    auth_user_id = _extract_auth_user_id(sign_in_response)
                except Exception:
                    return {"success": False, "error": "Email já está cadastrado"}
            else:
                return {"success": False, "error": f"Erro ao criar usuário no Auth: {str(sign_up_error)}"}

        if not auth_user_id:
            return {
                "success": False,
                "error": "Não foi possível obter o ID do usuário criado no Supabase Auth"
            }

        custom_result = _upsert_custom_user(
            supabase=supabase,
            user_id=auth_user_id,
            name=normalized_name,
            last_name=normalized_last_name,
            email=normalized_email
        )

        if not custom_result['success']:
            return {"success": False, "error": custom_result['error']}

        return {"success": True, "user_id": auth_user_id}
            
    except Exception as e:
        print(f"❌ Erro no registro de usuário: {str(e)}")
        return {"success": False, "error": f"Erro no servidor: {str(e)}"}


def login_user(email: str, password: str) -> Dict[str, Any]:
    """
    Autentica um usuário
    
    Args:
        email: Email do usuário
        password: Senha em texto plano
        
    Returns:
        Dict com:
        - success (bool): True se login foi bem-sucedido
        - user (dict): Dados do usuário (sem password) se sucesso
        - error (str): Mensagem de erro se falha
    """
    try:
        # Validações básicas
        if not email or not password:
            return {"success": False, "error": "Email e senha são obrigatórios"}
        
        # Conecta ao Supabase
        supabase = get_supabase_client()
        
        normalized_email = email.lower().strip()

        auth_result = supabase.auth.sign_in_with_password({
            'email': normalized_email,
            'password': password
        })
        auth_user_id = _extract_auth_user_id(auth_result)

        if not auth_user_id:
            return {"success": False, "error": "Email ou senha incorretos"}

        result = supabase.table('users').select('*').eq('id', auth_user_id).execute()
        if result.data and len(result.data) > 0:
            return {"success": True, "user": result.data[0]}

        # Se autenticou no Auth mas não existe perfil custom, cria automaticamente.
        metadata = _extract_auth_user_metadata(auth_result)
        full_name = (metadata.get('full_name') or '').strip() if isinstance(metadata, dict) else ''
        derived_name = ''
        derived_last_name = ''

        if full_name:
            parts = full_name.split()
            if len(parts) == 1:
                derived_name = parts[0]
            elif len(parts) > 1:
                derived_name = parts[0]
                derived_last_name = ' '.join(parts[1:])

        user_profile_result = _upsert_custom_user(
            supabase=supabase,
            user_id=auth_user_id,
            name=derived_name,
            last_name=derived_last_name,
            email=normalized_email
        )

        if not user_profile_result['success']:
            return {"success": False, "error": user_profile_result['error']}

        return {"success": True, "user": user_profile_result['user']}
        
    except Exception as e:
        print(f"❌ Erro no login de usuário: {str(e)}")
        return {"success": False, "error": f"Erro no servidor: {str(e)}"}


def get_user_by_id(user_id: str) -> Dict[str, Any]:
    """
    Busca usuário por ID
    
    Args:
        user_id: ID do usuário
        
    Returns:
        Dict com:
        - success (bool): True se usuário foi encontrado
        - user (dict): Dados do usuário (sem password) se encontrado
        - error (str): Mensagem de erro se não encontrado
    """
    try:
        # Conecta ao Supabase
        supabase = get_supabase_client()
        
        # Busca usuário por ID
        result = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not result.data or len(result.data) == 0:
            return {"success": False, "error": "Usuário não encontrado"}
        
        user_data = result.data[0]
        
        return {"success": True, "user": user_data}
        
    except Exception as e:
        print(f"❌ Erro ao buscar usuário: {str(e)}")
        return {"success": False, "error": f"Erro no servidor: {str(e)}"}


def update_user(user_id: str, name: str, last_name: str, email: str) -> Dict[str, Any]:
    """
    Atualiza informações de um usuário em ambas as tabelas (Auth e users custom)
    
    Args:
        user_id: ID do usuário
        name: Novo nome do usuário
        last_name: Novo sobrenome do usuário
        email: Novo email do usuário
        
    Returns:
        Dict com:
        - success (bool): True se atualização foi bem-sucedida
        - user (dict): Dados atualizados do usuário se sucesso
        - error (str): Mensagem de erro se falha
    """
    try:
        # Validações
        if not name or not name.strip():
            return {"success": False, "error": "Nome não pode estar vazio"}
        
        if not last_name or not last_name.strip():
            return {"success": False, "error": "Sobrenome não pode estar vazio"}
        
        if not validate_email(email):
            return {"success": False, "error": "Email inválido"}
        
        normalized_name = name.strip()
        normalized_last_name = last_name.strip()
        email_normalized = email.lower().strip()
        full_name = f"{normalized_name} {normalized_last_name}".strip()
        
        # Conecta ao Supabase
        supabase = get_supabase_client()
        supabase_admin = get_supabase_admin_client()
        
        # Verifica se o usuário existe
        user_result = supabase.table('users').select('id, email').eq('id', user_id).execute()
        if not user_result.data or len(user_result.data) == 0:
            return {"success": False, "error": "Usuário não encontrado"}
        
        current_user = user_result.data[0]
        
        # Verifica se o email já está sendo usado por outro usuário
        if email_normalized != current_user['email']:
            existing_email = supabase.table('users').select('id').eq('email', email_normalized).execute()
            if existing_email.data and len(existing_email.data) > 0:
                return {"success": False, "error": "Este email já está sendo usado por outro usuário"}
        
        # Atualiza nome e metadata no Auth; se falhar, não aplica update parcial no perfil custom.
        try:
            supabase_admin.auth.admin.update_user_by_id(
                user_id,
                {
                    'email': email_normalized,
                    'user_metadata': {'full_name': full_name}
                }
            )
        except Exception as auth_error:
            return {"success": False, "error": f"Erro ao atualizar usuário no Auth: {str(auth_error)}"}
        
        # Atualiza o perfil na tabela users custom
        update_result = supabase.table('users').update({
            'name': normalized_name,
            'last_name': normalized_last_name,
            'email': email_normalized
        }).eq('id', user_id).execute()
        
        if update_result.data and len(update_result.data) > 0:
            updated_user = update_result.data[0]
            return {"success": True, "user": updated_user}
        
        # Se update não retornar dados, faz select para confirmar
        try:
            read_result = supabase.table('users').select('*').eq('id', user_id).execute()
            if read_result.data and len(read_result.data) > 0:
                return {"success": True, "user": read_result.data[0]}
        except Exception:
            pass
        
        return {"success": True, "user": {"id": user_id, "name": normalized_name, "last_name": normalized_last_name, "email": email_normalized}}
            
    except Exception as e:
        print(f"❌ Erro ao atualizar usuário: {str(e)}")
        return {"success": False, "error": f"Erro no servidor: {str(e)}"}


def update_password(user_id: str, current_password: str, new_password: str) -> Dict[str, Any]:
    """
    Atualiza a senha de um usuário usando admin auth
    
    Args:
        user_id: ID do usuário
        current_password: Senha atual do usuário
        new_password: Nova senha do usuário
        
    Returns:
        Dict com:
        - success (bool): True se atualização foi bem-sucedida
        - error (str): Mensagem de erro se falha
    """
    try:
        # Validações
        if not current_password or not new_password:
            return {"success": False, "error": "Todos os campos são obrigatórios"}
        
        if len(new_password) < 8:
            return {"success": False, "error": "A nova senha deve ter pelo menos 8 caracteres"}
        
        if current_password == new_password:
            return {"success": False, "error": "A nova senha deve ser diferente da senha atual"}
        
        # Conecta ao Supabase
        supabase = get_supabase_client()
        supabase_admin = get_supabase_admin_client()
        
        # Busca email do usuário para validar senha atual via Auth
        user_result = supabase.table('users').select('id, email').eq('id', user_id).execute()
        if not user_result.data or len(user_result.data) == 0:
            return {"success": False, "error": "Usuário não encontrado"}

        user_email = user_result.data[0].get('email')
        if not user_email:
            return {"success": False, "error": "Usuário sem email cadastrado"}

        # Reautentica com senha atual para validar.
        try:
            sign_in_result = supabase.auth.sign_in_with_password({
                'email': user_email,
                'password': current_password
            })
            auth_user_id = _extract_auth_user_id(sign_in_result)
            if not auth_user_id or auth_user_id != user_id:
                return {"success": False, "error": "Senha atual incorreta"}
        except Exception:
            return {"success": False, "error": "Senha atual incorreta"}

        # Atualiza senha no Supabase Auth usando admin.
        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {'password': new_password}
        )
        return {"success": True}
            
    except Exception as e:
        print(f"❌ Erro ao atualizar senha: {str(e)}")
        return {"success": False, "error": f"Erro no servidor: {str(e)}"}