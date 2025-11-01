# Configuração de Variáveis de Ambiente - Frontend

## Visão Geral

O frontend agora utiliza variáveis de ambiente para configurar a conexão com o backend, permitindo maior flexibilidade entre diferentes ambientes (desenvolvimento, produção, etc.).

## Configuração

### 1. Arquivo .env

Crie um arquivo `.env` na raiz do diretório `frontend/` com as seguintes variáveis:

```env
# Configurações do Backend
VITE_BACKEND_PORT=5001
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PROTOCOL=http
```

### 2. Variáveis Disponíveis

- `VITE_BACKEND_PORT`: Porta onde o backend está rodando (padrão: 5001)
- `VITE_BACKEND_HOST`: Host do backend (padrão: localhost)
- `VITE_BACKEND_PROTOCOL`: Protocolo usado (padrão: http)

### 3. Arquivo de Exemplo

Um arquivo `.env.example` está disponível como referência. Para usar:

```bash
cp .env.example .env
```

## Implementação

### Arquivo de Configuração

O arquivo `src/config/api.js` centraliza a configuração da API:

```javascript
// Configuração da API
const API_CONFIG = {
  protocol: import.meta.env.VITE_BACKEND_PROTOCOL || 'http',
  host: import.meta.env.VITE_BACKEND_HOST || 'localhost',
  port: import.meta.env.VITE_BACKEND_PORT || '5001'
};

// URL base da API
export const API_BASE_URL = `${API_CONFIG.protocol}://${API_CONFIG.host}:${API_CONFIG.port}`;

// Função helper para construir URLs da API
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};
```

### Uso nos Componentes

Todos os componentes que fazem chamadas para a API foram atualizados para usar a função `buildApiUrl()`:

```javascript
import { buildApiUrl } from '../config/api';

// Antes
const response = await fetch('http://localhost:5000/api/auth/login', options);

// Depois
const response = await fetch(buildApiUrl('api/auth/login'), options);
```

## Arquivos Atualizados

- `src/config/api.js` (novo)
- `src/contexts/AuthContext.jsx`
- `src/contexts/PortfolioContext.jsx`
- `src/components/StockEditor.jsx`
- `src/components/SearchBar.jsx`
- `src/Acao.jsx`

## Benefícios

1. **Flexibilidade**: Fácil mudança de porta/host sem alterar código
2. **Ambientes**: Diferentes configurações para dev/prod
3. **Manutenibilidade**: Configuração centralizada
4. **Segurança**: Variáveis sensíveis não ficam no código

## Notas Importantes

- O prefixo `VITE_` é obrigatório para que as variáveis sejam expostas no frontend
- Reinicie o servidor de desenvolvimento após alterar o arquivo `.env`
- O arquivo `.env` não deve ser commitado no git (já está no .gitignore)
