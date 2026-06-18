# FinTracker — Documentação do Sistema

## Sobre o projeto

O **FinTracker** é uma plataforma web pensada para ser **simples, leve e moderna**, criada para substituir planilhas secas do Excel ou anotações feitas à mão. Em vez de controlar investimentos em arquivos genéricos, o usuário passa a gerenciar sua carteira em um espaço feito para isso — com visual limpo, navegação intuitiva e recursos pensados para o dia a dia do investidor.

O sistema permite **gerir várias contas e contextos** por meio da funcionalidade de **Grupos**, acompanhar posições e transações com dados de mercado atualizados, explorar ativos antes de comprar e **tirar dúvidas sobre investimentos** com um assistente de IA integrado. Tudo isso em um ambiente **seguro e clean**, com autenticação robusta, notificações e controle fino de permissões.

---

## Visão geral da arquitetura

O FinTracker é composto por três camadas principais:

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                    │
│  Interface do usuário, rotas, gráficos e widgets            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Backend (Flask API)                                        │
│  Regras de negócio, preços, dividendos, grupos, transações  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Supabase (PostgreSQL + Auth + Edge Functions)              │
│  Usuários, carteira, watchlist, grupos, notificações, chat  │
└─────────────────────────────────────────────────────────────┘
```

Além disso, o sistema consulta **fontes externas de mercado** (como **Brapi** para cotações e **Yahoo Finance** para dividendos) para manter preços e proventos atualizados no banco de dados.

---

## Tecnologias utilizadas

### Frontend

| Tecnologia | Uso |
|---|---|
| **React 19** | Construção da interface e componentes |
| **Vite 7** | Bundler e servidor de desenvolvimento |
| **React Router DOM 7** | Navegação entre páginas (SPA) |
| **Recharts 3** | Gráficos de preços, dividendos e distribuição da carteira |
| **Supabase JS** | Autenticação no cliente e consultas diretas (ex.: busca de ações) |
| **Bootstrap Icons** | Ícones da interface (sidebar, ações, notificações) |
| **CSS customizado** | Temas claro/escuro, tipografia e layout responsivo |

### Backend

| Tecnologia | Uso |
|---|---|
| **Flask 3** | API REST e orquestração de serviços |
| **Flask-CORS** | Comunicação segura com o frontend |
| **Supabase Python SDK** | Acesso ao banco e autenticação server-side |
| **Brapi** | Cotações e preços de ações da B3 |
| **yfinance (Yahoo Finance)** | Histórico e dados de dividendos |
| **bcrypt** | Tratamento de credenciais |
| **python-dotenv** | Variáveis de ambiente |

### Infraestrutura e dados

| Tecnologia | Uso |
|---|---|
| **Supabase (PostgreSQL)** | Persistência de usuários, carteira, watchlist, transações, grupos e notificações |
| **Supabase Auth** | Login, cadastro, recuperação de senha e MFA (autenticação em dois fatores) |
| **Supabase Edge Functions** | Assistente de IA (chat) com acesso a dados de mercado |
| **Row Level Security (RLS)** | Políticas de acesso aos dados de grupos e notificações |

---

## Estrutura do repositório

```
FinTracker/
├── frontend/          # Aplicação React (interface do usuário)
├── backend/           # API Flask (lógica de negócio e integrações)
├── supabase/          # Migrations SQL e Edge Functions (chat)
├── chatbot/           # Base de conhecimento do assistente IA
├── DOCUMENTACAO.md    # Este arquivo
└── README.md
```

---

## Navegação e abas do sistema

Após o login, o usuário acessa as áreas principais pela **barra lateral (Sidebar)**. As abas disponíveis são:

| Aba | Rota | Descrição resumida |
|---|---|---|
| **Carteira** | `/carteira` | Visão consolidada dos investimentos do usuário |
| **Explorar** | `/explorar` | Busca de ações e lista de observação (watchlist) |
| **Grupos** | `/grupos` | Comunidades de investidores com permissões compartilhadas |
| **Configurações** | `/configuracoes` | Perfil, senha, MFA e preferências visuais |

Há também páginas auxiliares fora do menu lateral:

| Página | Rota | Descrição |
|---|---|---|
| **Login** | `/` ou `/login` | Entrada na conta |
| **Cadastro** | `/cadastro` | Criação de nova conta |
| **Detalhes da ação** | `/:ticker` (ex.: `/PETR4`) | Gráficos e informações de um ativo específico |

O **assistente de IA (ChatWidget)** fica disponível nas páginas **Carteira**, **Explorar** e **Grupos**.

---

## Páginas em detalhe

### Login e Cadastro

**Rotas:** `/`, `/login` e `/cadastro`

Telas de autenticação com visual limpo e ilustração temática de investimentos.

**O que o usuário pode fazer:**

- Entrar com e-mail e senha
- Criar conta informando nome, sobrenome, e-mail e senha
- Recuperar senha por e-mail
- Redefinir senha após receber o link de recuperação
- Concluir login com **MFA** (código de 6 dígitos do app autenticador), quando a conta exige autenticação em dois fatores

Após login bem-sucedido, o usuário é direcionado para a **Carteira**.

---

### Carteira

**Rota:** `/carteira`

Esta é a **tela principal** do sistema — o centro de controle dos investimentos do usuário.

**O que o usuário pode fazer:**

- Visualizar todas as posições da carteira em uma tabela com ticker, preço unitário, quantidade e valor total
- Ver a **distribuição da carteira** em um gráfico de pizza interativo (percentual por ativo)
- Consultar o **histórico completo de transações** (compras e vendas)
- **Registrar nova transação** (compra ou venda) pelo botão de transação
- **Editar ou excluir** transações existentes no histórico
- **Atualizar preços** de todos os ativos da carteira com um clique (botão de recarga)
- Acessar a página de detalhes de uma ação clicando em qualquer linha da tabela
- Receber e consultar **notificações** do sistema

**Elementos da interface:**

- `PortfolioTable` — tabela de posições
- `PortfolioPieChart` — gráfico de distribuição patrimonial
- `TransactionHistoryTable` — histórico de operações
- `TransactionButton` — modal para nova transação
- `ReloadButton` — atualização de cotações
- `NotificationsButton` — central de alertas

Os dados da carteira utilizam **cache local** (5 minutos) para carregamento rápido, com opção de refresh manual a qualquer momento.

---

### Explorar

**Rota:** `/explorar`

Área dedicada à **descoberta e monitoramento** de ativos antes ou além da carteira principal.

**O que o usuário pode fazer:**

- **Pesquisar ações** por ticker ou nome da empresa (barra de busca com resultados em dropdown)
- Abrir a **página de detalhes** de qualquer ação encontrada
- **Adicionar ou remover ativos da watchlist** (lista de observação) com o ícone de olho
- Acompanhar na watchlist: ticker, cotação atual e último provento (dividendo)
- **Registrar transações** diretamente a partir desta tela
- **Atualizar cotações e dividendos** de todos os ativos monitorados

**Elementos da interface:**

- `SearchBar` — busca inteligente de ações
- `WatchlistTable` — tabela da lista de observação
- `TransactionButton`, `ReloadButton`, `NotificationsButton`

A watchlist funciona como um radar: o usuário acompanha ativos de interesse sem necessariamente possuí-los na carteira.

---

### Detalhes da ação

**Rota:** `/:ticker` (ex.: `/VALE3`, `/ITUB4`)

Página dedicada a um único ativo, acessível a partir da Carteira, Explorar ou busca.

**O que o usuário pode fazer:**

- Ver o **nome da empresa** e o ticker em destaque
- Consultar o **gráfico de histórico de preços** com filtros de período (7 dias, 1 mês, 3 meses)
- Consultar o **gráfico de dividendos** recebidos ao longo do tempo
- **Forçar atualização** dos dados de mercado (preços e proventos)
- **Registrar transação** com o ativo já pré-selecionado
- Voltar à página de origem (Carteira ou Explorar) pelo botão de navegação

**Elementos da interface:**

- `PriceChart` — evolução de preços
- `DividendsChart` — histórico de proventos
- `BackNavigation` — retorno contextual
- `PageSubtitle` — nome da empresa

---

### Grupos

**Rota:** `/grupos`

Funcionalidade para **gerir investimentos em conjunto** — ideal para famílias, clubes de investimento, mentores ou equipes que desejam compartilhar visibilidade sobre carteiras de forma controlada.

**O que o usuário pode fazer:**

#### Criação e gestão de grupos

- **Criar grupos** com nome, descrição, visibilidade, permissões e limite opcional de membros
- **Editar configurações** do grupo (fundador e líderes)
- **Excluir o grupo** (somente fundador)
- **Transferir a fundação** para outro membro

#### Participação

- Ver **grupos em que participa** e **grupos públicos** disponíveis
- **Entrar em grupos públicos** ou solicitar entrada em grupos com aprovação
- **Sair do grupo** (membros comuns e líderes não fundadores)
- **Aceitar convites** por notificação ou link (`/grupos?convite=TOKEN`)

#### Membros e papéis

- **Convidar membros** por busca de usuário ou link de convite
- **Promover ou rebaixar** membros a líder
- **Expulsar membros** (fundador/líder)
- **Aprovar ou rejeitar** solicitações de entrada

#### Carteiras compartilhadas

- **Visualizar a carteira** de outro membro (quando permitido)
- **Gerenciar transações** na carteira de outro membro (quando permitido)
- Ver gráfico de distribuição e histórico no modal `MemberWalletModal`

#### Visibilidade do grupo

| Tipo | Comportamento |
|---|---|
| **Público** | Qualquer usuário pode entrar após consentir (se necessário) |
| **Público \| Aprovação** | Entrada visível, mas exige aprovação de um líder |
| **Privado** | Apenas por convite direto ou link |

#### Permissões de carteira (visualizar / gerenciar)

| Nível | Significado |
|---|---|
| **Ninguém** | Ninguém acessa carteiras alheias (exceto a própria) |
| **Apenas líderes** | Fundador e líderes podem acessar |
| **Todos os membros** | Qualquer membro ativo pode acessar |

> A permissão de **gerenciar** nunca pode ser mais permissiva que a de **visualizar**.

#### Re-consentimento

Quando um líder torna as permissões do grupo **mais permissivas**, cada membro precisa **aceitar novamente** as novas regras. Recusar faz o membro sair do grupo imediatamente. Um ícone de relógio vermelho indica pendência de re-consentimento.

---

### Configurações

**Rota:** `/configuracoes`

Área de **conta pessoal e preferências** do usuário.

**O que o usuário pode fazer:**

#### Dados pessoais

- Editar **nome**, **sobrenome** e **e-mail**
- Salvar alterações com feedback visual de sucesso ou erro

#### Segurança

- **Alterar senha** (senha atual, nova senha e confirmação)
- Ativar **autenticação em dois fatores (MFA)** via QR Code e app autenticador (Google Authenticator, Authy, etc.)
- **Desativar MFA** quando desejado

#### Preferências visuais

- Alternar entre **tema claro** e **tema escuro**
- Ajustar **tamanho da fonte** (pequeno, médio, grande)
- Selecionar idioma (padrão: português do Brasil)

As preferências de tema e fonte são persistidas no navegador (`localStorage`).

---

## Funcionalidades do sistema

### Gestão de carteira

- Consolidação automática de posições a partir das transações registradas
- Cálculo de valor total por ativo com cotações atualizadas
- Gráfico de distribuição percentual da carteira
- Histórico completo de compras e vendas com edição e exclusão
- Atualização em lote de preços de mercado

### Transações

- Registro de **compra** ou **venda** com preço unitário, quantidade e data
- Busca de ativo por ticker ou nome no modal de transação
- Pré-seleção automática do ativo na página de detalhes
- Impacto imediato na carteira após salvar
- Possibilidade de gerenciar transações de membros do grupo (com permissão)

### Watchlist (lista de observação)

- Monitoramento de ativos sem posição na carteira
- Exibição de cotação atual e último provento
- Adição e remoção rápida via ícone de olho
- Atualização de preços e dividendos em lote

### Dados de mercado

- **Preços:** obtidos via Brapi, com cache inteligente no backend
- **Dividendos:** obtidos via Yahoo Finance
- **Gráficos históricos:** 7 dias, 1 mês ou 3 meses na página da ação
- **Refresh manual:** botão de recarga em Carteira, Explorar e Detalhes da ação
- **Atualização automática:** preços são buscados ao adicionar ativos ou ao acessar telas relevantes

### Notificações

Central de alertas acessível em todas as páginas autenticadas:

- Convites e solicitações de grupos
- Entrada aprovada ou rejeitada
- Alterações de permissões (re-consentimento)
- Ações de outros membros na carteira do usuário
- Alertas relacionados ao MFA (ex.: MFA desativado)

Notificações podem ser marcadas como lidas individualmente ou todas de uma vez.

### Assistente de IA

Disponível nas páginas **Carteira**, **Explorar** e **Grupos**, o chat widget permite:

- Tirar **dúvidas sobre investimentos** e conceitos do mercado
- Obter ajuda para **navegar no sistema**
- Entender como usar carteira, transações, watchlist e grupos
- Consultar informações contextualizadas com base na base de conhecimento do FinTracker

O assistente roda como **Supabase Edge Function**, com acesso a dados de mercado para respostas mais úteis.

### Autenticação e segurança

- Cadastro e login com e-mail e senha via Supabase Auth
- Recuperação de senha por e-mail
- **MFA (TOTP)** opcional com QR Code
- Rotas protegidas — páginas internas exigem login
- Tokens JWT enviados nas requisições à API (`authFetch`)
- **Row Level Security** no banco para grupos e notificações
- Permissões granulares em grupos (visualizar vs. gerenciar carteiras alheias)
- Consentimento explícito antes de entrar em grupos com regras de compartilhamento

### Personalização

- Tema claro e escuro com transição suave
- Três tamanhos de fonte configuráveis
- Interface responsiva e visual minimalista

---

## Fluxos comuns do usuário

### Primeiro acesso

1. Acessar `/cadastro` e criar a conta
2. Ser redirecionado para `/carteira`
3. Clicar em **Transação** e registrar a primeira compra
4. Opcionalmente ativar MFA em **Configurações**

### Acompanhar a carteira no dia a dia

1. Abrir **Carteira**
2. Conferir posições, gráfico de distribuição e histórico
3. Usar o botão de recarga para atualizar cotações
4. Registrar novas compras ou vendas conforme necessário

### Explorar antes de investir

1. Abrir **Explorar**
2. Buscar o ativo desejado
3. Adicionar à watchlist para monitorar
4. Abrir a página de detalhes para ver gráficos de preço e dividendos
5. Registrar a transação quando decidir comprar

### Investir em grupo

1. Abrir **Grupos**
2. Criar um grupo ou entrar em um existente
3. Configurar permissões de visualização e gerenciamento
4. Convidar membros ou compartilhar link
5. Visualizar ou gerenciar carteiras conforme as permissões definidas

### Tirar dúvidas

1. Abrir **Carteira**, **Explorar** ou **Grupos**
2. Clicar no widget de chat no canto da tela
3. Perguntar sobre investimentos, funcionalidades ou navegação

---

## API Backend (resumo)

A API Flask expõe endpoints REST sob o prefixo `/api/`. Principais grupos:

| Grupo | Exemplos de endpoints |
|---|---|
| **Autenticação** | `/api/register`, `/api/login`, `/api/user/update` |
| **MFA** | `/api/mfa/status` |
| **Carteira** | `/api/portfolio/full`, `/api/portfolio/update-prices-login` |
| **Watchlist** | `/api/watchlist/full`, `/api/watchlist/update-prices-login` |
| **Transações** | `/api/transactions` (GET, POST, PATCH, DELETE) |
| **Ações** | `/api/stocks/:ticker/view`, `/api/stocks/:ticker/refresh` |
| **Grupos** | `/api/groups`, `/api/groups/mine`, `/api/groups/:id/join` |
| **Notificações** | `/api/notifications`, `/api/notifications/read-all` |
| **Saúde** | `/api/health` |

---

## Como executar o projeto

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # Configure as variáveis
python app.py
```

A API ficará disponível em `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env       # Configure as variáveis (Supabase, URL da API)
npm run dev
```

A interface ficará disponível em `http://localhost:5173` (porta padrão do Vite).

> Consulte `backend/docs/SUPABASE_SETUP.md` para instruções de configuração do banco de dados e `backend/.env.example` / `frontend/.env.example` para as variáveis necessárias.

---

## Filosofia do produto

O FinTracker não tenta ser um terminal profissional de trading nem uma planilha infinita de fórmulas. Ele ocupa o espaço intermediário ideal para o investidor pessoa física que quer:

- **Organização** — tudo em um só lugar, sem abas soltas de Excel
- **Clareza** — gráficos, tabelas e percentuais fáceis de ler
- **Simplicidade** — registrar uma compra leva segundos
- **Colaboração** — grupos com permissões explícitas, não planilhas compartilhadas desorganizadas
- **Aprendizado** — assistente IA para dúvidas do dia a dia
- **Segurança** — MFA, autenticação moderna e controle de acesso no banco

É um **espaço seguro e clean** para quem quer cuidar da carteira com a mesma leveza de um app moderno — longe das planilhas secas e das anotações espalhadas.

---

## Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo `LICENSE` na raiz do repositório.
