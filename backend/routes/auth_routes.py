"""
Rotas de autenticação
Endpoints para registro, login e informações de usuário
"""
from flask import Blueprint, request, jsonify
from services.auth_service import register_user, login_user, get_user_by_id, update_user

# Cria blueprint para rotas de autenticação
bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/register', methods=['POST'])
def register():
    """
    POST /api/auth/register
    Registra um novo usuário
    
    Body:
        {
            "name": "João",
            "last_name": "Silva",
            "email": "joao@email.com",
            "password": "senha123"
        }
    
    Response:
        {
            "status": "success",
            "message": "Usuário cadastrado com sucesso!",
            "user_id": "uuid-do-usuario"
        }
    """
    try:
        data = request.get_json()
        
        # Valida se todos os campos foram enviados
        required_fields = ['name', 'last_name', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "status": "error",
                    "message": f"Campo '{field}' é obrigatório"
                }), 400
        
        # Chama serviço de registro
        result = register_user(
            name=data['name'],
            last_name=data['last_name'],
            email=data['email'],
            password=data['password']
        )
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": "Usuário cadastrado com sucesso!",
                "user_id": result['user_id']
            }), 201
        else:
            return jsonify({
                "status": "error",
                "message": result['error']
            }), 400
            
    except Exception as e:
        print(f"❌ Erro no endpoint de registro: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Erro interno do servidor"
        }), 500


@bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Autentica um usuário
    
    Body:
        {
            "email": "joao@email.com",
            "password": "senha123"
        }
    
    Response:
        {
            "status": "success",
            "user": {
                "id": "uuid",
                "name": "João",
                "last_name": "Silva",
                "email": "joao@email.com",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    """
    try:
        data = request.get_json()
        
        # Valida se todos os campos foram enviados
        if 'email' not in data or 'password' not in data:
            return jsonify({
                "status": "error",
                "message": "Email e senha são obrigatórios"
            }), 400
        
        # Chama serviço de login
        result = login_user(
            email=data['email'],
            password=data['password']
        )
        
        if result['success']:
            return jsonify({
                "status": "success",
                "user": result['user']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['error']
            }), 401
            
    except Exception as e:
        print(f"❌ Erro no endpoint de login: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Erro interno do servidor"
        }), 500


@bp.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    """
    GET /api/auth/user/<user_id>
    Busca informações de um usuário por ID
    
    Response:
        {
            "status": "success",
            "user": {
                "id": "uuid",
                "name": "João",
                "last_name": "Silva",
                "email": "joao@email.com",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    """
    try:
        # Chama serviço de busca
        result = get_user_by_id(user_id)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "user": result['user']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['error']
            }), 404
            
    except Exception as e:
        print(f"❌ Erro no endpoint de busca de usuário: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Erro interno do servidor"
        }), 500


@bp.route('/user/update', methods=['POST'])
def update_user_info():
    """
    POST /api/auth/user/update
    Atualiza informações de um usuário
    
    Body:
        {
            "user_id": "uuid",
            "name": "João",
            "last_name": "Silva",
            "email": "joao@email.com"
        }
    
    Response:
        {
            "status": "success",
            "message": "Dados atualizados com sucesso!",
            "user": {
                "id": "uuid",
                "name": "João",
                "last_name": "Silva",
                "email": "joao@email.com",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    """
    try:
        data = request.get_json()
        
        # Valida se todos os campos foram enviados
        required_fields = ['user_id', 'name', 'last_name', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "status": "error",
                    "message": f"Campo '{field}' é obrigatório"
                }), 400
        
        # Chama serviço de atualização
        result = update_user(
            user_id=data['user_id'],
            name=data['name'],
            last_name=data['last_name'],
            email=data['email']
        )
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": "Dados atualizados com sucesso!",
                "user": result['user']
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": result['error']
            }), 400
            
    except Exception as e:
        print(f"❌ Erro no endpoint de atualização de usuário: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Erro interno do servidor"
        }), 500

