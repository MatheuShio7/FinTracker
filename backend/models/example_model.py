"""
Exemplo de modelo de dados
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class ExampleModel:
    """
    Exemplo de modelo de dados usando dataclass
    Em uma aplicação real, você usaria SQLAlchemy ou outro ORM
    """
    id: Optional[int] = None
    name: str = ""
    description: Optional[str] = None
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Converte o modelo para dicionário"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

