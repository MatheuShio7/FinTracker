# FinTracker Backend API

API Flask para o sistema FinTracker de gerenciamento financeiro.

## 📁 Estrutura do Projeto

```
backend/
├── app.py                 # Arquivo principal da aplicação
├── requirements.txt       # Dependências do projeto
├── .env                  # Variáveis de ambiente (não versionar)
├── .env.example          # Exemplo de variáveis de ambiente
├── .gitignore            # Arquivos ignorados pelo git
│
├── config/               # Configurações da aplicação
│   ├── __init__.py
│   └── config.py         # Classes de configuração
│
├── routes/               # Rotas da API (endpoints)
│   ├── __init__.py
│   └── health_routes.py  # Rotas de health check
│
├── services/             # Lógica de negócio
│   ├── __init__.py
│   └── example_service.py
│
├── models/               # Modelos de dados
│   ├── __init__.py
│   └── example_model.py
│
└── utils/                # Utilitários e helpers
    ├── __init__.py
    ├── helpers.py        # Funções auxiliares
    └── validators.py     # Validadores de dados
```

## 🚀 Como Executar

### 1. Criar ambiente virtual

```bash
python -m venv venv
```

### 2. Ativar ambiente virtual

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
copy .env.example .env
```

### 5. Executar a aplicação

```bash
python app.py
```

A API estará disponível em `http://localhost:5000`

## 🧪 Testar a API

Acesse o endpoint de health check:

```bash
curl http://localhost:5000/api/health
```

Ou abra no navegador: `http://localhost:5000/api/health`

## 📝 Endpoints Disponíveis

### Health Check

- **GET** `/api/health`
  - Verifica se a API está funcionando
  - Retorna status e timestamp

## 🔧 Desenvolvimento

### Adicionar novas rotas

1. Criar arquivo de rotas em `routes/`
2. Definir um Blueprint
3. Registrar no `app.py`

### Adicionar lógica de negócio

1. Criar serviço em `services/`
2. Implementar métodos necessários
3. Usar nas rotas

### Adicionar modelos

1. Criar modelo em `models/`
2. Definir estrutura de dados
3. Usar nos serviços

## 📦 Dependências Principais

- **Flask**: Framework web
- **Flask-CORS**: Suporte a CORS
- **python-dotenv**: Gerenciamento de variáveis de ambiente
- **requests**: Cliente HTTP

## 🛡️ Segurança

- Nunca commitar o arquivo `.env`
- Sempre usar variáveis de ambiente para dados sensíveis
- Trocar `SECRET_KEY` em produção
- Configurar CORS adequadamente para produção

## 📄 Licença

Este projeto está sob a licença MIT.

