# 📚 Documentação Completa da API - FinTracker Backend

Documentação de todos os endpoints disponíveis na API do FinTracker.

---

## 📋 Índice
1. [Health Check](#health-check)
2. [Preços de Ações](#preços-de-ações)
3. [Dividendos](#dividendos)
4. [Supabase (Exemplos)](#supabase-exemplos)

---

## 🏥 Health Check

### GET `/api/health`

Verifica se a API está funcionando.

**Resposta:**
```json
{
    "status": "success",
    "message": "FinTracker API está funcionando!",
    "timestamp": "2025-10-17T00:00:00.000000",
    "version": "1.0.0"
}
```

---

## 📊 Preços de Ações

### 1. Buscar Histórico de Preços

**GET** `/api/prices/<ticker>`

**Query Parameters:**
- `range` (opcional): Período do histórico
  - Opções: `7d`, `1m`, `3m`, `6m`, `1y`, `5y`
  - Padrão: `3m`
  - **Aceita ambos**: `1m` ou `1mo`, `3m` ou `3mo`, `6m` ou `6mo`

**Exemplo:**
```bash
curl "http://localhost:5000/api/prices/PETR4?range=7d"
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Preços de PETR4 obtidos com sucesso",
    "data": {
        "ticker": "PETR4",
        "period": "7d",
        "count": 6,
        "prices": [
            {"date": "2025-10-09", "price": 30.21},
            {"date": "2025-10-10", "price": 29.94},
            {"date": "2025-10-13", "price": 30.23},
            {"date": "2025-10-14", "price": 30.02},
            {"date": "2025-10-15", "price": 29.75},
            {"date": "2025-10-16", "price": 29.61}
        ]
    }
}
```

### 2. Testar Serviço de Preços

**GET** `/api/prices/test`

Testa o serviço BraAPI com PETR4.

**Exemplo:**
```bash
curl "http://localhost:5000/api/prices/test"
```

---

## 💰 Dividendos

### 1. Buscar Histórico de Dividendos

**GET** `/api/dividends/<ticker>`

Retorna os últimos 12 dividendos da ação.

**Exemplo:**
```bash
curl "http://localhost:5000/api/dividends/PETR4"
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Dividendos de PETR4 obtidos com sucesso",
    "data": {
        "ticker": "PETR4",
        "count": 12,
        "dividends": [
            {"payment_date": "2023-06-13", "value": 1.893576},
            {"payment_date": "2023-08-22", "value": 1.149355},
            ...
        ]
    }
}
```

### 2. Obter Resumo de Dividendos

**GET** `/api/dividends/<ticker>/summary`

Retorna estatísticas dos dividendos.

**Exemplo:**
```bash
curl "http://localhost:5000/api/dividends/VALE3/summary"
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Resumo de dividendos de VALE3 obtido com sucesso",
    "data": {
        "ticker": "VALE3",
        "total_dividends": 12,
        "total_paid": 31.20,
        "avg_value": 2.60,
        "last_payment": "2025-09-30",
        "last_value": 0.81,
        "dividends": [...]
    }
}
```

### 3. Calcular Dividend Yield

**GET** `/api/dividends/<ticker>/yield`

Calcula o dividend yield estimado.

**Query Parameters:**
- `quantity` (opcional): Quantidade de ações (padrão: 100)

**Exemplo:**
```bash
curl "http://localhost:5000/api/dividends/ITUB4/yield?quantity=100"
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Dividend yield de ITUB4 calculado com sucesso",
    "data": {
        "ticker": "ITUB4",
        "quantity": 100,
        "dividends_per_share": 2.29,
        "estimated_annual_income": 229.35,
        "current_price": 37.36,
        "dividend_yield_percent": 6.14,
        "base_period": "últimos 12 dividendos"
    }
}
```

### 4. Testar Serviço de Dividendos

**GET** `/api/dividends/test`

Testa o serviço Yahoo Finance com PETR4.

**Exemplo:**
```bash
curl "http://localhost:5000/api/dividends/test"
```

---

## 🗄️ Supabase (Exemplos)

### 1. Testar Conexão com Supabase

**GET** `/api/supabase/test`

Testa a conexão com o Supabase.

**Exemplo:**
```bash
curl "http://localhost:5000/api/supabase/test"
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Supabase conectado",
    "data": {
        "connected": true,
        "message": "Conexão com Supabase estabelecida com sucesso!"
    }
}
```

### 2. Informações sobre Operações

**GET** `/api/supabase/tables`

Retorna informações sobre operações disponíveis no Supabase.

**Exemplo:**
```bash
curl "http://localhost:5000/api/supabase/tables"
```

---

## 📝 Formato de Resposta Padrão

### Sucesso
```json
{
    "status": "success",
    "message": "Mensagem de sucesso",
    "timestamp": "2025-10-17T00:00:00.000000",
    "data": { ... }
}
```

### Erro
```json
{
    "status": "error",
    "message": "Mensagem de erro",
    "timestamp": "2025-10-17T00:00:00.000000",
    "details": "Detalhes adicionais do erro"
}
```

---

## 🎯 Tickers Suportados

### Ações Brasileiras (Preços - BraAPI)
- PETR4, PETR3
- VALE3
- ITUB4, ITUB3
- BBDC4, BBDC3
- ABEV3
- WEGE3
- E muitos outros...

### Ações Brasileiras (Dividendos - Yahoo Finance)
- Mesmo formato, mas com sufixo `.SA` adicionado automaticamente
- Exemplo: PETR4 → PETR4.SA

---

## 🚀 Como Usar

### 1. Iniciar o Servidor

```bash
cd backend
python app.py
```

### 2. Testar no Navegador

```
http://localhost:5000/api/health
http://localhost:5000/api/prices/PETR4?range=7d
http://localhost:5000/api/dividends/PETR4
```

### 3. Testar com cURL

```bash
# Health Check
curl http://localhost:5000/api/health

# Preços
curl "http://localhost:5000/api/prices/PETR4?range=7d"
curl "http://localhost:5000/api/prices/VALE3?range=1m"

# Dividendos
curl http://localhost:5000/api/dividends/PETR4
curl "http://localhost:5000/api/dividends/ITUB4/yield?quantity=100"
```

### 4. Testar com JavaScript (Frontend)

```javascript
// Buscar preços
fetch('http://localhost:5000/api/prices/PETR4?range=7d')
    .then(response => response.json())
    .then(data => console.log(data));

// Buscar dividendos
fetch('http://localhost:5000/api/dividends/PETR4')
    .then(response => response.json())
    .then(data => console.log(data));
```

---

## 📊 Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## 🔐 CORS

A API está configurada para aceitar requisições de qualquer origem (`*`).

Para produção, configure no arquivo `app.py`:
```python
CORS(app, resources={r"/api/*": {"origins": "https://seudominio.com"}})
```

---

## 📚 Documentação Adicional

- [Serviço de Preços (BraAPI)](docs/BRAPI_SERVICE.md)
- [Serviço de Dividendos (Yahoo Finance)](docs/DIVIDENDS_SERVICE.md)
- [Configuração do Supabase](docs/SUPABASE_SETUP.md)

---

**API FinTracker - Versão 1.0.0** 🚀

