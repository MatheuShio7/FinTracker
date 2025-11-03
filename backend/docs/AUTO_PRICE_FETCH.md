# Auto Busca de Preços ao Adicionar Ação à Carteira

## 🎯 Problema Resolvido
Quando o usuário adicionava uma ação à carteira que nunca havia sido acessada antes, o valor aparecia como "N/A" na tabela da carteira porque não havia dados na tabela `stock_prices`.

## ✅ Solução Implementada

### Nova Função: `ensure_stock_price()`
Criada em `backend/services/portfolio_service.py`

**O que faz:**
1. Verifica se a ação já tem preço recente no banco (últimos 7 dias)
2. Se sim: não faz nada (retorna True)
3. Se não: 
   - Busca preços da BraAPI (últimos 7 dias)
   - Salva os preços no banco
   - Retorna True/False baseado no sucesso

**Código:**
```python
def ensure_stock_price(stock_id, ticker):
    """
    Garante que a ação tenha preço recente no banco de dados.
    Se não tiver, busca da BraAPI e salva.
    """
    try:
        from services.brapi_price_service import fetch_prices_from_brapi
        from services.save_service import save_prices
        
        supabase = get_supabase_client()
        
        # Verificar se já tem preço recente (últimos 7 dias)
        seven_days_ago = (datetime.now() - timedelta(days=7)).date().isoformat()
        
        price_check = supabase.table('stock_prices')\
            .select('date, price')\
            .eq('stock_id', stock_id)\
            .gte('date', seven_days_ago)\
            .order('date', desc=True)\
            .limit(1)\
            .execute()
        
        if price_check.data and len(price_check.data) > 0:
            print(f"[INFO] {ticker} já tem preço recente no banco")
            return True
        
        # Não tem preço recente - buscar da BraAPI
        print(f"[INFO] {ticker} sem preço recente, buscando da BraAPI...")
        prices = fetch_prices_from_brapi(ticker, range_period="7d")
        
        if not prices or len(prices) == 0:
            print(f"[AVISO] Não foi possível buscar preços para {ticker}")
            return False
        
        # Salvar preços no banco
        saved_count = save_prices(stock_id, prices)
        
        if saved_count > 0:
            print(f"[OK] {saved_count} preços salvos para {ticker}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"[ERRO] Erro ao garantir preço para {ticker}: {str(e)}")
        return False
```

### Funções Modificadas

#### 1. `add_to_portfolio(user_id, ticker, quantity)`
**Mudança:** Após adicionar/atualizar ação na carteira, chama `ensure_stock_price()`

**Antes:**
```python
supabase.table('user_portfolio').insert({
    'user_id': user_id,
    'stock_id': stock_id,
    'quantity': quantity
}).execute()

return {
    "success": True,
    "message": "Ação adicionada à carteira!"
}
```

**Depois:**
```python
supabase.table('user_portfolio').insert({
    'user_id': user_id,
    'stock_id': stock_id,
    'quantity': quantity
}).execute()

# Garantir que tem preço recente
ensure_stock_price(stock_id, ticker)

return {
    "success": True,
    "message": "Ação adicionada à carteira!"
}
```

#### 2. `update_stock_quantity(user_id, ticker, quantity)`
**Mudança:** Mesma lógica - ao adicionar/atualizar, garante preço recente

Ambos os casos (UPDATE e INSERT) agora chamam `ensure_stock_price()`.

## 🔄 Fluxo Completo

### Cenário 1: Usuário Adiciona Ação pela Primeira Vez
```
1. Usuário clica em "Adicionar à Carteira" (SearchBar ou StockEditor)
2. Frontend: POST /api/portfolio/add
3. Backend: add_to_portfolio() executa:
   a) Adiciona ação na tabela user_portfolio ✓
   b) Chama ensure_stock_price()
   c) Verifica: há preço recente? NÃO
   d) Busca preços da BraAPI (7 dias)
   e) Salva no banco (stock_prices)
4. Responde ao frontend: "Ação adicionada!"
5. Frontend atualiza cache do PortfolioContext
6. PortfolioTable detecta mudança e recarrega
7. GET /api/portfolio/full agora retorna preço ✓
8. Usuário vê valor correto ao invés de "N/A"
```

### Cenário 2: Usuário Adiciona Ação que Já Tem Preço Recente
```
1. Usuário clica em "Adicionar à Carteira"
2. Backend: add_to_portfolio() executa:
   a) Adiciona ação na tabela user_portfolio ✓
   b) Chama ensure_stock_price()
   c) Verifica: há preço recente? SIM (últimos 7 dias)
   d) Não faz nada, retorna True
3. Responde imediatamente: "Ação adicionada!"
4. PortfolioTable já mostra valor correto
```

### Cenário 3: Usuário Atualiza Quantidade via StockEditor
```
1. Usuário digita nova quantidade e clica "Salvar"
2. Frontend: POST /api/portfolio/update-quantity
3. Backend: update_stock_quantity() executa:
   a) Atualiza quantidade (ou insere se não existe)
   b) Chama ensure_stock_price()
   c) Garante que há preço recente
4. PortfolioTable atualiza com valor correto
```

## 📊 Vantagens da Implementação

### ✅ Otimização Inteligente
- **Cache eficiente**: Só busca da API se não tiver preço nos últimos 7 dias
- **Não duplica requisições**: Se já tem preço, não faz nova requisição
- **Performance**: Verificação rápida no banco antes de chamar API externa

### ✅ Experiência do Usuário
- **Sem "N/A" inesperados**: Valor sempre disponível
- **Transparente**: Usuário não percebe a busca acontecendo
- **Imediato**: Quando busca API, responde mesmo assim (não bloqueia)

### ✅ Uso Eficiente da API
- **Busca apenas 7 dias**: Não desperdiça quota da BraAPI
- **UPSERT inteligente**: save_prices() evita duplicatas
- **Logs claros**: Console mostra quando busca ou usa cache

## 🔍 Logs de Debug

Quando a função é executada, você verá logs assim:

### Caso 1: Já tem preço recente (CACHE HIT)
```
[INFO] PETR4 já tem preço recente no banco: 2024-01-15
```

### Caso 2: Precisa buscar (CACHE MISS)
```
[INFO] VALE3 sem preço recente, buscando da BraAPI...
[INFO] Buscando preços de VALE3 (período: 7d -> 7d)...
[OK] Sucesso! 7 preços encontrados para VALE3
[INFO] Salvando 7 preços para stock_id=abc-123...
[OK] 7 preços salvos para VALE3
```

### Caso 3: Erro na busca
```
[INFO] ITUB4 sem preço recente, buscando da BraAPI...
[AVISO] Não foi possível buscar preços para ITUB4
[AVISO] Nenhum preço foi salvo para ITUB4
```

## 🧪 Como Testar

### Teste 1: Adicionar Ação Nova
1. Identificar ação que nunca foi acessada (ex: EMBR3)
2. Na página Explorar, buscar EMBR3
3. Clicar no ícone da carteira
4. Acessar página Carteira
5. **Resultado esperado**: Valor aparece normalmente (não "N/A")

### Teste 2: Adicionar Ação que Já Tem Preço
1. Identificar ação já acessada antes (ex: PETR4)
2. Adicionar à carteira
3. Verificar logs do backend
4. **Resultado esperado**: Log mostra "já tem preço recente no banco"

### Teste 3: Via StockEditor
1. Acessar página de uma ação nova (ex: /WEGE3)
2. Digitar quantidade e clicar "Adicionar"
3. Acessar página Carteira
4. **Resultado esperado**: WEGE3 aparece com valor correto

## ⚙️ Configuração

### Pré-requisitos
- Token da BraAPI configurado em `.env`:
  ```
  BRAPI_TOKEN=seu_token_aqui
  ```
- Obter token em: https://brapi.dev/dashboard

### Dependências
A função usa serviços existentes:
- `brapi_price_service.fetch_prices_from_brapi()` - Busca preços
- `save_service.save_prices()` - Salva no banco
- `supabase_config.get_supabase_client()` - Cliente Supabase

## 🚨 Tratamento de Erros

### Erro na BraAPI (ex: limite de requisições)
- Função retorna False
- Usuário vê "N/A" temporariamente
- Próxima vez que adicionar ação tentará novamente

### Erro no Supabase (ex: falha ao salvar)
- Função retorna False
- Log registra erro
- Não impede adição à carteira (catch do try)

### Ação não existe na BraAPI
- API retorna 404
- Função retorna False
- Carteira é adicionada, mas sem preço

## 📝 Notas Técnicas

### Thread Blocking
A função é **síncrona** e bloqueia a thread até completar. Isso é intencional porque:
1. Busca de 7 dias é rápida (< 2s normalmente)
2. Usuário já espera alguns segundos ao adicionar ação
3. Garante que próximo GET /portfolio/full terá dados

### Período de Cache (7 dias)
Escolhido 7 dias porque:
- Cobre uma semana de negociação completa
- Preços de 7 dias atrás ainda são úteis
- Reduz requisições desnecessárias à API

### UPSERT no save_prices()
A função `save_prices()` já tem lógica de UPSERT:
- Se preço já existe: atualiza
- Se não existe: insere
- Não cria duplicatas

## 🎉 Resultado Final

**Antes:**
- Usuário adiciona ação nova → Valor = "N/A"
- Usuário precisa acessar página da ação primeiro
- Experiência confusa

**Depois:**
- Usuário adiciona ação nova → Valor aparece automaticamente
- Sistema busca preço em background
- Experiência fluida e intuitiva

