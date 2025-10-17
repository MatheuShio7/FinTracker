"""
Rotas de exemplo para demonstrar o uso do Supabase
"""
from flask import Blueprint, jsonify, request
from config.supabase_config import get_supabase_client
from utils.helpers import format_response, format_error

bp = Blueprint('supabase_example', __name__, url_prefix='/api')


@bp.route('/supabase/test', methods=['GET'])
def test_supabase_connection():
    """
    Testa a conexão com o Supabase
    
    Returns:
        JSON com status da conexão
    """
    try:
        # Obtém o cliente Supabase
        supabase = get_supabase_client()
        
        return jsonify(format_response(
            data={
                'connected': True,
                'message': 'Conexão com Supabase estabelecida com sucesso!'
            },
            message='Supabase conectado'
        )), 200
        
    except ValueError as ve:
        # Erro de configuração
        return jsonify(format_error(
            message='Erro de configuração do Supabase',
            code=500,
            details=str(ve)
        ))
        
    except Exception as e:
        # Erro genérico
        return jsonify(format_error(
            message='Erro ao conectar com Supabase',
            code=500,
            details=str(e)
        ))


@bp.route('/supabase/tables', methods=['GET'])
def list_tables_info():
    """
    Retorna informações sobre as tabelas disponíveis (exemplo)
    
    Returns:
        JSON com informações das tabelas
    """
    try:
        supabase = get_supabase_client()
        
        # Exemplo: Listar algumas tabelas comuns
        # Você pode adaptar isso para consultar suas próprias tabelas
        tables_info = {
            'available_operations': [
                'SELECT',
                'INSERT',
                'UPDATE',
                'DELETE'
            ],
            'example_usage': {
                'select': "supabase.table('table_name').select('*').execute()",
                'insert': "supabase.table('table_name').insert({'column': 'value'}).execute()",
                'update': "supabase.table('table_name').update({'column': 'new_value'}).eq('id', 1).execute()",
                'delete': "supabase.table('table_name').delete().eq('id', 1).execute()"
            }
        }
        
        return jsonify(format_response(
            data=tables_info,
            message='Informações das operações do Supabase'
        )), 200
        
    except Exception as e:
        return jsonify(format_error(
            message='Erro ao obter informações',
            code=500,
            details=str(e)
        ))

