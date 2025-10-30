"""
Serviço para gerenciamento de observações sobre ações
"""
from config.supabase_config import get_supabase_client
from datetime import datetime


def get_stock_note(user_id, ticker):
    """
    Busca a observação do usuário sobre uma ação
    
    Args:
        user_id: ID do usuário
        ticker: Código da ação (ex: PETR4)
        
    Returns:
        dict: {
            "success": bool,
            "note_text": str,
            "updated_at": str ou None
        }
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar stock_id pelo ticker
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        
        if not stock_response.data or len(stock_response.data) == 0:
            return {
                "success": False,
                "message": f"Ação {ticker} não encontrada no sistema",
                "note_text": "",
                "updated_at": None
            }
        
        stock_id = stock_response.data[0]['id']
        
        # 2. Buscar observação
        note_response = supabase.table('user_stock_notes')\
            .select('note_text, updated_at')\
            .eq('user_id', user_id)\
            .eq('stock_id', stock_id)\
            .execute()
        
        if note_response.data and len(note_response.data) > 0:
            # Tem observação
            return {
                "success": True,
                "note_text": note_response.data[0]['note_text'],
                "updated_at": note_response.data[0]['updated_at']
            }
        else:
            # Não tem observação
            return {
                "success": True,
                "note_text": "",
                "updated_at": None
            }
            
    except Exception as e:
        print(f"Erro ao buscar observação: {str(e)}")
        return {
            "success": False,
            "message": f"Erro ao buscar observação: {str(e)}",
            "note_text": "",
            "updated_at": None
        }


def save_stock_note(user_id, ticker, note_text):
    """
    Salva ou atualiza a observação do usuário sobre uma ação
    
    Args:
        user_id: ID do usuário
        ticker: Código da ação (ex: PETR4)
        note_text: Texto da observação
        
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "note_text": str,
            "updated_at": str
        }
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Buscar stock_id pelo ticker
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        
        if not stock_response.data or len(stock_response.data) == 0:
            return {
                "success": False,
                "message": f"Ação {ticker} não encontrada no sistema"
            }
        
        stock_id = stock_response.data[0]['id']
        
        # 2. Verificar se já existe observação
        existing = supabase.table('user_stock_notes')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('stock_id', stock_id)\
            .execute()
        
        current_time = datetime.utcnow().isoformat()
        
        if existing.data and len(existing.data) > 0:
            # Já existe - atualizar
            supabase.table('user_stock_notes')\
                .update({
                    'note_text': note_text,
                    'updated_at': current_time
                })\
                .eq('user_id', user_id)\
                .eq('stock_id', stock_id)\
                .execute()
            
            return {
                "success": True,
                "message": "Observação atualizada com sucesso!",
                "note_text": note_text,
                "updated_at": current_time
            }
        else:
            # Não existe - inserir novo registro
            supabase.table('user_stock_notes').insert({
                'user_id': user_id,
                'stock_id': stock_id,
                'note_text': note_text,
                'created_at': current_time,
                'updated_at': current_time
            }).execute()
            
            return {
                "success": True,
                "message": "Observação salva com sucesso!",
                "note_text": note_text,
                "updated_at": current_time
            }
            
    except Exception as e:
        print(f"Erro ao salvar observação: {str(e)}")
        return {
            "success": False,
            "message": f"Erro ao salvar observação: {str(e)}"
        }

