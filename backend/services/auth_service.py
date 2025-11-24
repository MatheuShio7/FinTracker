"""
Serviço de autenticação de usuários
Gerencia registro, login e busca de usuários com hash de senha usando bcrypt
"""
import re
import bcrypt
from config.supabase_config import get_supabase_client
from typing import Dict, Any


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


def hash_password(password: str) -> str:
    """
    Gera hash bcrypt da senha
    
    Args:
        password: Senha em texto plano
        
    Returns:
        str: Hash da senha
    """
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha corresponde ao hash
    
    Args:
        password: Senha em texto plano
        hashed_password: Hash da senha armazenado
        
    Returns:
        bool: True se a senha está correta
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


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
        
        # Hash da senha
        hashed_pwd = hash_password(password)
        
        # Conecta ao Supabase
        supabase = get_supabase_client()
        
        # Verifica se email já existe
        existing_user = supabase.table('users').select('id').eq('email', email).execute()
        if existing_user.data and len(existing_user.data) > 0:
            return {"success": False, "error": "Email já está cadastrado"}
        
        # Insere novo usuário
        result = supabase.table('users').insert({
            'name': name.strip(),
            'last_name': last_name.strip(),
            'email': email.lower().strip(),
            'password': hashed_pwd
        }).execute()
        
        if result.data and len(result.data) > 0:
            user_id = result.data[0]['id']
            return {"success": True, "user_id": user_id}
        else:
            return {"success": False, "error": "Erro ao criar usuário"}
            
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
        
        # Busca usuário por email
        result = supabase.table('users').select('*').eq('email', email.lower().strip()).execute()
        
        if not result.data or len(result.data) == 0:
            return {"success": False, "error": "Email ou senha incorretos"}
        
        user_data = result.data[0]
        stored_password = user_data.get('password')
        
        # Verifica a senha
        if not verify_password(password, stored_password):
            return {"success": False, "error": "Email ou senha incorretos"}
        
        # Remove o campo password antes de retornar
        user_data.pop('password', None)
        
        return {"success": True, "user": user_data}
        
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
        
        # Remove o campo password antes de retornar
        user_data.pop('password', None)
        
        return {"success": True, "user": user_data}
        
    except Exception as e:
        print(f"❌ Erro ao buscar usuário: {str(e)}")
        return {"success": False, "error": f"Erro no servidor: {str(e)}"}


def update_user(user_id: str, name: str, last_name: str, email: str) -> Dict[str, Any]:
    """
    Atualiza informações de um usuário
    
    Args:
        user_id: ID do usuário
        name: Novo nome do usuário
        last_name: Novo sobrenome do usuário
        email: Novo email do usuário
        
    Returns:
        Dict com:
        - success (bool): True se atualização foi bem-sucedida
        - user (dict): Dados atualizados do usuário (sem password) se sucesso
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
        
        # Conecta ao Supabase
        supabase = get_supabase_client()
        
        # Verifica se o usuário existe
        user_result = supabase.table('users').select('id, email').eq('id', user_id).execute()
        if not user_result.data or len(user_result.data) == 0:
            return {"success": False, "error": "Usuário não encontrado"}
        
        current_user = user_result.data[0]
        
        # Verifica se o email já está sendo usado por outro usuário
        email_normalized = email.lower().strip()
        if email_normalized != current_user['email']:
            existing_email = supabase.table('users').select('id').eq('email', email_normalized).execute()
            if existing_email.data and len(existing_email.data) > 0:
                return {"success": False, "error": "Este email já está sendo usado por outro usuário"}
        
        # Atualiza o usuário
        update_result = supabase.table('users').update({
            'name': name.strip(),
            'last_name': last_name.strip(),
            'email': email_normalized
        }).eq('id', user_id).execute()
        
        if update_result.data and len(update_result.data) > 0:
            updated_user = update_result.data[0]
            # Remove o campo password antes de retornar
            updated_user.pop('password', None)
            return {"success": True, "user": updated_user}
        else:
            return {"success": False, "error": "Erro ao atualizar usuário"}
            
    except Exception as e:
        print(f"❌ Erro ao atualizar usuário: {str(e)}")
        return {"success": False, "error": f"Erro no servidor: {str(e)}"}
