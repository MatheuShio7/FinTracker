"""
Funções auxiliares e utilitários gerais
"""
from datetime import datetime
from typing import Any, Dict

def format_response(data: Any, message: str = None, status: str = 'success') -> Dict:
    """
    Formata resposta padrão da API
    
    Args:
        data: Dados a serem retornados
        message: Mensagem opcional
        status: Status da resposta (success, error, warning)
        
    Returns:
        Dicionário formatado
    """
    response = {
        'status': status,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if message:
        response['message'] = message
        
    if data is not None:
        response['data'] = data
        
    return response

def format_error(message: str, code: int = 400, details: Any = None) -> tuple:
    """
    Formata resposta de erro da API
    
    Args:
        message: Mensagem de erro
        code: Código HTTP
        details: Detalhes adicionais do erro
        
    Returns:
        Tupla (resposta_json, código_http)
    """
    error_response = {
        'status': 'error',
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if details:
        error_response['details'] = details
        
    return error_response, code

