# FinTracker - Knowledge Base do Assistente IA

## Visao geral
O FinTracker e um sistema de controle de carteira de acoes. O usuario pode entrar na conta, cadastrar-se, acompanhar a carteira, buscar ativos, gerenciar watchlist, registrar transacoes, abrir a tela detalhada de uma acao e ajustar configuracoes como perfil, senha e MFA.

O assistente IA aparece nas paginas protegidas `/carteira`, `/explorar` e `/grupos`.

## Paginas do sistema

### `/` e `/login`
Tela de login.

O usuario pode:
- Entrar com email e senha.
- Iniciar recuperacao de senha.
- Ser redirecionado para a carteira apos login.

Elementos importantes:
- `AuthCard` com formulario de login.
- Modal de recuperacao de senha.
- Modal de MFA quando a conta exige autenticacao em dois fatores.

### `/cadastro`
Tela de criacao de conta.

O usuario pode:
- Informar nome, sobrenome, email e senha.
- Confirmar a senha.
- Criar a conta e seguir para a carteira.

Elementos importantes:
- `AuthCard` com formulario de cadastro.

### `/carteira`
Tela principal da carteira do usuario.

O usuario pode:
- Ver a carteira consolidada.
- Ver o historico de transacoes.
- Abrir o modal de nova transacao.
- Recarregar os dados da carteira.
- Ver notificacoes.

Elementos importantes:
- `Logo`.
- `PageTitle` com o titulo `Carteira`.
- `TransactionButton` para adicionar transacoes.
- `NotificationsButton` para alertas.
- `ReloadButton` para atualizar os dados.
- `PortfolioTable` com posicoes da carteira.
- `PortfolioPieChart` com distribuicao da carteira.
- `TransactionHistoryTable` com o historico de compras e vendas.

### `/explorar`
Tela para procurar acoes e gerenciar watchlist.

O usuario pode:
- Pesquisar acoes por ticker ou nome.
- Abrir a pagina de detalhes de uma acao.
- Adicionar ou remover ativos da watchlist.
- Adicionar um ativo a carteira por meio de transacao.
- Recarregar dados da watchlist.

Elementos importantes:
- `SearchBar` com busca de acoes.
- `WatchlistTable` com os ativos monitorados.
- `TransactionButton` para registrar transacoes.
- `NotificationsButton`.
- `ReloadButton`.
- `PageTitle` com o titulo `Explorar`.

### `/grupos`
Tela de grupos.

O usuario pode:
- Acessar a area reservada para agrupamentos.
- Ver a estrutura da pagina, que ainda esta em evolucao.

Elementos importantes:
- `Logo`.
- `PageTitle` com o titulo `Grupos`.

### `/:ticker`
Pagina de detalhes de uma acao, como `/PETR4` ou `/VALE3`.

O usuario pode:
- Ver o nome da empresa.
- Consultar grafico de precos.
- Consultar grafico de dividendos.
- Forcar atualizacao dos dados.
- Abrir o modal de nova transacao com a acao ja selecionada.
- Voltar para a pagina anterior.

Elementos importantes:
- `BackNavigation`.
- `PageTitle` com o ticker.
- `PageSubtitle` com o nome da empresa.
- `ReloadButton`.
- `TransactionButton`.
- `PriceChart`.
- `DividendsChart`.

### `/configuracoes`
Tela de configuracao da conta.

O usuario pode:
- Editar nome, sobrenome e email.
- Alterar a senha.
- Consultar e ativar/desativar MFA.

Elementos importantes:
- Seccao de dados pessoais.
- Seccao de senha.
- Seccao de MFA com QR code, codigo de confirmacao e botao para desativar.
- Preferencias de tema e idioma.

## Como realizar as principais funcionalidades

### Fazer login
1. Abrir `/login`.
2. Informar email e senha.
3. Enviar o formulario.
4. Se a conta exigir MFA, confirmar o codigo do app autenticador.

### Criar conta
1. Abrir `/cadastro`.
2. Preencher nome, sobrenome, email e senha.
3. Confirmar a senha.
4. Enviar o formulario.

### Ver a carteira
1. Abrir `/carteira`.
2. Conferir os cards e tabelas carregados.
3. Usar o botao de recarga quando quiser atualizar os dados.

### Adicionar uma transacao
1. Abrir `/carteira` ou `/explorar` ou uma pagina `/:ticker`.
2. Clicar em `Transacao`.
3. Selecionar a acao.
4. Informar tipo da operacao, preco, quantidade e data.
5. Salvar.

### Gerenciar watchlist
1. Abrir `/explorar`.
2. Pesquisar a acao.
3. Usar o botao de olho para adicionar ou remover da watchlist.

### Abrir a pagina de uma acao
1. Abrir `/explorar`.
2. Pesquisar o ticker.
3. Clicar no resultado desejado.

### Ativar MFA
1. Abrir `/configuracoes`.
2. Ir ate a secao de MFA.
3. Iniciar o cadastro do fator.
4. Escanear o QR code no aplicativo autenticador.
5. Confirmar com o codigo de 6 digitos.

### Desativar MFA
1. Abrir `/configuracoes`.
2. Ir ate a secao de MFA.
3. Confirmar a desativacao.

### Atualizar perfil
1. Abrir `/configuracoes`.
2. Alterar nome, sobrenome ou email.
3. Salvar as alteracoes.

### Alterar senha
1. Abrir `/configuracoes`.
2. Informar senha atual, nova senha e confirmacao.
3. Salvar a nova senha.

### Recarregar carteira ou watchlist
1. Abrir `/carteira` ou `/explorar`.
2. Clicar no botao de recarga.
3. Aguardar o recarregamento dos dados.

## Descricao dos elementos importantes da interface

- `Logo`: identidade visual do sistema e ponto de referencia no topo.
- `PageTitle`: titulo principal da pagina.
- `PageSubtitle`: complemento de informacao abaixo do titulo.
- `Sidebar`: navegacao lateral entre as areas principais.
- `SearchBar`: busca de acoes com resultados em dropdown.
- `TransactionButton`: abre o modal de nova transacao.
- `ReloadButton`: atualiza dados da tela.
- `NotificationsButton`: mostra avisos e alertas do sistema.
- `BackNavigation`: volta para a pagina anterior em telas de detalhes.
- `PortfolioTable`: lista os ativos da carteira.
- `TransactionHistoryTable`: lista o historico de operacoes.
- `WatchlistTable`: lista os ativos acompanhados.
- `PriceChart`: grafico de evolucao de preco.
- `DividendsChart`: grafico de dividendos.
- `AuthCard`: formulario de login, cadastro e modais de suporte.
- `ChatWidget`: assistente IA nas paginas protegidas.

## Perguntas frequentes

### Onde vejo minha carteira?
Na pagina `/carteira`.

### Onde adiciono uma transacao?
Na pagina `/carteira`, em `/explorar` ou na pagina de detalhes de uma acao.

### Onde gerencio minha watchlist?
Na pagina `/explorar`.

### Onde vejo os graficos de uma acao?
Na pagina `/:ticker`.

### Como ativo a autenticacao em dois fatores?
Em `/configuracoes`, na secao de MFA.

### Posso atualizar meu perfil?
Sim. A pagina `/configuracoes` permite editar dados pessoais e senha.

### Em quais paginas o assistente IA aparece?
Em `/carteira`, `/explorar` e `/grupos`.

### O assistente IA pode ajudar com quais assuntos?
Com navegacao do sistema, carteira, transacoes, watchlist, configuracoes e explicacao dos elementos da interface.
