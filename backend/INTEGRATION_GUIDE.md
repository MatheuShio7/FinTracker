# 🔗 Guia de Integração - Backend Pronto para a Página Acao

## ✅ Backend Completo e Funcionando

Todo o backend está pronto e testado. Quando você quiser adaptar a página **Acao.jsx** (frontend), basta fazer a integração.

---

## 🎯 Endpoint Principal

**POST** `/api/stocks/<ticker>/view`

Este é o endpoint que a página **Acao.jsx** deve chamar quando o usuário acessar uma ação.

### **Exemplo de Uso:**

```javascript
// Na página Acao.jsx
const response = await fetch(
  `http://localhost:5000/api/stocks/PETR4/view?range=3m`,
  { method: 'POST' }
);

const data = await response.json();
```

### **Parâmetros:**

- **ticker**: Na URL (ex: PETR4, VALE3)
- **range**: Query parameter (padrão: "3m")
  - Aceita: `7d`, `1m`, `3m`

### **Resposta (Sucesso - HTTP 200):**

```json
{
  "status": "success",
  "message": "Dados de PETR4 obtidos com sucesso",
  "timestamp": "2024-10-17T12:30:45",
  "data": {
    "ticker": "PETR4",
    "prices": [
      {"date": "2024-10-09", "price": 30.21},
      {"date": "2024-10-10", "price": 29.94}
    ],
    "dividends": [
      {"payment_date": "2023-06-13", "value": 1.893576},
      {"payment_date": "2023-08-22", "value": 1.149355}
    ],
    "prices_updated": true,
    "dividends_updated": false,
    "timestamp": "2024-10-17T12:30:45"
  }
}
```

### **Resposta (Erro - HTTP 400):**

```json
{
  "status": "error",
  "message": "Ação 'INVALID' não encontrada no banco de dados",
  "timestamp": "2024-10-17T12:30:45",
  "error": "Operation failed"
}
```

---

## 📂 Estrutura do Backend

### **Serviços Disponíveis:**

```
backend/services/
├── orchestration_service.py      → Coordena tudo
├── brapi_price_service.py        → Busca preços (BraAPI)
├── yahoo_dividend_service.py     → Busca dividendos (Yahoo)
├── price_cache_service.py        → Cache de preços (Supabase)
├── dividend_cache_service.py     → Cache de dividendos (Supabase)
├── update_detection_service.py   → Lógica de atualização
└── save_service.py               → Salva no Supabase
```

### **Rotas Disponíveis:**

```
backend/routes/
├── stock_view_routes.py          → Endpoint principal (/api/stocks/<ticker>/view)
├── price_routes.py               → Endpoints de preços diretos
├── dividend_routes.py            → Endpoints de dividendos diretos
└── health_routes.py              → Health check
```

---

## 🔄 Como o Sistema Funciona

### **Fluxo Quando Usuário Acessa a Página:**

```
1. Frontend chama: POST /api/stocks/PETR4/view?range=3m

2. Backend (stock_view_routes.py):
   - Valida ticker e range
   - Chama update_stock_on_page_view(ticker, range)

3. Orquestração (orchestration_service.py):
   - Converte range → dias
   - Busca stock_id no Supabase
   - Verifica cache de preços
     → Se desatualizado: Busca BraAPI → Salva
   - Verifica cache de dividendos
     → Se desatualizado: Busca Yahoo → Salva
   - Retorna dados do cache

4. Frontend recebe:
   - Lista de preços
   - Lista de dividendos
   - Flags: prices_updated, dividends_updated
```

---

## 🛠️ Como Integrar na Página Acao.jsx

### **Passo 1: Extrair Ticker da URL**

```javascript
import { useParams } from 'react-router-dom';

function Acao() {
  const { ticker } = useParams(); // Extrai ticker da URL (/PETR4)
  // ...
}
```

### **Passo 2: Criar Estados**

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedRange, setSelectedRange] = useState('3m');
```

### **Passo 3: Criar Função de Fetch**

```javascript
const fetchStockData = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch(
      `http://localhost:5000/api/stocks/${ticker}/view?range=${selectedRange}`,
      { method: 'POST' }
    );

    const result = await response.json();

    if (result.status === 'success') {
      setData(result.data);
    } else {
      setError(result.message);
    }
  } catch (err) {
    setError(`Erro: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
```

### **Passo 4: Usar useEffect**

```javascript
useEffect(() => {
  if (ticker) {
    fetchStockData();
  }
}, [ticker, selectedRange]);
```

### **Passo 5: Renderizar Dados**

```javascript
// Mostrar loading
if (loading) return <div>Carregando...</div>;

// Mostrar erro
if (error) return <div>Erro: {error}</div>;

// Mostrar dados
return (
  <div>
    <h1>{data.ticker}</h1>
    
    {/* Preços */}
    <div>
      {data.prices.map(price => (
        <div key={price.date}>
          {price.date}: R$ {price.price.toFixed(2)}
        </div>
      ))}
    </div>
    
    {/* Dividendos */}
    <div>
      {data.dividends.map(div => (
        <div key={div.payment_date}>
          {div.payment_date}: R$ {div.value.toFixed(2)}
        </div>
      ))}
    </div>
  </div>
);
```

---

## 📊 Dados Disponíveis

### **data.ticker**
- Tipo: `string`
- Exemplo: `"PETR4"`

### **data.prices**
- Tipo: `Array<{date: string, price: number}>`
- Exemplo:
```javascript
[
  {date: "2024-10-09", price: 30.21},
  {date: "2024-10-10", price: 29.94}
]
```

### **data.dividends**
- Tipo: `Array<{payment_date: string, value: number}>`
- Exemplo:
```javascript
[
  {payment_date: "2023-06-13", value: 1.893576},
  {payment_date: "2023-08-22", value: 1.149355}
]
```

### **data.prices_updated**
- Tipo: `boolean`
- `true`: Preços foram atualizados nesta requisição
- `false`: Preços vieram do cache

### **data.dividends_updated**
- Tipo: `boolean`
- `true`: Dividendos foram atualizados nesta requisição
- `false`: Dividendos vieram do cache

### **data.timestamp**
- Tipo: `string` (ISO format)
- Exemplo: `"2024-10-17T12:30:45.123456"`

---

## 🧪 Testar o Backend

### **1. Certifique-se que o servidor está rodando:**

```bash
cd backend
python app.py
```

### **2. Teste com cURL:**

```bash
curl -X POST "http://localhost:5000/api/stocks/PETR4/view?range=3m"
```

### **3. Teste no navegador:**

Abra o DevTools (F12) e execute no Console:

```javascript
fetch('http://localhost:5000/api/stocks/PETR4/view?range=3m', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 📝 Endpoints Adicionais (Opcionais)

Além do endpoint principal, há outros disponíveis:

### **Buscar apenas preços:**
```
GET /api/prices/PETR4?range=7d
```

### **Buscar apenas dividendos:**
```
GET /api/dividends/PETR4
```

### **Health check:**
```
GET /api/health
```

---

## 🎯 Exemplo Completo de Integração

```javascript
// Acao.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function Acao() {
  const { ticker } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/stocks/${ticker}/view?range=3m`,
          { method: 'POST' }
        );
        const result = await response.json();
        
        if (result.status === 'success') {
          setData(result.data);
        }
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  if (loading) return <div>Carregando...</div>;
  if (!data) return <div>Erro ao carregar</div>;

  return (
    <div>
      <h1>{data.ticker}</h1>
      <p>Preços: {data.prices.length}</p>
      <p>Dividendos: {data.dividends.length}</p>
    </div>
  );
}

export default Acao;
```

---

## 🚀 Backend Está Pronto!

**Tudo que você precisa fazer:**
1. Adaptar a página **Acao.jsx** para chamar o endpoint
2. Renderizar os dados retornados

**O backend cuida de:**
- ✅ Cache inteligente
- ✅ Atualização automática quando necessário
- ✅ Busca de APIs externas (BraAPI, Yahoo)
- ✅ Salvamento no Supabase
- ✅ Tratamento de erros
- ✅ Logs detalhados

---

## 📚 Documentação Adicional

- **Serviço de Preços:** `backend/docs/BRAPI_SERVICE.md`
- **Serviço de Dividendos:** `backend/docs/DIVIDENDS_SERVICE.md`
- **Configuração Supabase:** `backend/docs/SUPABASE_SETUP.md`
- **Todos os Endpoints:** `backend/API_ENDPOINTS.md`

---

**Backend pronto para integração! 🎉**

