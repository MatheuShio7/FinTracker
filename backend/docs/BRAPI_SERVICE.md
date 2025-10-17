# 📊 Guia do Serviço BraAPI - Preços de Ações

Este guia explica como usar o serviço de preços de ações usando a BraAPI.

## 📋 Índice
1. [Configuração](#configuração)
2. [Uso do Serviço](#uso-do-serviço)
3. [Endpoints da API](#endpoints-da-api)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Tratamento de Erros](#tratamento-de-erros)

---

## 🔧 Configuração

### 1. Token da BraAPI

O serviço usa o token da BraAPI configurado no arquivo `.env`:

```env
BRAPI_TOKEN=fuHtHs3Lr2iC1HShnRAWUY
```

**Como obter seu token:**
1. Acesse [BraAPI Dashboard](https://brapi.dev/dashboard)
2. Faça login ou crie uma conta
3. Copie seu token da seção "API Token"
4. Adicione ao arquivo `.env`

### 2. Estrutura de Arquivos

```
backend/
├── services/
│   └── brapi_price_service.py    # ✅ Serviço principal
│
├── routes/
│   └── price_routes.py            # ✅ Rotas da API
│
└── tests/
    └── test_brapi_service.py      # ✅ Testes
```

---

## 💡 Uso do Serviço

### Importar o Serviço

```python
from services.brapi_price_service import fetch_prices_from_brapi, get_price_summary
```

### Função: `fetch_prices_from_brapi()`

Busca o histórico de preços de uma ação.

**Parâmetros:**
- `ticker` (str): Código da ação (ex: "PETR4", "VALE3")
- `range_period` (str): Período do histórico (padrão: "3m")
  - `"7d"`: 7 dias
  - `"1m"`: 1 mês
  - `"3m"`: 3 meses
  - `"6m"`: 6 meses
  - `"1y"`: 1 ano
  - `"5y"`: 5 anos

**Retorna:**
```python
[
    {"date": "2024-01-15", "price": 28.50},
    {"date": "2024-01-16", "price": 28.75},
    ...
]
```

Retorna `None` em caso de erro.

**Exemplo:**
```python
from services.brapi_price_service import fetch_prices_from_brapi

# Buscar preços dos últimos 7 dias
prices = fetch_prices_from_brapi("PETR4", "7d")

if prices:
    for item in prices:
        print(f"{item['date']}: R$ {item['price']:.2f}")
else:
    print("Erro ao buscar preços")
```

### Função: `get_price_summary()`

Retorna um resumo estatístico dos preços.

**Parâmetros:**
- `ticker` (str): Código da ação
- `range_period` (str): Período do histórico

**Retorna:**
```python
{
    "ticker": "PETR4",
    "current_price": 28.75,
    "first_price": 27.50,
    "variation": 1.25,
    "variation_percent": 4.55,
    "max_price": 29.00,
    "min_price": 27.50,
    "avg_price": 28.30,
    "data_points": 7,
    "period": "7d",
    "last_update": "2024-01-16"
}
```

**Exemplo:**
```python
from services.brapi_price_service import get_price_summary

summary = get_price_summary("VALE3", "1m")

if summary:
    print(f"Preço atual: R$ {summary['current_price']:.2f}")
    print(f"Variação: {summary['variation_percent']:.2f}%")
```

---

## 🛣️ Endpoints da API

### 1. Buscar Histórico de Preços

**GET** `/api/prices/<ticker>`

Query Parameters:
- `range` (opcional): Período do histórico (padrão: "3m")

**Exemplo:**
```bash
curl "http://localhost:5000/api/prices/PETR4?range=7d"
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Preços de PETR4 obtidos com sucesso",
    "timestamp": "2024-01-16T10:30:00",
    "data": {
        "ticker": "PETR4",
        "period": "7d",
        "count": 7,
        "prices": [
            {"date": "2024-01-10", "price": 27.50},
            {"date": "2024-01-11", "price": 27.80},
            {"date": "2024-01-12", "price": 28.00},
            {"date": "2024-01-13", "price": 28.20},
            {"date": "2024-01-14", "price": 28.50},
            {"date": "2024-01-15", "price": 28.75},
            {"date": "2024-01-16", "price": 29.00}
        ]
    }
}
```

### 2. Obter Resumo Estatístico

**GET** `/api/prices/<ticker>/summary`

Query Parameters:
- `range` (opcional): Período do histórico (padrão: "3m")

**Exemplo:**
```bash
curl "http://localhost:5000/api/prices/VALE3/summary?range=1m"
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Resumo de VALE3 obtido com sucesso",
    "timestamp": "2024-01-16T10:30:00",
    "data": {
        "ticker": "VALE3",
        "current_price": 65.50,
        "first_price": 62.30,
        "variation": 3.20,
        "variation_percent": 5.14,
        "max_price": 66.00,
        "min_price": 62.00,
        "avg_price": 64.10,
        "data_points": 22,
        "period": "1m",
        "last_update": "2024-01-16"
    }
}
```

### 3. Testar Serviço

**GET** `/api/prices/test`

Testa se o serviço está funcionando corretamente.

**Exemplo:**
```bash
curl "http://localhost:5000/api/prices/test"
```

---

## 📚 Exemplos de Uso

### Exemplo 1: Usar em uma Rota Flask

```python
from flask import Blueprint, jsonify
from services.brapi_price_service import fetch_prices_from_brapi

bp = Blueprint('portfolio', __name__)

@bp.route('/portfolio/stock/<ticker>')
def get_stock_data(ticker):
    prices = fetch_prices_from_brapi(ticker, "1m")
    
    if prices:
        return jsonify({
            'ticker': ticker,
            'prices': prices
        }), 200
    else:
        return jsonify({'error': 'Não foi possível buscar preços'}), 404
```

### Exemplo 2: Usar em um Serviço

```python
from services.brapi_price_service import fetch_prices_from_brapi, get_price_summary

class PortfolioService:
    def calculate_portfolio_value(self, stocks):
        """
        Calcula o valor total de um portfólio
        
        Args:
            stocks: [{"ticker": "PETR4", "quantity": 100}, ...]
        """
        total_value = 0
        
        for stock in stocks:
            summary = get_price_summary(stock['ticker'], "1d")
            if summary:
                current_price = summary['current_price']
                quantity = stock['quantity']
                total_value += current_price * quantity
        
        return total_value
```

### Exemplo 3: Script Standalone

```python
#!/usr/bin/env python
"""Script para monitorar preços de ações"""

from services.brapi_price_service import get_price_summary

def monitor_stocks(tickers):
    """Monitora uma lista de ações"""
    print("\n📊 Monitor de Ações\n")
    
    for ticker in tickers:
        summary = get_price_summary(ticker, "1d")
        
        if summary:
            print(f"{ticker}:")
            print(f"  Preço: R$ {summary['current_price']:.2f}")
            print(f"  Variação: {summary['variation_percent']:+.2f}%")
            print()

if __name__ == "__main__":
    monitor_stocks(["PETR4", "VALE3", "ITUB4", "BBDC4"])
```

---

## 🛡️ Tratamento de Erros

O serviço trata os seguintes erros:

### 1. Erro 401 - Token Inválido
```
❌ ERRO 401: Token inválido ou ausente
Verifique seu token em: https://brapi.dev/dashboard
```

**Solução:** Verifique se o `BRAPI_TOKEN` no `.env` está correto.

### 2. Erro 402 - Limite Excedido
```
❌ ERRO 402: Limite de requisições excedido
Seu plano atingiu o limite de requisições
```

**Solução:** Aguarde o reset do limite ou faça upgrade do plano.

### 3. Erro 404 - Ticker Não Encontrado
```
❌ ERRO 404: Ação 'INVALID' não encontrada
Verifique se o ticker está correto
```

**Solução:** Verifique o código do ticker (ex: PETR4, VALE3).

### 4. Erro 429 - Muitas Requisições
```
❌ ERRO 429: Muitas requisições
Aguarde alguns instantes antes de tentar novamente
```

**Solução:** Implemente rate limiting ou aguarde.

### 5. Timeout
```
❌ ERRO: Timeout na requisição
A API demorou muito para responder
```

**Solução:** Tente novamente ou verifique sua conexão.

### 6. Erro de Conexão
```
❌ ERRO: Falha na conexão
Verifique sua conexão com a internet
```

**Solução:** Verifique sua conexão de rede.

---

## 🧪 Testando o Serviço

### Executar Testes

```bash
cd backend
python tests/test_brapi_service.py
```

### Testar via API

```bash
# Testar o serviço
curl http://localhost:5000/api/prices/test

# Buscar preços de PETR4
curl "http://localhost:5000/api/prices/PETR4?range=7d"

# Buscar resumo de VALE3
curl "http://localhost:5000/api/prices/VALE3/summary?range=1m"
```

---

## 📝 Notas Importantes

1. **Rate Limiting:** A BraAPI tem limites de requisições por plano
2. **Cache:** Considere implementar cache para reduzir requisições
3. **Horário de Mercado:** Preços são atualizados apenas em dias úteis
4. **Formato de Data:** Todas as datas são no formato ISO (YYYY-MM-DD)
5. **Moeda:** Todos os preços são em Reais (R$)

---

## 🔗 Links Úteis

- [BraAPI Documentação](https://brapi.dev/docs)
- [BraAPI Dashboard](https://brapi.dev/dashboard)
- [Lista de Tickers Disponíveis](https://brapi.dev/docs/acoes)

---

Pronto! Agora você pode usar o serviço de preços em seu backend Flask! 🚀

