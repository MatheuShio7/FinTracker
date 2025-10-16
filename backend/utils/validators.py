"""
Validadores de dados
"""
import re
from typing import Any, Dict, List

def validate_required_fields(data: Dict, required_fields: List[str]) -> tuple:
    """
    Valida se todos os campos obrigatórios estão presentes
    
    Args:
        data: Dicionário com os dados
        required_fields: Lista de campos obrigatórios
        
    Returns:
        Tupla (válido: bool, campos_faltantes: list)
    """
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    return len(missing_fields) == 0, missing_fields

def validate_email(email: str) -> bool:
    """
    Valida formato de email
    
    Args:
        email: String de email
        
    Returns:
        True se válido, False caso contrário
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_positive_number(value: Any) -> bool:
    """
    Valida se o valor é um número positivo
    
    Args:
        value: Valor a ser validado
        
    Returns:
        True se válido, False caso contrário
    """
    try:
        return float(value) > 0
    except (ValueError, TypeError):
        return False

