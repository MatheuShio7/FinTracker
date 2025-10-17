"""
Configuração do cliente Supabase
Este módulo gerencia a conexão com o Supabase usando o padrão Singleton
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Variável global para armazenar a instância única do cliente (Singleton)
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Retorna uma instância do cliente Supabase (Singleton).
    
    Esta função implementa o padrão Singleton, garantindo que apenas
    uma instância do cliente seja criada durante toda a execução da aplicação.
    
    Returns:
        Client: Instância do cliente Supabase configurada
        
    Raises:
        ValueError: Se as credenciais do Supabase não estiverem configuradas
        Exception: Se houver erro ao conectar com o Supabase
    
    Example:
        >>> supabase = get_supabase_client()
        >>> result = supabase.table('users').select('*').execute()
    """
    global _supabase_client
    
    # Se o cliente já foi criado, retorna a instância existente
    if _supabase_client is not None:
        return _supabase_client
    
    try:
        # Obtém as credenciais do Supabase das variáveis de ambiente
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_anon_key = os.getenv('SUPABASE_ANON_KEY')
        
        # Valida se as credenciais foram fornecidas
        if not supabase_url or not supabase_anon_key:
            raise ValueError(
                "Credenciais do Supabase não encontradas. "
                "Certifique-se de configurar SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env"
            )
        
        # Valida o formato da URL
        if not supabase_url.startswith('https://'):
            raise ValueError(
                f"URL do Supabase inválida: {supabase_url}. "
                "A URL deve começar com 'https://'"
            )
        
        # Cria o cliente Supabase
        _supabase_client = create_client(supabase_url, supabase_anon_key)
        
        print(f"✅ Cliente Supabase conectado com sucesso: {supabase_url}")
        
        return _supabase_client
        
    except ValueError as ve:
        # Erro de validação das credenciais
        print(f"❌ Erro de configuração do Supabase: {str(ve)}")
        raise
        
    except Exception as e:
        # Erro genérico ao conectar
        print(f"❌ Erro ao conectar com o Supabase: {str(e)}")
        raise Exception(f"Falha ao inicializar o cliente Supabase: {str(e)}")


def reset_supabase_client():
    """
    Reseta a instância do cliente Supabase.
    
    Útil para testes ou quando é necessário recriar a conexão.
    """
    global _supabase_client
    _supabase_client = None
    print("🔄 Cliente Supabase resetado")


# Exporta o cliente para uso direto (opcional)
# Descomente a linha abaixo se preferir importar o cliente diretamente
# supabase_client = get_supabase_client()

