# 💰 Guia do Serviço de Dividendos - Yahoo Finance

Este guia explica como usar o serviço de dividendos de ações usando o Yahoo Finance.

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Uso do Serviço](#uso-do-serviço)
3. [Endpoints da API](#endpoints-da-api)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Tratamento de Erros](#tratamento-de-erros)

---

## 🔧 Visão Geral

O serviço de dividendos utiliza a biblioteca `yfinance` para buscar históricos de dividendos de ações brasileiras diretamente do Yahoo Finance.

### Características:

- ✅ Busca histórico dos **últimos 12 dividendos**
- ✅ Adiciona automaticamente o sufixo `.SA` para ações brasileiras
- ✅ Filtra apenas dividendos com valor > 0
- ✅ Calcula resumos estatísticos (total pago, média, último pagamento)
- ✅ Calcula dividend yield estimado
- ✅ Tratamento robusto de erros

### Estrutura de Arquivos

```
backend/
├── services/
│   └── yahoo_dividend_service.py    # ✅ Serviço principal
│
└── routes/
    └── dividend_routes.py            # ✅ Rotas da API
```

---

## 💡 Uso do Serviço

### Importar o Serviço

```python
from services.yahoo_dividend_service import (
    fetch_dividends_from_yahoo,
    get_dividend_summary,
    calculate_dividend_yield
)
```

### Função: `fetch_dividends_from_yahoo()`

Busca o histórico de dividendos de uma ação.

**Parâmetros:**
- `ticker` (str): Código da ação (ex: "PETR4", "VALE3")
  - O sufixo ".SA" é adicionado automaticamente

**Retorna:**
```python
[
    {"payment_date": "2024-03-30", "value": 1.25},
    {"payment_date": "2024-06-28", "value": 1.30},
    ...
]
```

- Retorna `[]` (lista vazia) se não houver dividendos
- Retorna `None` se o ticker for inválido

**Exemplo:**
```python
from services.yahoo_dividend_service import fetch_dividends_from_yahoo

# Buscar últimos 12 dividendos
dividends = fetch_dividends_from_yahoo("PETR4")

if dividends is None:
    print("Ticker inválido")
elif dividends:
    for div in dividends:
        print(f"{div['payment_date']}: R$ {div['value']:.2f}")
else:
    print("Sem dividendos")
```

### Função: `get_dividend_summary()`

Retorna um resumo estatístico dos dividendos.

**Parâmetros:**
- `ticker` (str): Código da ação

**Retorna:**
```python
{
    "ticker": "PETR4",
    "total_dividends": 12,
    "total_paid": 15.30,
    "avg_value": 1.28,
    "last_payment": "2024-06-28",
    "last_value": 1.30,
    "dividends": [...]
}
```

**Exemplo:**
```python
from services.yahoo_dividend_service import get_dividend_summary

summary = get_dividend_summary("VALE3")

if summary:
    print(f"Total pago: R$ {summary['total_paid']:.2f}")
    print(f"Média: R$ {summary['avg_value']:.2f}")
```

### Função: `calculate_dividend_yield()`

Calcula o dividend yield estimado baseado nos últimos 12 dividendos.

**Parâmetros:**
- `ticker` (str): Código da ação
- `quantity` (int): Quantidade de ações

**Retorna:**
```python
{
    "ticker": "ITUB4",
    "quantity": 100,
    "dividends_per_share": 2.29,
    "estimated_annual_income": 229.35,
    "current_price": 37.36,
    "dividend_yield_percent": 6.14,
    "base_period": "últimos 12 dividendos"
}
```

**Exemplo:**
```python
from services.yahoo_dividend_service import calculate_dividend_yield

result = calculate_dividend_yield("ITUB4", 100)

if result:
    print(f"Receita anual estimada: R$ {result['estimated_annual_income']:.2f}")
    print(f"Dividend Yield: {result['dividend_yield_percent']:.2f}%")
```

---

## 🛣️ Endpoints da API

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
    "timestamp": "2025-10-17T00:54:37",
    "data": {
        "ticker": "PETR4",
        "count": 12,
        "dividends": [
            {
                "payment_date": "2023-06-13",
                "value": 1.893576
            },
            {
                "payment_date": "2023-08-22",
                "value": 1.149355
            },
            {
                "payment_date": "2023-11-27",
                "value": 1.568602
            },
            ...
        ]
    }
}
```

### 2. Obter Resumo de Dividendos

**GET** `/api/dividends/<ticker>/summary`

Retorna um resumo estatístico dos dividendos.

**Exemplo:**
```bash
curl "http://localhost:5000/api/dividends/VALE3/summary"
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Resumo de dividendos de VALE3 obtido com sucesso",
    "timestamp": "2025-10-17T00:55:13",
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
    "timestamp": "2025-10-17T00:55:23",
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

### 4. Testar Serviço

**GET** `/api/dividends/test`

Testa se o serviço está funcionando corretamente.

**Exemplo:**
```bash
curl "http://localhost:5000/api/dividends/test"
```

---

## 📚 Exemplos de Uso

### Exemplo 1: Usar em uma Rota Flask

```python
from flask import Blueprint, jsonify
from services.yahoo_dividend_service import fetch_dividends_from_yahoo

bp = Blueprint('portfolio', __name__)

@bp.route('/portfolio/dividends/<ticker>')
def get_portfolio_dividends(ticker):
    dividends = fetch_dividends_from_yahoo(ticker)
    
    if dividends is None:
        return jsonify({'error': 'Ticker inválido'}), 404
    
    return jsonify({'dividends': dividends}), 200
```

### Exemplo 2: Calcular Receita de Portfólio

```python
from services.yahoo_dividend_service import calculate_dividend_yield

def calculate_portfolio_income(stocks):
    """
    Calcula receita estimada de dividendos do portfólio
    
    Args:
        stocks: [{"ticker": "PETR4", "quantity": 100}, ...]
    """
    total_income = 0
    
    for stock in stocks:
        result = calculate_dividend_yield(stock['ticker'], stock['quantity'])
        if result:
            total_income += result['estimated_annual_income']
    
    return total_income

# Exemplo de uso
portfolio = [
    {"ticker": "PETR4", "quantity": 100},
    {"ticker": "VALE3", "quantity": 50},
    {"ticker": "ITUB4", "quantity": 200}
]

total = calculate_portfolio_income(portfolio)
print(f"Receita anual estimada: R$ {total:.2f}")
```

### Exemplo 3: Comparar Dividend Yield

```python
from services.yahoo_dividend_service import calculate_dividend_yield

def compare_dividend_yields(tickers):
    """Compara dividend yield de várias ações"""
    results = []
    
    for ticker in tickers:
        result = calculate_dividend_yield(ticker, 1)
        if result:
            results.append({
                'ticker': ticker,
                'yield': result['dividend_yield_percent']
            })
    
    # Ordena por yield (maior para menor)
    results.sort(key=lambda x: x['yield'], reverse=True)
    
    return results

# Exemplo
tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4"]
ranking = compare_dividend_yields(tickers)

for i, item in enumerate(ranking, 1):
    print(f"{i}. {item['ticker']}: {item['yield']:.2f}%")
```

---

## 🛡️ Tratamento de Erros

O serviço trata os seguintes erros:

### 1. Ticker Inválido / Não Encontrado
```python
dividends = fetch_dividends_from_yahoo("INVALID")
# Retorna: None
```

**Resposta da API:**
```json
{
    "status": "error",
    "message": "Ticker não encontrado",
    "details": "O ticker 'INVALID' não foi encontrado no Yahoo Finance"
}
```

### 2. Sem Dividendos
```python
dividends = fetch_dividends_from_yahoo("ACAO_SEM_DIVIDENDOS")
# Retorna: []
```

**Resposta da API:**
```json
{
    "status": "success",
    "data": {
        "ticker": "ACAO",
        "dividends": [],
        "count": 0,
        "message": "Nenhum dividendo encontrado para esta ação"
    }
}
```

### 3. TypeError / KeyError
```
[ERRO] Erro de tipo ao buscar dados de TICKER
Detalhes: ...
```

### 4. Quantidade Inválida (endpoint /yield)
```json
{
    "status": "error",
    "message": "Quantidade inválida",
    "details": "A quantidade deve ser maior que 0"
}
```

---

## 📝 Notas Importantes

1. **Sufixo .SA**: Adicionado automaticamente para ações brasileiras
2. **Últimos 12 Dividendos**: Apenas os 12 mais recentes são retornados
3. **Filtro de Valores**: Apenas dividendos > 0 são incluídos
4. **Dividend Yield**: Estimativa baseada nos últimos 12 dividendos (não necessariamente 12 meses)
5. **Preço Atual**: Obtido do Yahoo Finance no momento da requisição
6. **Formato de Data**: ISO 8601 (YYYY-MM-DD)
7. **Moeda**: Todos os valores são em Reais (R$)

---

## 🎯 Tickers Brasileiros Comuns

| Ticker | Empresa | Setor |
|--------|---------|-------|
| PETR4 | Petrobras PN | Petróleo |
| VALE3 | Vale ON | Mineração |
| ITUB4 | Itaú Unibanco PN | Bancário |
| BBDC4 | Bradesco PN | Bancário |
| ABEV3 | Ambev ON | Bebidas |
| WEGE3 | WEG ON | Máquinas |
| TAEE11 | Taesa Units | Energia |
| BBSE3 | BB Seguridade ON | Seguros |

---

## 🔗 Links Úteis

- [Yahoo Finance](https://finance.yahoo.com)
- [yfinance Documentation](https://github.com/ranaroussi/yfinance)
- [B3 - Bolsa de Valores](https://www.b3.com.br)

---

Pronto! Agora você pode consultar dividendos de ações brasileiras facilmente! 💰📈

