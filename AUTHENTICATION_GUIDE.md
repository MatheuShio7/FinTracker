# 🔐 Guia de Autenticação - FinTracker

Sistema completo de autenticação implementado com sucesso!

## 📋 O que foi implementado

### Backend (Python/Flask)

#### 1. Serviço de Autenticação (`backend/services/auth_service.py`)
- ✅ **register_user()**: Cadastro de novos usuários com validações
  - Validação de email (regex)
  - Validação de senha (mínimo 8 caracteres)
  - Hash de senha com bcrypt (10 rounds)
  - Verificação de email duplicado
  
- ✅ **login_user()**: Login de usuários
  - Verificação de senha com bcrypt
  - Retorna dados do usuário (SEM password)
  
- ✅ **get_user_by_id()**: Busca usuário por ID
  - Usado para recuperar sessão do localStorage

#### 2. Rotas de API (`backend/routes/auth_routes.py`)
- ✅ **POST /api/auth/register**: Endpoint de cadastro
- ✅ **POST /api/auth/login**: Endpoint de login
- ✅ **GET /api/auth/user/<user_id>**: Endpoint de busca de usuário

#### 3. Configuração
- ✅ Rotas registradas no `app.py`
- ✅ Dependência `bcrypt==4.1.1` adicionada ao `requirements.txt`

### Frontend (React)

#### 1. Context de Autenticação (`frontend/src/contexts/AuthContext.jsx`)
- ✅ Estado global de autenticação
- ✅ Função `signup()`: Cadastro de usuários
- ✅ Função `login()`: Login de usuários
- ✅ Função `logout()`: Logout
- ✅ Persistência de sessão no localStorage
- ✅ Recuperação automática de sessão ao recarregar

#### 2. Componente de Proteção de Rotas (`frontend/src/components/ProtectedRoute.jsx`)
- ✅ Protege rotas que exigem autenticação
- ✅ Redireciona para login se não autenticado
- ✅ Tela de loading durante verificação

#### 3. Formulários de Autenticação (atualizado `AuthCard.jsx`)
- ✅ Integração com API de login
- ✅ Integração com API de cadastro
- ✅ Validações em tempo real
- ✅ Mensagens de erro amigáveis
- ✅ Estados de loading nos botões
- ✅ Validação de senha (mínimo 8 caracteres)
- ✅ Validação de confirmação de senha

#### 4. Aplicação Principal (atualizado `App.jsx`)
- ✅ AuthProvider envolvendo toda a aplicação
- ✅ Rotas protegidas: /carteira, /explorar, /conteudo, /:ticker, /configuracoes
- ✅ Rotas públicas: /login, /cadastro

## 🚀 Como usar

### 1. Instalar dependências do Backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Iniciar o Backend

```bash
cd backend
python app.py
```

O servidor estará rodando em `http://localhost:5000`

### 3. Iniciar o Frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 📝 Testando o sistema

### Cadastro de usuário

1. Acesse `http://localhost:5173/cadastro`
2. Preencha os campos:
   - Nome: João
   - Sobrenome: Silva
   - Email: joao@teste.com
   - Senha: senha12345 (mínimo 8 caracteres)
   - Confirmar senha: senha12345
3. Clique em "Cadastrar"
4. Você será redirecionado para `/explorar`

### Login de usuário

1. Acesse `http://localhost:5173/login`
2. Preencha os campos:
   - Email: joao@teste.com
   - Senha: senha12345
3. Clique em "Entrar"
4. Você será redirecionado para `/explorar`

### Persistência de sessão

- O `user_id` é salvo no `localStorage`
- Ao recarregar a página, o usuário permanece logado
- Use o console do navegador: `localStorage.getItem('user_id')`

### Logout

Para implementar logout em qualquer componente:

```jsx
import { useAuth } from '../contexts/AuthContext'

function MeuComponente() {
  const { user, logout } = useAuth()
  
  return (
    <button onClick={logout}>
      Sair
    </button>
  )
}
```

## 🔒 Segurança implementada

### Backend
- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ NUNCA retorna o campo `password` nas respostas
- ✅ Validação de email com regex
- ✅ Senha mínimo 8 caracteres
- ✅ Tratamento de erros (email duplicado, usuário não encontrado)
- ✅ Mensagens de erro genéricas para evitar enumeration

### Frontend
- ✅ Validação de formulário antes de enviar
- ✅ Proteção de rotas com ProtectedRoute
- ✅ Verificação de senha correspondente
- ✅ Estados de loading para evitar múltiplos submits
- ✅ Mensagens de erro amigáveis

## 📊 Endpoints da API

### POST /api/auth/register
**Body:**
```json
{
  "name": "João",
  "last_name": "Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response (sucesso):**
```json
{
  "status": "success",
  "message": "Usuário cadastrado com sucesso!",
  "user_id": "uuid-do-usuario"
}
```

**Response (erro):**
```json
{
  "status": "error",
  "message": "Email já está cadastrado"
}
```

### POST /api/auth/login
**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response (sucesso):**
```json
{
  "status": "success",
  "user": {
    "id": "uuid",
    "name": "João",
    "last_name": "Silva",
    "email": "joao@email.com",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
}
```

### GET /api/auth/user/<user_id>
**Response (sucesso):**
```json
{
  "status": "success",
  "user": {
    "id": "uuid",
    "name": "João",
    "last_name": "Silva",
    "email": "joao@email.com",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
}
```

## 🎨 Componentes disponíveis

### useAuth Hook
```jsx
import { useAuth } from './contexts/AuthContext'

const { user, loading, signup, login, logout } = useAuth()

// user: Objeto com dados do usuário ou null
// loading: Boolean indicando se está carregando
// signup(name, lastName, email, password): Função de cadastro
// login(email, password): Função de login
// logout(): Função de logout
```

### ProtectedRoute
```jsx
import ProtectedRoute from './components/ProtectedRoute'

<Route path="/rota-protegida" element={
  <ProtectedRoute>
    <MeuComponente />
  </ProtectedRoute>
} />
```

## 🐛 Possíveis melhorias futuras

- [ ] Implementar JWT tokens ao invés de apenas user_id
- [ ] Adicionar refresh tokens
- [ ] Implementar "Esqueceu a senha?"
- [ ] Adicionar verificação de email
- [ ] Implementar OAuth (Google, Facebook, etc.)
- [ ] Adicionar rate limiting nas rotas de auth
- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Adicionar histórico de logins
- [ ] Implementar expiração de sessão

## ✅ Checklist de funcionamento

- [x] Cadastro de usuário funciona
- [x] Login de usuário funciona
- [x] Senhas são hasheadas com bcrypt
- [x] Validações de email e senha funcionam
- [x] Rotas protegidas redirecionam para login
- [x] Sessão persiste após recarregar página
- [x] Mensagens de erro são exibidas corretamente
- [x] Estados de loading funcionam
- [x] Campos `password` nunca são retornados pela API

---

✨ **Sistema de autenticação implementado com sucesso!**

