// @ts-nocheck
// deno-lint-ignore-file

import { createClient } from 'npm:@supabase/supabase-js@2'

type ChatHistoryItem = {
  role?: 'user' | 'assistant'
  text?: string
}

type ChatRequestBody = {
  message?: string
  userId?: string
  history?: ChatHistoryItem[]
}

type MarketQuote = {
  ticker: string
  company_name: string | null
  current_price: number | null
  currency: string
  source: string
  updated_at: string | null
  error?: string
}

type DividendRecord = {
  payment_date: string
  value: number
}

type DividendSnapshot = {
  ticker: string
  company_name: string | null
  source: string
  dividends: DividendRecord[]
  requested_count: number
  error?: string
}

const SYSTEM_PROMPT =
  'Você é o assistente virtual do FinTracker, um sistema de controle de carteira de ações. Responda sempre em português brasileiro. Seja objetivo e use linguagem simples e acessível. Quando a pergunta for sobre o FinTracker, use o knowledge base e os dados fornecidos no contexto. Quando a pergunta for sobre o usuário logado, use os dados do Supabase fornecidos no contexto. Quando a pergunta for sobre preço atual de ações, use a cotação consultada na BRAPI fornecida no contexto. Para conceitos e indicadores financeiros como P/VP, P/L, Dividend Yield, estratégias de investimento, educação financeira em geral e outros conhecimentos de mercado, você pode usar seu próprio conhecimento. Priorize primeiro os dados fornecidos no contexto quando eles forem relevantes, depois seu próprio conhecimento para conceitos gerais, e por fim admita honestamente quando não souber. Não recomende compra ou venda de ações específicas. Quando analisar dados numéricos do usuário ou cotações, seja preciso com os números.'

const SYSTEM_CONTEXT = String.raw`# FinTracker - Knowledge Base do Assistente IA

## Visao geral
O FinTracker e um sistema de controle de carteira de acoes. O usuario pode entrar na conta, cadastrar-se, acompanhar a carteira, buscar ativos, gerenciar watchlist, registrar transacoes, abrir a tela detalhada de uma acao e ajustar configuracoes como perfil, senha e MFA.

O assistente IA aparece nas paginas protegidas /carteira, /explorar e /grupos.

## Paginas do sistema

### / e /login
Tela de login.

O usuario pode:
- Entrar com email e senha.
- Iniciar recuperacao de senha.
- Ser redirecionado para a carteira apos login.

Elementos importantes:
- AuthCard com formulario de login.
- Modal de recuperacao de senha.
- Modal de MFA quando a conta exige autenticacao em dois fatores.

### /cadastro
Tela de criacao de conta.

O usuario pode:
- Informar nome, sobrenome, email e senha.
- Confirmar a senha.
- Criar a conta e seguir para a carteira.

Elementos importantes:
- AuthCard com formulario de cadastro.

### /carteira
Tela principal da carteira do usuario.

O usuario pode:
- Ver a carteira consolidada.
- Ver o historico de transacoes.
- Abrir o modal de nova transacao.
- Recarregar os dados da carteira.
- Ver notificacoes.

Elementos importantes:
- Logo.
- PageTitle com o titulo Carteira.
- TransactionButton para adicionar transacoes.
- NotificationsButton para alertas.
- ReloadButton para atualizar os dados.
- PortfolioTable com posicoes da carteira.
- PortfolioPieChart com distribuicao da carteira.
- TransactionHistoryTable com o historico de compras e vendas.

### /explorar
Tela para procurar acoes e gerenciar watchlist.

O usuario pode:
- Pesquisar acoes por ticker ou nome.
- Abrir a pagina de detalhes de uma acao.
- Adicionar ou remover ativos da watchlist.
- Adicionar um ativo a carteira por meio de transacao.
- Recarregar dados da watchlist.

Elementos importantes:
- SearchBar com busca de acoes.
- WatchlistTable com os ativos monitorados.
- TransactionButton para registrar transacoes.
- NotificationsButton.
- ReloadButton.
- PageTitle com o titulo Explorar.

### /grupos
Tela para criar e participar de grupos de investidores.

O usuario pode:
- Criar um novo grupo com nome, descricao, visibilidade, permissoes e limite de membros.
- Ver grupos em que participa e grupos publicos disponiveis.
- Abrir detalhes de um grupo, editar configuracoes (fundador/lider) e convidar membros.
- Entrar em grupos publicos ou solicitar entrada em grupos com aprovacao.
- Aceitar convites por notificacao ou link (/grupos?convite=TOKEN).
- Promover, rebaixar ou expulsar membros (fundador/lider).
- Transferir a fundacao ou excluir o grupo (somente fundador).
- Visualizar e, quando permitido, gerenciar a carteira de outro membro.
- Revisar permissoes quando o grupo torna regras mais permissivas (re-consentimento).
- Sair de um grupo (membros comuns e lideres nao fundadores).

Visibilidade do grupo:
- publico — qualquer usuario pode entrar apos consentir (se necessario).
- restrito — entrada publica, mas exige aprovacao de um lider.
- privado — apenas por convite direto ou link.

Permissoes de carteira (visualizar / gerenciar):
- ninguem — ninguem acessa carteiras alheias (exceto a propria).
- lideres — apenas fundador e lideres.
- todos — qualquer membro ativo.
- Gerenciar nunca pode ser mais permissivo que visualizar.

Elementos importantes:
- Logo, PageTitle (Grupos), NotificationsButton, ReloadButton.
- Cards de grupos com contagem de membros e badge Lotado quando cheio.
- Modal de detalhes com lista de membros, papeis (Fundador/Lider) e acoes.
- Icone bi-wallet2 para abrir a carteira de um membro.
- Icone bi-clock-history vermelho quando um membro aguarda re-consentimento.
- MemberWalletModal com carteira, grafico e historico (somente leitura ou gerenciavel).
- Modal de consentimento antes de entrar, aceitar convite ou re-consentir.

Notificacoes relacionadas a grupos:
- Convite recebido, solicitacao de entrada pendente, entrada aprovada.
- Permissoes alteradas (re-consentimento necessario).
- Acao de outro membro na carteira do usuario.

### /:ticker
Pagina de detalhes de uma acao, como /PETR4 ou /VALE3.

O usuario pode:
- Ver o nome da empresa.
- Consultar grafico de precos.
- Consultar grafico de dividendos.
- Forcar atualizacao dos dados.
- Abrir o modal de nova transacao com a acao ja selecionada.
- Voltar para a pagina anterior.

Elementos importantes:
- BackNavigation.
- PageTitle com o ticker.
- PageSubtitle com o nome da empresa.
- ReloadButton.
- TransactionButton.
- PriceChart.
- DividendsChart.

### /configuracoes
Tela de configuracao da conta.

O usuario pode:
- Editar nome, sobrenome e email.
- Alterar a senha.
- Consultar e ativar/desativar MFA.

Elementos importantes:
- Secao de dados pessoais.
- Secao de senha.
- Secao de MFA com QR code, codigo de confirmacao e botao para desativar.
- Preferencias de tema e idioma.

## Como realizar as principais funcionalidades

### Fazer login
1. Abrir /login.
2. Informar email e senha.
3. Enviar o formulario.
4. Se a conta exigir MFA, confirmar o codigo do app autenticador.

### Criar conta
1. Abrir /cadastro.
2. Preencher nome, sobrenome, email e senha.
3. Confirmar a senha.
4. Enviar o formulario.

### Ver a carteira
1. Abrir /carteira.
2. Conferir os cards e tabelas carregados.
3. Usar o botao de recarga quando quiser atualizar os dados.

### Adicionar uma transacao
1. Abrir /carteira ou /explorar ou uma pagina /:ticker.
2. Clicar em Transacao.
3. Selecionar a acao.
4. Informar tipo da operacao, preco, quantidade e data.
5. Salvar.

### Gerenciar watchlist
1. Abrir /explorar.
2. Pesquisar a acao.
3. Usar o botao de olho para adicionar ou remover da watchlist.

### Abrir a pagina de uma acao
1. Abrir /explorar.
2. Pesquisar o ticker.
3. Clicar no resultado desejado.

### Ativar MFA
1. Abrir /configuracoes.
2. Ir ate a secao de MFA.
3. Iniciar o cadastro do fator.
4. Escanear o QR code no aplicativo autenticador.
5. Confirmar com o codigo de 6 digitos.

### Desativar MFA
1. Abrir /configuracoes.
2. Ir ate a secao de MFA.
3. Confirmar a desativacao.

### Atualizar perfil
1. Abrir /configuracoes.
2. Alterar nome, sobrenome ou email.
3. Salvar as alteracoes.

### Alterar senha
1. Abrir /configuracoes.
2. Informar senha atual, nova senha e confirmacao.
3. Salvar a nova senha.

### Recarregar carteira ou watchlist
1. Abrir /carteira ou /explorar.
2. Clicar no botao de recarga.
3. Aguardar o recarregamento dos dados.

### Criar um grupo
1. Abrir /grupos.
2. Clicar em Grupo.
3. Preencher nome, descricao, visibilidade e permissoes.
4. Opcionalmente ativar limite maximo de membros.
5. Salvar.

### Entrar em um grupo publico
1. Abrir /grupos e escolher um grupo em Grupos publicos.
2. Clicar em Entrar.
3. Se o grupo exigir consentimento, revisar permissoes e confirmar.
4. Em grupos com aprovacao (restrito), aguardar um lider aprovar.

### Ver carteira de um membro do grupo
1. Abrir /grupos e entrar nos detalhes do grupo.
2. Clicar no icone de carteira ao lado do membro.
3. Se tiver permissao de gerenciamento, usar Transacao para registrar operacoes.

### Aceitar convite para grupo
1. Abrir a notificacao de convite ou acessar o link /grupos?convite=TOKEN.
2. Revisar permissoes no modal de consentimento.
3. Confirmar para entrar no grupo.

## Descricao dos elementos importantes da interface

- Logo: identidade visual do sistema e ponto de referencia no topo.
- PageTitle: titulo principal da pagina.
- PageSubtitle: complemento de informacao abaixo do titulo.
- Sidebar: navegacao lateral entre as areas principais.
- SearchBar: busca de acoes com resultados em dropdown.
- TransactionButton: abre o modal de nova transacao.
- ReloadButton: atualiza dados da tela.
- NotificationsButton: mostra avisos e alertas do sistema.
- BackNavigation: volta para a pagina anterior em telas de detalhes.
- PortfolioTable: lista os ativos da carteira.
- TransactionHistoryTable: lista o historico de operacoes.
- WatchlistTable: lista os ativos acompanhados.
- PriceChart: grafico de evolucao de preco.
- DividendsChart: grafico de dividendos.
- AuthCard: formulario de login, cadastro e modais de suporte.
- ChatWidget: assistente IA nas paginas protegidas.
- MemberWalletModal: modal com carteira de outro membro em grupos.

## Perguntas frequentes

### Onde vejo minha carteira?
Na pagina /carteira.

### Onde adiciono uma transacao?
Na pagina /carteira, em /explorar ou na pagina de detalhes de uma acao.

### Onde gerencio minha watchlist?
Na pagina /explorar.

### Onde vejo os graficos de uma acao?
Na pagina /:ticker.

### Como ativo a autenticacao em dois fatores?
Em /configuracoes, na secao de MFA.

### Posso atualizar meu perfil?
Sim. A pagina /configuracoes permite editar dados pessoais e senha.

### Em quais paginas o assistente IA aparece?
Em /carteira, /explorar e /grupos.

### O assistente IA pode ajudar com quais assuntos?
Com navegacao do sistema, carteira, transacoes, watchlist, grupos, configuracoes e explicacao dos elementos da interface.

### Onde crio ou entro em grupos?
Na pagina /grupos. Grupos publicos aparecem na segunda secao; grupos em que voce participa ficam em Grupos que voce pertence.

### Quem pode ver ou editar a carteira de outro membro?
Depende das permissoes do grupo (visualizar e gerenciar). O icone de carteira so aparece quando voce tem permissao de visualizacao. Edicao exige permissao de gerenciamento.

### O que e re-consentimento em grupos?
Quando um lider torna as permissoes mais permissivas, cada membro precisa aceitar novamente. O icone de relogio vermelho indica pendencia. Recusar faz o membro sair do grupo imediatamente.

### Como funcionam convites de grupo?
Lideres podem convidar por busca de usuario ou gerar link. Convites chegam como notificacao ou URL com ?convite=. Grupos privados so aceitam entrada por convite.
`

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
const brapiToken = Deno.env.get('BRAPI_TOKEN') ?? ''

if (!supabaseUrl || !supabaseServiceRoleKey || !geminiApiKey) {
  throw new Error('Variáveis de ambiente obrigatórias não encontradas.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function normalizeHistory(history: unknown) {
  if (!Array.isArray(history)) {
    return [] as Array<{ role: 'user' | 'assistant'; text: string }>
  }

  return history
    .filter((item): item is ChatHistoryItem => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      text: typeof item.text === 'string' ? item.text.trim() : '',
    }))
    .filter((item) => item.text.length > 0)
    .slice(-20)
}

function toMoney(value: unknown) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return null
  }

  return numberValue.toFixed(2)
}

function extractGeminiText(payload: unknown) {
  const response = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>
      }
    }>
  }

  return response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? ''
}

function detectTicker(message: string) {
  const normalizedMessage = message.toUpperCase()
  const candidates = normalizedMessage.match(/\b[A-Z]{4}\d{1,2}\b/g) ?? []

  if (candidates.length > 0) {
    return candidates[0]
  }

  const compactTicker = normalizedMessage.match(/\b[A-Z]{4}\b/g) ?? []
  return compactTicker[0] ?? null
}

function isPriceQuestion(message: string) {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('preço') ||
    normalizedMessage.includes('cotação') ||
    normalizedMessage.includes('valor atual') ||
    normalizedMessage.includes('quanto custa') ||
    normalizedMessage.includes('preco atual') ||
    normalizedMessage.includes('preço atual')
  )
}

function isDividendQuestion(message: string) {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('dividendo') ||
    normalizedMessage.includes('dividendos') ||
    normalizedMessage.includes('provento') ||
    normalizedMessage.includes('proventos') ||
    normalizedMessage.includes('yield') ||
    normalizedMessage.includes('dy')
  )
}

function extractRequestedDividendCount(message: string) {
  const patterns = [
    /\b(?:ultimos?|últimos?|ultimas?|últimas?)\s+(\d+)\b/i,
    /\btop\s+(\d+)\b/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match?.[1]) {
      const count = Number(match[1])
      if (Number.isFinite(count) && count > 0) {
        return Math.min(count, 12)
      }
    }
  }

  return 3
}

async function fetchCurrentQuote(ticker: string): Promise<MarketQuote> {
  if (!brapiToken) {
    return {
      ticker,
      company_name: null,
      current_price: null,
      currency: 'BRL',
      source: 'brapi',
      updated_at: null,
      error: 'BRAPI_TOKEN não configurado na Edge Function.',
    }
  }

  const url = new URL(`https://brapi.dev/api/quote/${ticker}`)
  url.searchParams.set('range', '1d')
  url.searchParams.set('interval', '1d')
  url.searchParams.set('token', brapiToken)

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'FinTracker/1.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro BRAPI:', response.status, errorText)

      return {
        ticker,
        company_name: null,
        current_price: null,
        currency: 'BRL',
        source: 'brapi',
        updated_at: null,
        error: `BRAPI retornou status ${response.status}`,
      }
    }

    const data = await response.json()
    const result = data?.results?.[0]

    if (!result) {
      return {
        ticker,
        company_name: null,
        current_price: null,
        currency: 'BRL',
        source: 'brapi',
        updated_at: null,
        error: 'A BRAPI não retornou resultados para o ticker informado.',
      }
    }

    const currentPrice = typeof result.regularMarketPrice === 'number'
      ? result.regularMarketPrice
      : typeof result.marketPrice === 'number'
        ? result.marketPrice
        : typeof result.close === 'number'
          ? result.close
          : null

    return {
      ticker,
      company_name: typeof result.longName === 'string'
        ? result.longName
        : typeof result.shortName === 'string'
          ? result.shortName
          : null,
      current_price: currentPrice,
      currency: typeof result.currency === 'string' ? result.currency : 'BRL',
      source: 'brapi',
      updated_at: typeof result.regularMarketTime === 'number'
        ? new Date(result.regularMarketTime * 1000).toISOString()
        : null,
    }
  } catch (error) {
    console.error('Erro ao buscar cotação na BRAPI:', error)
    return {
      ticker,
      company_name: null,
      current_price: null,
      currency: 'BRL',
      source: 'brapi',
      updated_at: null,
      error: 'Falha ao consultar a BRAPI.',
    }
  }
}

async function fetchDividendHistory(ticker: string, requestedCount: number): Promise<DividendSnapshot> {
  const normalizedTicker = ticker.toUpperCase().trim()
  const yahooTicker = normalizedTicker.endsWith('.SA') ? normalizedTicker : `${normalizedTicker}.SA`

  try {
    const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}`)
    url.searchParams.set('interval', '1d')
    url.searchParams.set('range', '5y')
    url.searchParams.set('events', 'div')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'FinTracker/1.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro Yahoo Finance dividendos:', response.status, errorText)
      return {
        ticker: normalizedTicker,
        company_name: null,
        source: 'yahoo_finance',
        dividends: [],
        requested_count: requestedCount,
        error: `Yahoo Finance retornou status ${response.status}`,
      }
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      return {
        ticker: normalizedTicker,
        company_name: null,
        source: 'yahoo_finance',
        dividends: [],
        requested_count: requestedCount,
        error: 'Yahoo Finance não retornou resultados para o ticker informado.',
      }
    }

    const dividendEntries = result?.events?.dividends ?? {}
    const dividends = Object.values(dividendEntries)
      .map((entry: unknown) => {
        const record = entry as { date?: number; amount?: number }

        if (!record || typeof record.date !== 'number' || typeof record.amount !== 'number') {
          return null
        }

        return {
          payment_date: new Date(record.date * 1000).toISOString().slice(0, 10),
          value: record.amount,
        }
      })
      .filter((item): item is DividendRecord => Boolean(item))
      .sort((left, right) => left.payment_date.localeCompare(right.payment_date))

    const companyName = typeof result?.meta?.longName === 'string'
      ? result.meta.longName
      : typeof result?.meta?.shortName === 'string'
        ? result.meta.shortName
        : null

    return {
      ticker: normalizedTicker,
      company_name: companyName,
      source: 'yahoo_finance',
      dividends: dividends.slice(-requestedCount),
      requested_count: requestedCount,
    }
  } catch (error) {
    console.error('Erro ao buscar dividendos no Yahoo Finance:', error)
    return {
      ticker: normalizedTicker,
      company_name: null,
      source: 'yahoo_finance',
      dividends: [],
      requested_count: requestedCount,
      error: 'Falha ao consultar o Yahoo Finance.',
    }
  }
}

async function readRequestBody(req: Request): Promise<ChatRequestBody> {
  try {
    return (await req.json()) as ChatRequestBody
  } catch {
    return {}
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!bearerToken) {
      return jsonResponse({ error: 'Você precisa estar autenticado para usar o chat.' }, 401)
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(bearerToken)

    if (userError || !userData?.user) {
      console.error('Erro ao validar JWT:', userError)
      return jsonResponse({ error: 'Não foi possível validar sua sessão. Faça login novamente.' }, 401)
    }

    const body = await readRequestBody(req)
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    const history = normalizeHistory(body.history)
    const detectedTicker = detectTicker(message)
    const wantsCurrentPrice = isPriceQuestion(message)
    const wantsDividends = isDividendQuestion(message)
    const requestedDividendCount = extractRequestedDividendCount(message)

    if (!message) {
      return jsonResponse({ error: 'Envie uma mensagem para continuar.' }, 400)
    }

    if (!userId) {
      return jsonResponse({ error: 'ID do usuário não informado.' }, 400)
    }

    if (userData.user.id !== userId) {
      return jsonResponse({ error: 'Você não tem permissão para acessar os dados de outro usuário.' }, 403)
    }

    const [{ data: transactionsData, error: transactionsError }, { data: watchlistData, error: watchlistError }, { data: profileData, error: profileError }] = await Promise.all([
      supabase
        .from('transactions')
        .select('id, user_id, stock_id, type, quantity, price, total, date, created_at, updated_at')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('user_watchlist')
        .select('id, user_id, stock_id')
        .eq('user_id', userId),
      supabase
        .from('users')
        .select('id, name, last_name, email')
        .eq('id', userId)
        .maybeSingle(),
    ])

    if (transactionsError) throw transactionsError
    if (watchlistError) throw watchlistError
    if (profileError) throw profileError

    const transactions = Array.isArray(transactionsData) ? transactionsData : []
    const watchlist = Array.isArray(watchlistData) ? watchlistData : []

    const stockIds = new Set<string>()
    for (const item of [...transactions, ...watchlist]) {
      const stockId = String((item as { stock_id?: unknown }).stock_id ?? '').trim()
      if (stockId) {
        stockIds.add(stockId)
      }
    }

    const stockMap = new Map<string, { ticker: string; company_name: string }>()

    if (stockIds.size > 0) {
      const { data: stocksData, error: stocksError } = await supabase
        .from('stocks')
        .select('id, ticker, company_name')
        .in('id', [...stockIds])

      if (stocksError) throw stocksError

      for (const stock of stocksData ?? []) {
        const stockRecord = stock as { id?: unknown; ticker?: unknown; company_name?: unknown }
        const stockId = String(stockRecord.id ?? '').trim()

        if (!stockId) continue

        stockMap.set(stockId, {
          ticker: typeof stockRecord.ticker === 'string' ? stockRecord.ticker : '',
          company_name: typeof stockRecord.company_name === 'string' ? stockRecord.company_name : '',
        })
      }
    }

    const userContext = {
      user_id: userId,
      profile: profileData ?? null,
      transactions_count: transactions.length,
      watchlist_count: watchlist.length,
      transactions: transactions.map((transaction) => {
        const transactionRecord = transaction as Record<string, unknown>
        const stockId = String(transactionRecord.stock_id ?? '')
        const stockInfo = stockMap.get(stockId)

        return {
          id: transactionRecord.id ?? null,
          stock_id: stockId || null,
          ticker: stockInfo?.ticker ?? null,
          company_name: stockInfo?.company_name ?? null,
          type: transactionRecord.type ?? null,
          quantity: transactionRecord.quantity ?? null,
          price: toMoney(transactionRecord.price),
          total: toMoney(transactionRecord.total),
          date: transactionRecord.date ?? null,
          created_at: transactionRecord.created_at ?? null,
          updated_at: transactionRecord.updated_at ?? null,
        }
      }),
      watchlist: watchlist.map((item) => {
        const watchItem = item as Record<string, unknown>
        const stockId = String(watchItem.stock_id ?? '')
        const stockInfo = stockMap.get(stockId)

        return {
          id: watchItem.id ?? null,
          stock_id: stockId || null,
          ticker: stockInfo?.ticker ?? null,
          company_name: stockInfo?.company_name ?? null,
        }
      }),
    }

    let marketQuote: MarketQuote | null = null
    let dividendSnapshot: DividendSnapshot | null = null

    if (wantsCurrentPrice && detectedTicker) {
      marketQuote = await fetchCurrentQuote(detectedTicker)
    }

    if (wantsDividends && detectedTicker) {
      dividendSnapshot = await fetchDividendHistory(detectedTicker, requestedDividendCount)
    }

    const conversationHistory = history
      .map((item) => `${item.role === 'assistant' ? 'Assistente' : 'Usuário'}: ${item.text}`)
      .join('\n')

    const prompt = [
      'CONTEXTO DO SISTEMA',
      SYSTEM_CONTEXT,
      'DADOS DO USUÁRIO',
      JSON.stringify(userContext, null, 2),
      'HISTÓRICO DA CONVERSA',
      conversationHistory || 'Sem histórico anterior.',
      'MENSAGEM ATUAL',
      message,
      'COTAÇÃO ATUAL CONSULTADA',
      marketQuote ? JSON.stringify(marketQuote, null, 2) : 'Nenhuma cotação consultada.',
      'DIVIDENDOS CONSULTADOS',
      dividendSnapshot ? JSON.stringify(dividendSnapshot, null, 2) : 'Nenhum dividendo consultado.',
      'REGRAS ADICIONAIS',
      'Use apenas o contexto fornecido. Se houver cotações ou dividendos consultados, reporte os números com exatidão. Não invente cotações, dividendos ou outros dados de mercado em tempo real. Se a pergunta pedir preço atual ou dividendos e o ticker não puder ser detectado ou a consulta falhar, diga isso claramente.',
    ].join('\n\n')

    if (wantsCurrentPrice && detectedTicker && marketQuote?.error) {
      return jsonResponse(
        {
          error: `Não consegui consultar a cotação de ${detectedTicker} no momento. Tente novamente em alguns instantes.`,
          details: {
            ticker: detectedTicker,
            source: 'brapi',
            provider_error: marketQuote.error,
          },
        },
        502
      )
    }

    if (wantsCurrentPrice && detectedTicker && marketQuote && marketQuote.current_price === null) {
      return jsonResponse(
        {
          error: `Não consegui obter um preço válido para ${detectedTicker}.`,
          details: {
            ticker: detectedTicker,
            source: 'brapi',
          },
        },
        502
      )
    }

    if (wantsDividends && detectedTicker && dividendSnapshot?.error) {
      return jsonResponse(
        {
          error: `Não consegui consultar os dividendos de ${detectedTicker} no momento. Tente novamente em alguns instantes.`,
          details: {
            ticker: detectedTicker,
            source: 'yahoo_finance',
            provider_error: dividendSnapshot.error,
          },
        },
        502
      )
    }

    if (wantsDividends && detectedTicker && dividendSnapshot && dividendSnapshot.dividends.length === 0) {
      return jsonResponse(
        {
          error: `Não encontrei dividendos recentes para ${detectedTicker}.`,
          details: {
            ticker: detectedTicker,
            source: 'yahoo_finance',
          },
        },
        502
      )
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Erro Gemini:', geminiResponse.status, errorText)
      return jsonResponse(
        {
          error: 'Não foi possível gerar a resposta agora. Tente novamente em instantes.',
          details: {
            provider: 'gemini',
            status: geminiResponse.status,
          },
        },
        502
      )
    }

    const geminiData = await geminiResponse.json()
    const answer = extractGeminiText(geminiData)

    if (!answer) {
      console.error('Gemini retornou resposta vazia:', JSON.stringify(geminiData))
      return jsonResponse(
        {
          error: 'O assistente não retornou uma resposta válida.',
          details: { provider: 'gemini', status: 502 },
        },
        502
      )
    }

    return jsonResponse({
      answer,
      data: {
        ticker: marketQuote?.ticker ?? null,
        current_price: marketQuote?.current_price ?? null,
        company_name: marketQuote?.company_name ?? null,
        currency: marketQuote?.currency ?? 'BRL',
        source: marketQuote?.source ?? null,
        updated_at: marketQuote?.updated_at ?? null,
        dividend_ticker: dividendSnapshot?.ticker ?? null,
        dividend_company_name: dividendSnapshot?.company_name ?? null,
        dividend_source: dividendSnapshot?.source ?? null,
        dividend_requested_count: dividendSnapshot?.requested_count ?? null,
        dividends: dividendSnapshot?.dividends ?? null,
      },
    })
  } catch (error) {
    console.error('Erro na função chat:', error)
    return jsonResponse(
      {
        error: 'Não consegui responder agora. Tente novamente em alguns instantes.',
      },
      500
    )
  }
})