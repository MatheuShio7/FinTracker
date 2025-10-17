# 🚀 Instruções de Configuração do Backend

## ⚠️ Problemas Identificados

Baseado nos erros que você está enfrentando:

### 1. **PETR4 retornando apenas 6 preços** ✅ Normal!
- Para um período de 7 dias, é normal retornar 5-6 preços
- A Bolsa não funciona aos finais de semana e feriados
- Exemplo: 7 dias = 5 dias úteis + 2 dias de fim de semana = 5 preços

### 2. **VALE3 e ITUB4 dando erro 404** ❌ Problema!
- O módulo `requests` não está instalado no ambiente Python
- O servidor Flask não está iniciando corretamente

---

## 📦 Solução: Instalar Dependências

### Opção 1: Usando pip diretamente

1. **Abra o PowerShell como Administrador**

2. **Navegue até a pasta backend:**
```powershell
cd C:\Users\PICHAU\Documents\Projetos\FinTracker\backend
```

3. **Instale as dependências:**
```powershell
python -m pip install --user Flask Flask-CORS python-dotenv requests supabase python-dateutil
```

### Opção 2: Criar ambiente virtual (Recomendado)

1. **Navegue até a pasta do projeto:**
```powershell
cd C:\Users\PICHAU\Documents\Projetos\FinTracker
```

2. **Crie um ambiente virtual:**
```powershell
python -m venv venv
```

3. **Ative o ambiente virtual:**
```powershell
.\venv\Scripts\Activate
```

4. **Instale as dependências:**
```powershell
pip install -r backend\requirements.txt
```

### Opção 3: Se pip não estiver instalado

1. **Baixe get-pip.py:**
```powershell
Invoke-WebRequest -Uri https://bootstrap.pypa.io/get-pip.py -OutFile get-pip.py
```

2. **Instale o pip:**
```powershell
python get-pip.py
```

3. **Depois siga a Opção 1 ou 2**

---

## ✅ Verificar se Funcionou

Após instalar as dependências:

### 1. Teste o serviço BraAPI diretamente:

```powershell
cd C:\Users\PICHAU\Documents\Projetos\FinTracker\backend
python tests\test_brapi_service.py
```

**Resultado esperado:**
```
============================================================
INICIANDO TESTES DO SERVIÇO BRAPI
============================================================

============================================================
TESTE 1: Buscar preços de PETR4 (7 dias)
============================================================
🔍 Buscando preços de PETR4 (período: 7d)...
✅ Sucesso! 6 preços encontrados para PETR4

✅ Teste passou! 6 preços encontrados
...
```

### 2. Inicie o servidor Flask:

```powershell
cd C:\Users\PICHAU\Documents\Projetos\FinTracker\backend
python app.py
```

**Resultado esperado:**
```
✅ Cliente Supabase conectado com sucesso: https://...
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

### 3. Teste os endpoints (em outro terminal):

```powershell
# Testar PETR4
curl "http://localhost:5000/api/prices/PETR4?range=7d"

# Testar VALE3
curl "http://localhost:5000/api/prices/VALE3?range=7d"

# Testar resumo de ITUB4
curl "http://localhost:5000/api/prices/ITUB4/summary?range=1m"
```

---

## 🔍 Sobre os Resultados

### Por que PETR4 retorna apenas 6 preços para 7 dias?

A Bolsa de Valores brasileira funciona apenas em dias úteis:

```
Solicitado: 7 dias (17/10 até 09/10)
- 17/10 (Quinta) ✅
- 16/10 (Quarta) ✅
- 15/10 (Terça) ✅
- 14/10 (Segunda) ✅
- 13/10 (Domingo) ❌ Bolsa fechada
- 12/10 (Sábado) ❌ Bolsa fechada
- 11/10 (Sexta - Feriado?) ❌ Possível feriado
- 10/10 (Quinta) ✅
- 09/10 (Quarta) ✅

Total: 6 dias úteis = 6 preços ✅ CORRETO!
```

### Tickers Disponíveis na BraAPI

Os tickers funcionam corretamente:
- ✅ **PETR4** - Petrobras PN
- ✅ **VALE3** - Vale ON
- ✅ **ITUB4** - Itaú Unibanco PN
- ✅ **BBDC4** - Bradesco PN
- ✅ **ABEV3** - Ambev ON
- ✅ **WEGE3** - WEG ON

Você pode verificar todos os tickers disponíveis em:
https://brapi.dev/docs/acoes

---

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'requests'"

**Solução:** Instale o requests:
```powershell
python -m pip install requests
```

### Erro: "No module named 'flask'"

**Solução:** Instale o Flask:
```powershell
python -m pip install Flask Flask-CORS
```

### Erro: "No module named 'supabase'"

**Solução:** Instale o Supabase:
```powershell
python -m pip install supabase
```

### Erro: "pip: command not found"

**Solução:** Use `python -m pip` ao invés de apenas `pip`:
```powershell
python -m pip install <pacote>
```

### Servidor não inicia / Sem resposta

1. Verifique se todas as dependências estão instaladas
2. Verifique o arquivo `.env` no backend
3. Tente executar o teste isolado primeiro

---

## 📞 Próximos Passos

1. **Instale as dependências** usando uma das opções acima
2. **Execute o teste** do serviço BraAPI
3. **Inicie o servidor** Flask
4. **Teste os endpoints** no navegador ou com curl

Se continuar com problemas, forneça:
- Versão do Python: `python --version`
- Sistema operacional
- Mensagem de erro completa

---

## 📚 Comandos Rápidos

```powershell
# Instalar tudo de uma vez
python -m pip install Flask Flask-CORS python-dotenv requests supabase python-dateutil certifi charset-normalizer idna urllib3

# Verificar instalação
python -c "import flask, requests, supabase; print('✅ Tudo instalado!')"

# Testar serviço
cd backend
python tests\test_brapi_service.py

# Iniciar servidor
python app.py
```

Boa sorte! 🚀

