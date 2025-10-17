# 🚀 Guia de Configuração do Supabase

Este guia explica como configurar e usar o Supabase no backend do FinTracker.

## 📋 Índice
1. [Configuração Inicial](#configuração-inicial)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Como Usar](#como-usar)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Tratamento de Erros](#tratamento-de-erros)

---

## 🔧 Configuração Inicial

### 1. Instalar Dependências

```bash
pip install -r requirements.txt
```

Isso instalará a biblioteca `supabase>=2.0.0`.

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` na pasta `backend/`:

```env
# Configurações do Supabase
SUPABASE_URL=https://rjrbhtzjjwbbwvykmtrv.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Como obter suas credenciais:**
1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em `Settings` > `API`
3. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

---

## 📁 Estrutura de Arquivos

```
backend/
├── config/
│   └── supabase_config.py       # ✅ Configuração do cliente Supabase
│
├── routes/
│   └── supabase_example_routes.py  # 📝 Rotas de exemplo
│
└── .env                         # 🔐 Suas credenciais (NÃO COMMITAR!)
```

---

## 💡 Como Usar

### Padrão Singleton

O cliente Supabase é criado usando o **padrão Singleton**, garantindo uma única instância durante toda a execução:

```python
from config.supabase_config import get_supabase_client

# Obtém o cliente (sempre a mesma instância)
supabase = get_supabase_client()
```

### Em Rotas Flask

```python
from flask import Blueprint, jsonify
from config.supabase_config import get_supabase_client

bp = Blueprint('my_routes', __name__, url_prefix='/api')

@bp.route('/users', methods=['GET'])
def get_users():
    try:
        # Obtém o cliente
        supabase = get_supabase_client()
        
        # Consulta a tabela 'users'
        response = supabase.table('users').select('*').execute()
        
        return jsonify({'data': response.data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Em Serviços

```python
from config.supabase_config import get_supabase_client

class UserService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def get_all_users(self):
        response = self.supabase.table('users').select('*').execute()
        return response.data
```

---

## 📚 Exemplos de Uso

### 1. SELECT - Consultar Dados

```python
# Buscar todos os registros
response = supabase.table('stocks').select('*').execute()

# Buscar com filtro
response = supabase.table('stocks')\
    .select('*')\
    .eq('ticker', 'AAPL')\
    .execute()

# Buscar com múltiplos filtros
response = supabase.table('portfolio')\
    .select('*')\
    .eq('user_id', 123)\
    .gte('quantity', 10)\
    .execute()

# Buscar com ordenação
response = supabase.table('stocks')\
    .select('*')\
    .order('created_at', desc=True)\
    .execute()

# Buscar com limite
response = supabase.table('stocks')\
    .select('*')\
    .limit(10)\
    .execute()
```

### 2. INSERT - Inserir Dados

```python
# Inserir um registro
response = supabase.table('portfolio').insert({
    'user_id': 123,
    'ticker': 'AAPL',
    'quantity': 10,
    'price': 150.50
}).execute()

# Inserir múltiplos registros
response = supabase.table('portfolio').insert([
    {'user_id': 123, 'ticker': 'AAPL', 'quantity': 10},
    {'user_id': 123, 'ticker': 'GOOGL', 'quantity': 5}
]).execute()
```

### 3. UPDATE - Atualizar Dados

```python
# Atualizar registro
response = supabase.table('portfolio')\
    .update({'quantity': 15})\
    .eq('id', 1)\
    .execute()

# Atualizar múltiplos campos
response = supabase.table('portfolio')\
    .update({
        'quantity': 20,
        'price': 155.00,
        'updated_at': 'now()'
    })\
    .eq('id', 1)\
    .execute()
```

### 4. DELETE - Deletar Dados

```python
# Deletar registro
response = supabase.table('portfolio')\
    .delete()\
    .eq('id', 1)\
    .execute()

# Deletar com filtro
response = supabase.table('portfolio')\
    .delete()\
    .eq('user_id', 123)\
    .eq('ticker', 'AAPL')\
    .execute()
```

### 5. Autenticação (se usar Supabase Auth)

```python
# Sign Up
response = supabase.auth.sign_up({
    'email': 'user@example.com',
    'password': 'senha123'
})

# Sign In
response = supabase.auth.sign_in_with_password({
    'email': 'user@example.com',
    'password': 'senha123'
})

# Get User
user = supabase.auth.get_user()

# Sign Out
supabase.auth.sign_out()
```

### 6. Storage (Upload de Arquivos)

```python
# Upload de arquivo
with open('foto.jpg', 'rb') as f:
    response = supabase.storage.from_('avatars').upload(
        'user_123/foto.jpg',
        f
    )

# Download de arquivo
response = supabase.storage.from_('avatars').download('user_123/foto.jpg')

# Get URL pública
url = supabase.storage.from_('avatars').get_public_url('user_123/foto.jpg')
```

---

## 🛡️ Tratamento de Erros

O arquivo `config/supabase_config.py` já inclui tratamento de erros robusto:

### Erros Capturados

1. **Credenciais não configuradas:**
```python
ValueError: Credenciais do Supabase não encontradas.
```

2. **URL inválida:**
```python
ValueError: URL do Supabase inválida
```

3. **Erro de conexão:**
```python
Exception: Falha ao inicializar o cliente Supabase
```

### Exemplo de Tratamento em Rotas

```python
@bp.route('/data', methods=['GET'])
def get_data():
    try:
        supabase = get_supabase_client()
        response = supabase.table('data').select('*').execute()
        return jsonify({'data': response.data}), 200
        
    except ValueError as ve:
        # Erro de configuração
        return jsonify({
            'error': 'Configuração inválida',
            'details': str(ve)
        }), 500
        
    except Exception as e:
        # Erro genérico
        return jsonify({
            'error': 'Erro ao buscar dados',
            'details': str(e)
        }), 500
```

---

## 🧪 Testando a Configuração

### 1. Habilitar Rotas de Exemplo

No arquivo `app.py`, descomente as linhas:

```python
from routes import supabase_example_routes
# ...
app.register_blueprint(supabase_example_routes.bp)
```

### 2. Executar a Aplicação

```bash
python app.py
```

### 3. Testar Endpoints

```bash
# Testar conexão
curl http://localhost:5000/api/supabase/test

# Ver informações de operações
curl http://localhost:5000/api/supabase/tables
```

---

## 📝 Notas Importantes

1. **Nunca commite o arquivo `.env`** - Ele está no `.gitignore` por segurança
2. **Use `.env.example`** como template para outros desenvolvedores
3. **Anon Key é segura** - Pode ser usada no frontend, mas configure RLS (Row Level Security) no Supabase
4. **Service Role Key** - Nunca exponha no frontend! Use apenas no backend para operações administrativas
5. **Row Level Security (RLS)** - Configure no Supabase para proteger seus dados

---

## 🔗 Links Úteis

- [Documentação Supabase Python](https://supabase.com/docs/reference/python/introduction)
- [Supabase Dashboard](https://app.supabase.com)
- [Exemplos de Queries](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ❓ Troubleshooting

### Erro: "Credenciais não encontradas"
✅ Verifique se o arquivo `.env` existe e contém `SUPABASE_URL` e `SUPABASE_ANON_KEY`

### Erro: "URL inválida"
✅ A URL deve começar com `https://` e seguir o formato: `https://[projeto].supabase.co`

### Erro: "Connection refused"
✅ Verifique sua conexão com a internet e se o projeto Supabase está ativo

### Cliente não conecta
✅ Execute `python -c "from config.supabase_config import get_supabase_client; get_supabase_client()"` para testar

---

Pronto! Agora você está pronto para usar o Supabase no seu backend Flask! 🎉

