import { useState } from 'react'
import './Conteudo.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import 'bootstrap-icons/font/bootstrap-icons.css'

function Conteudo() {
  const [selectedArticle, setSelectedArticle] = useState(null)

  const videos = [
    {
      id: 1,
      title: 'Como analisar ações de maneira simples e rápida?',
      description: 'Descubra uma forma simples e direta de analisar empresas antes de investir. Este conteúdo apresenta os principais indicadores que realmente importam para entender a saúde financeira e o potencial de crescimento de uma ação. Ideal para quem quer investir com mais segurança e clareza, sem depender de análises complexas.',
      videoId: 'bkcMlHEtXsI'
    },
    {
      id: 2,
      title: 'Ações 3, 4, 5, 6, 11 ou F: Como Não Perder Dinheiro com Essas Diferenças!',
      description: 'Entenda de uma vez por todas o significado dos diferentes finais dos tickers da B3, como 3, 4, 5, 6, 11 e F. Esta explicação mostra como cada código representa um tipo específico de ação e como isso afeta direitos, dividendos e até liquidez. Perfeito para quem quer comprar ações com mais consciência e evitar confusões na hora de investir.',
      videoId: 'esEh3f3x_zw'
    },
    {
      id: 3,
      title: 'A Melhor Ação de Cada Setor Perene da Bolsa de Valores',
      description: 'Conheça ações de setores considerados mais estáveis e resilientes da bolsa brasileira. A análise destaca empresas que se sobressaem em seus segmentos e mostra por que podem ser boas opções para quem busca construir uma carteira sólida e focada no longo prazo. Uma ótima escolha para quem valoriza consistência e segurança.',
      videoId: 'oychy3VVzv0'
    }
  ]

  const books = [
    {
      id: 1,
      title: 'O Investidor Inteligente',
      author: 'Benjamin Graham',
      description: 'Graham ensina você a investir com segurança e inteligência, focando no verdadeiro valor das empresas em vez de seguir a manada do mercado. Você aprenderá a identificar ações subvalorizadas, proteger seu capital e tomar decisões racionais mesmo quando o mercado enlouquece. É impossível se tornar um investidor sério sem conhecer estes princípios fundamentais - este livro mudará para sempre a forma como você enxerga o mercado de ações.',
      highlight: 'A bíblia do value investing que transformou Warren Buffett no maior investidor do mundo.',
      image: '/o_investidor_inteligente.jpg',
      link: 'https://amzn.to/48oJov8'
    },
    {
      id: 2,
      title: 'O Jeito Peter Lynch de Investir',
      author: 'Peter Lynch',
      description: 'Lynch prova que você não precisa ser um gênio de Wall Street para ganhar dinheiro com ações. Ele mostra como encontrar oportunidades incríveis no seu dia a dia - no shopping, no supermercado, observando o que você e sua família consomem. Com linguagem descomplicada e exemplos práticos, você aprenderá a identificar empresas com potencial explosivo antes que o mercado as descubra. Se Graham te ensina a pensar, Lynch te ensina a agir - transformando teoria em prática de forma simples e lucrativa.',
      highlight: 'Descubra como um dos gestores mais bem-sucedidos da história encontrava ações vencedoras nos lugares mais inusitados.',
      image: '/o_jeito_peter_lynch_de_investir.jpg',
      link: 'https://amzn.to/48pHevl'
    },
    {
      id: 3,
      title: 'Ações Comuns, Lucros Extraordinários',
      author: 'Philip Fisher',
      description: 'Fisher revela a arte de avaliar o que realmente importa: qualidade da gestão, capacidade de inovação e vantagem competitiva sustentável. Este é o método que influenciou Warren Buffett a não apenas comprar empresas baratas, mas sim empresas extraordinárias. Você aprenderá a diferença entre uma boa empresa e uma grande empresa - e como essa diferença pode multiplicar sua riqueza exponencialmente. Fisher completa sua educação revelando a dimensão qualitativa dos investimentos, a peça que faltava para você entender não apenas quando comprar, mas o que faz uma ação valer a pena segurar por décadas.',
      highlight: 'O livro que ensina o que os números não revelam: como identificar empresas verdadeiramente excepcionais.',
      image: '/acoes_comuns_lucros_extraortinarios.jpg',
      link: 'https://amzn.to/3XFNOYs'
    }
  ]

  const articles = [
    {
      id: 1,
      title: 'O que é a B3 e Como Investir na Bolsa Brasileira',
      preview: 'A B3 (Brasil, Bolsa, Balcão) é a bolsa de valores oficial do Brasil. Pense nela como um grande mercado organizado onde empresas colocam suas ações à venda e investidores podem comprá-las. Quando você compra uma ação, está adquirindo uma pequena parte de uma empresa e pode lucrar com a valorização dessas ações ou com o pagamento de dividendos...',
      image: '/b3.jpg',
      content: `
## Entendendo a B3

A B3 (Brasil, Bolsa, Balcão) é a bolsa de valores oficial do Brasil. Pense nela como um grande mercado organizado onde empresas colocam suas ações à venda e investidores podem comprá-las. Quando você compra uma ação, está adquirindo uma pequena parte de uma empresa e pode lucrar com a valorização dessas ações ou com o pagamento de dividendos.

Fundada em 2017 a partir da fusão entre a BM&FBovespa e a Cetip, a B3 é uma das maiores bolsas de valores do mundo e sedia a negociação de ações de grandes empresas brasileiras como Petrobras, Vale, Itaú, Ambev e muitas outras.

## Por que Investir em Ações?

Investir na bolsa pode parecer arriscado para iniciantes, mas oferece oportunidades interessantes:

- **Potencial de retorno superior** à poupança e outros investimentos conservadores no longo prazo
- **Recebimento de dividendos**: algumas empresas distribuem parte dos lucros aos acionistas
- **Proteção contra a inflação**: ações tendem a acompanhar o crescimento da economia
- **Participação no crescimento das empresas**: você se torna sócio de negócios estabelecidos

## Primeiros Passos para Investir

### 1. Abra uma Conta em uma Corretora

Para investir na B3, você precisa de uma corretora de valores, que é a intermediária entre você e a bolsa. Existem diversas opções no mercado brasileiro, como XP, Rico, Clear, BTG Pactual, entre outras. A maioria não cobra taxa de abertura de conta.

**O que avaliar ao escolher:**

- Taxas de corretagem (algumas são gratuitas)
- Qualidade da plataforma
- Atendimento e suporte
- Materiais educativos disponíveis

### 2. Transfira Dinheiro para a Corretora

Após abrir sua conta, você precisará fazer uma transferência bancária (TED ou PIX) da sua conta corrente para a conta da corretora. O dinheiro ficará disponível para investimentos.

### 3. Escolha Suas Ações

Para iniciantes, algumas dicas importantes:

- **Estude antes de investir**: pesquise sobre as empresas, seus resultados financeiros e perspectivas
- **Diversifique**: não coloque todo seu dinheiro em uma única ação
- **Comece com empresas conhecidas**: empresas consolidadas costumam ser menos voláteis
- **Invista apenas o que pode perder**: nunca invista dinheiro que você vai precisar no curto prazo

### 4. Faça Seu Primeiro Pedido

Na plataforma da corretora, você pode comprar ações usando o código da empresa (ticker). Por exemplo: PETR4 (Petrobras), VALE3 (Vale), ITUB4 (Itaú). O número final indica o tipo de ação (3 para ordinária, 4 para preferencial).

Você pode fazer dois tipos de ordem:

- **Ordem a mercado**: compra pelo preço atual
- **Ordem limitada**: você define o preço máximo que quer pagar

## Conceitos Importantes

**Home Broker**: É a plataforma online onde você realiza as operações de compra e venda.

**Ibovespa**: É o principal índice da B3, que mede o desempenho médio das ações mais negociadas.

**Dividendos**: Parte do lucro que as empresas distribuem aos acionistas, geralmente de forma trimestral ou anual.

**Custódia**: Taxa que algumas corretoras cobram para guardar suas ações (muitas já não cobram mais).

## Dicas Finais para Iniciantes

1. **Comece pequeno**: não há valor mínimo, você pode começar com R$ 100 ou R$ 200
2. **Pense no longo prazo**: a bolsa oscila diariamente, mas tende a crescer ao longo dos anos
3. **Continue estudando**: leia relatórios, acompanhe notícias econômicas e aprenda continuamente
4. **Considere fundos de ações**: se não quer escolher ações individuais, pode investir em fundos geridos por profissionais
5. **Controle suas emoções**: não entre em pânico com quedas nem em euforia com altas

## Cuidados e Riscos

Investir em ações envolve riscos. O valor das suas ações pode cair, e você pode ter prejuízo. Por isso:

- Não invista dinheiro de emergência
- Diversifique seus investimentos
- Desconfie de promessas de lucro garantido
- Evite operar no curto prazo sem conhecimento (day trade é muito arriscado)

## Conclusão

A B3 oferece oportunidades reais para você fazer seu dinheiro crescer e participar do desenvolvimento das maiores empresas do Brasil. Com conhecimento, disciplina e paciência, investir na bolsa pode ser uma excelente forma de construir patrimônio no longo prazo.

Lembre-se: todo grande investidor começou do zero. O importante é dar o primeiro passo com conhecimento e responsabilidade!
      `
    },
    {
      id: 2,
      title: 'Como Criar uma Estratégia de Longo Prazo',
      preview: 'Investir no longo prazo significa comprar ações de empresas sólidas e mantê-las por anos, independentemente das oscilações diárias do mercado. Essa estratégia, conhecida como "buy and hold" (comprar e manter), é considerada uma das formas mais consistentes de construir patrimônio na bolsa de valores...',
      image: '/longo_prazo.png',
      content: `
## O que é Investir no Longo Prazo?

Investir no longo prazo significa comprar ações de empresas sólidas e mantê-las por anos, independentemente das oscilações diárias do mercado. Essa estratégia, conhecida como "buy and hold" (comprar e manter), é considerada uma das formas mais consistentes de construir patrimônio na bolsa de valores.

Diferente de quem tenta lucrar com operações rápidas (day trade), o investidor de longo prazo foca no crescimento sustentável das empresas ao longo dos anos, beneficiando-se da valorização das ações e do recebimento de dividendos.

## Por que Investir no Longo Prazo?

O tempo é o maior aliado do investidor em ações. Veja por quê:

**Redução de riscos**: No curto prazo, a bolsa oscila muito devido a notícias, especulações e humor do mercado. No longo prazo, essas oscilações se diluem e o que prevalece é o resultado real das empresas.

**Poder dos juros compostos**: Ao reinvestir os dividendos recebidos, você compra mais ações, que geram mais dividendos, criando um efeito bola de neve positivo.

**Menos estresse**: Você não precisa acompanhar o mercado todos os dias nem se preocupar com cada queda temporária.

**Histórico favorável**: Dados históricos mostram que, em períodos de 10 anos ou mais, a bolsa brasileira tende a superar investimentos conservadores como a poupança.

## Passo a Passo para Criar Sua Estratégia

### 1. Defina Seus Objetivos Financeiros

Antes de começar, pergunte-se:

- Para que estou investindo? (aposentadoria, comprar um imóvel, independência financeira)
- Quando vou precisar desse dinheiro? (5, 10, 20 anos)
- Quanto posso investir mensalmente?

Ter clareza sobre seus objetivos ajuda a manter o foco e a disciplina, especialmente nos momentos de queda do mercado.

### 2. Determine Seu Perfil de Risco

Mesmo no longo prazo, é importante conhecer sua tolerância a oscilações:

**Conservador**: Prefere empresas consolidadas (blue chips) que pagam bons dividendos regularmente.

**Moderado**: Mistura empresas consolidadas com algumas de médio porte com potencial de crescimento.

**Arrojado**: Aceita maior exposição a empresas menores (small caps) em troca de potencial de valorização maior.

Seja honesto consigo mesmo. Se você não consegue dormir tranquilo vendo sua carteira cair 20%, talvez precise de uma estratégia mais conservadora.

### 3. Escolha Setores Diversificados

Não coloque todos os ovos na mesma cesta. Uma boa estratégia de longo prazo inclui empresas de diferentes setores da economia:

- **Bancos**: Itaú, Bradesco, Banco do Brasil
- **Energia**: Petrobras, Equatorial, Taesa
- **Varejo**: Magazine Luiza, Lojas Renner, Carrefour
- **Commodities**: Vale, Suzano, Gerdau
- **Consumo**: Ambev, JBS, BRF
- **Telecomunicações**: Telefônica Brasil (Vivo), TIM

Diversificar ajuda a proteger sua carteira. Se um setor passa por dificuldades, outros podem compensar.

### 4. Selecione Empresas Sólidas

Para o longo prazo, priorize empresas com:

- **Histórico consistente**: Pelo menos 10 anos de operação com lucros
- **Boa governança**: Gestão transparente e profissional
- **Vantagens competitivas**: Marcas fortes, liderança de mercado, tecnologia
- **Geração de caixa**: Capacidade de pagar dividendos regularmente
- **Baixo endividamento**: Dívidas controladas em relação ao patrimônio

Evite empresas com problemas recorrentes, gestão questionável ou que dependem de um único produto ou cliente.

### 5. Defina Quanto Investir em Cada Ação

Uma regra prática para iniciantes é:

- Invista em pelo menos 8 a 12 empresas diferentes
- Não coloque mais de 15% do seu capital em uma única empresa
- Mantenha entre 20% e 30% em empresas pagadoras de dividendos
- Reserve uma parte para empresas de crescimento

Por exemplo, se você tem R$ 10.000 para investir:

- 5 empresas com R$ 1.500 cada (15% cada)
- 5 empresas com R$ 500 cada (5% cada)

### 6. Estabeleça um Plano de Aportes Regulares

A consistência é fundamental. Defina um valor mensal que você consegue investir confortavelmente, mesmo que seja R$ 200 ou R$ 300.

**Vantagem do aporte regular**: Você compra mais ações quando o preço está baixo e menos quando está alto, equilibrando seu preço médio ao longo do tempo (estratégia chamada de "preço médio").

### 7. Reinvista os Dividendos

Quando receber dividendos, não gaste esse dinheiro. Use-o para comprar mais ações, seja da mesma empresa ou de outras na sua carteira. Esse reinvestimento acelera o crescimento do seu patrimônio.

## Mantendo a Disciplina

### Ignore as Oscilações Diárias

A bolsa pode cair 5% em um dia e subir 3% no outro. Isso é normal. Como investidor de longo prazo, você não deve tomar decisões baseadas em movimentos de curto prazo.

### Revise Sua Carteira Periodicamente

Faça uma análise trimestral ou semestral:

- As empresas continuam com bons fundamentos?
- Alguma empresa teve mudança significativa na gestão ou no negócio?
- Sua diversificação ainda está equilibrada?

Não confunda revisar com mexer toda hora. Pequenos ajustes são suficientes.

### Rebalanceie Quando Necessário

Se uma ação cresceu muito e agora representa 30% da sua carteira (quando deveria ser 15%), considere vender um pouco e realocar em outras ações que estão com peso menor.

### Mantenha uma Reserva de Emergência

Nunca invista na bolsa o dinheiro que você pode precisar nos próximos 2 a 3 anos. Mantenha uma reserva de emergência em investimentos mais líquidos (Tesouro Selic, CDBs de liquidez diária). Isso evita que você precise vender ações no pior momento.

## Erros que Você Deve Evitar

**Vender no pânico**: Quando a bolsa cai, muitos iniciantes vendem com prejuízo. O investidor de longo prazo vê quedas como oportunidades de compra.

**Buscar a ação da moda**: Aquela empresa que todos estão comentando pode não ser a melhor escolha. Faça sua própria análise.

**Tentar prever o mercado**: Ninguém sabe quando a bolsa vai subir ou cair. Invista regularmente, independente do momento.

**Trocar de estratégia constantemente**: Hoje segue uma dica, amanhã outra. Tenha um plano e seja fiel a ele.

**Não estudar**: O mercado evolui, empresas mudam. Continue aprendendo sempre.

## Expectativas Realistas

No longo prazo (10 anos ou mais), é razoável esperar que uma carteira diversificada de ações brasileiras renda entre 12% e 18% ao ano, considerando valorização e dividendos. Alguns anos serão excelentes, outros podem ser negativos, mas o que importa é o resultado acumulado.

Lembre-se: você não ficará rico da noite para o dia, mas com disciplina e paciência, pode construir um patrimônio significativo.

## Conclusão

Criar uma estratégia de longo prazo para investir em ações não é complicado, mas exige planejamento, disciplina e educação contínua. Comece pequeno, seja consistente nos aportes, diversifique bem e tenha paciência.

Os maiores investidores do mundo, como Warren Buffett, construíram suas fortunas pensando em décadas, não em dias. Você pode fazer o mesmo, adaptando os princípios à realidade brasileira e ao seu bolso.

O melhor momento para começar foi há 10 anos. O segundo melhor momento é agora!
      `
    },
    {
      id: 3,
      title: 'Impostos sobre Ações: O que Você Precisa Saber',
      preview: 'Investir em ações pode gerar lucros, e sobre esses lucros há incidência de imposto de renda. Muitos iniciantes ficam receosos com essa parte, mas a boa notícia é que a tributação sobre ações no Brasil tem regras claras e, em alguns casos, até isenções que beneficiam o pequeno investidor...',
      image: '/impostos.png',
      content: `
## Introdução aos Impostos sobre Ações

Investir em ações pode gerar lucros, e sobre esses lucros há incidência de imposto de renda. Muitos iniciantes ficam receosos com essa parte, mas a boa notícia é que a tributação sobre ações no Brasil tem regras claras e, em alguns casos, até isenções que beneficiam o pequeno investidor.

Entender como funcionam os impostos é fundamental para evitar surpresas e se manter em conformidade com a Receita Federal. Neste guia, vamos explicar tudo de forma simples e prática.

## O Básico: Quando Há Imposto?

O imposto de renda sobre ações incide apenas quando você **vende as ações com lucro**. Enquanto você mantém as ações na carteira, mesmo que elas valorizem muito, não há imposto a pagar. O imposto só é devido quando você realiza o lucro através da venda.

**Exemplo prático**: Você comprou 100 ações da Petrobras por R$ 30 cada (total: R$ 3.000). Dois anos depois, vende essas ações por R$ 40 cada (total: R$ 4.000). Seu lucro foi de R$ 1.000, e é sobre esse valor que pode incidir o imposto.

## A Grande Notícia: Isenção para Pequenos Investidores

Aqui está a melhor parte para quem está começando: **vendas de até R$ 20.000 por mês em ações são isentas de imposto de renda**.

Isso significa que se você vendeu R$ 15.000 em ações durante todo o mês de janeiro e teve lucro, não precisa pagar imposto sobre esse ganho. A isenção é calculada pelo **valor de venda**, não pelo lucro.

**Atenção**: Essa isenção vale apenas para o mercado à vista (compra e venda normal de ações). Operações de day trade (compra e venda no mesmo dia) não têm essa isenção.

## Quando Você Precisa Pagar Imposto

Se suas vendas no mês ultrapassarem R$ 20.000, você pagará imposto sobre o lucro obtido nessas operações. A alíquota é de **15% sobre o lucro**.

**Exemplo**:

- Você vendeu R$ 25.000 em ações no mês
- Comprou essas ações por R$ 20.000
- Lucro: R$ 5.000
- Imposto: 15% de R$ 5.000 = R$ 750

**Importante**: O limite de R$ 20.000 é por mês. Se você vender R$ 15.000 em janeiro e R$ 15.000 em fevereiro, ambas as operações são isentas, pois cada mês ficou abaixo do limite.

## Day Trade: Regras Diferentes

Para operações de day trade (comprar e vender no mesmo dia), as regras são mais rígidas:

- **Não há isenção** de R$ 20.000
- A alíquota é de **20% sobre o lucro** (maior que operações normais)
- Há retenção automática de 1% na fonte pela corretora

Day trade é uma operação de alto risco e não é recomendada para iniciantes. A tributação mais pesada é mais um motivo para evitá-la.

## Como Calcular e Pagar o Imposto

### 1. Controle Suas Operações

Você precisa anotar todas as compras e vendas:

- Data da operação
- Quantidade de ações
- Preço de compra
- Preço de venda
- Taxas e corretagens

A maioria das corretoras fornece relatórios mensais que facilitam esse controle, mas a responsabilidade de calcular e pagar o imposto é sua.

### 2. Calcule o Lucro do Mês

Some todas as vendas do mês. Se ultrapassaram R$ 20.000, calcule o lucro:

**Lucro = Preço de Venda - Preço de Compra - Custos (corretagem, taxas)**

### 3. Aplique a Alíquota

Se houve lucro e as vendas ultrapassaram R$ 20.000:
**Imposto devido = Lucro × 15%**

### 4. Emita a DARF e Pague

O pagamento é feito através de uma DARF (Documento de Arrecadação de Receitas Federais), código 6015, até o **último dia útil do mês seguinte** ao da venda.

**Exemplo**: Vendas realizadas em março devem ter o imposto pago até o último dia útil de abril.

Você pode emitir a DARF pelo site da Receita Federal ou através de programas das corretoras.

## Prejuízos: Como Funciona a Compensação

Se você vendeu ações com prejuízo, pode compensar esse prejuízo com lucros futuros, reduzindo o imposto a pagar.

**Exemplo**:

- Em janeiro, você teve prejuízo de R$ 2.000
- Em fevereiro, vendeu mais de R$ 20.000 e teve lucro de R$ 5.000
- Imposto: 15% de (R$ 5.000 - R$ 2.000) = 15% de R$ 3.000 = R$ 450

**Regras importantes**:

- Prejuízos podem ser compensados indefinidamente, sem prazo de validade
- Você deve manter o registro dos prejuízos acumulados
- Prejuízos de operações normais não podem compensar lucros de day trade e vice-versa

## E os Dividendos?

Boa notícia: **dividendos recebidos de ações brasileiras são isentos de imposto de renda**.

Quando uma empresa distribui dividendos aos acionistas, você recebe o valor líquido, sem necessidade de pagar imposto ou declarar como rendimento tributável. Esse é um grande benefício para quem investe em ações no Brasil.

## Declaração Anual do Imposto de Renda

Mesmo que você não tenha pago imposto (por estar dentro da isenção), precisa declarar suas ações na declaração anual se:

- Suas ações somam mais de R$ 1.000 em valor de mercado no último dia do ano
- Você teve ganhos tributáveis durante o ano

### O que Declarar

**Na ficha "Bens e Direitos"**:

- Código 31 (ações)
- CNPJ da empresa
- Quantidade de ações
- Valor de aquisição (custo total)

**Na ficha "Renda Variável"**:

- Informe as operações realizadas no ano
- Imposto pago mês a mês

**Na ficha "Rendimentos Isentos"**:

- Dividendos recebidos
- Lucros em vendas abaixo de R$ 20.000

## Ferramentas que Facilitam sua Vida

Existem programas e aplicativos que ajudam a calcular impostos sobre ações:

- **Programa da própria corretora**: Muitas oferecem relatórios prontos
- **CEI (Canal Eletrônico do Investidor)**: Site da B3 com todas suas operações
- **Aplicativos de controle**: Investidor10, Gorila, Status Invest
- **Contadores especializados**: Para quem tem carteira maior ou operações complexas

## Dicas Práticas para Não Errar

**Mantenha registros organizados**: Guarde notas de corretagem e relatórios por pelo menos 5 anos.

**Não confie apenas na memória**: Use planilhas ou aplicativos para controlar todas as operações.

**Pague em dia**: Atrasos geram multas e juros. O vencimento é sempre no último dia útil do mês seguinte.

**Declare tudo**: Mesmo operações isentas precisam ser informadas na declaração anual.

**Guarde os comprovantes de pagamento**: Mantenha as DARFs pagas como comprovação.

**Atenção ao custo de aquisição**: Use o preço médio se comprou a mesma ação em momentos diferentes.

## Cálculo do Preço Médio

Se você comprou ações da mesma empresa em datas e preços diferentes, precisa calcular o preço médio para saber o lucro quando vender.

**Exemplo**:

- Comprou 100 ações a R$ 30 = R$ 3.000
- Comprou mais 50 ações a R$ 36 = R$ 1.800
- Total investido: R$ 4.800 em 150 ações
- Preço médio: R$ 4.800 ÷ 150 = R$ 32 por ação

Quando vender essas ações, usará R$ 32 como preço de compra para calcular o lucro.

## Penalidades por Não Declarar ou Não Pagar

A Receita Federal cruza dados das corretoras e da B3. Não declarar ou não pagar o imposto pode resultar em:

- Multa de 50% a 150% do imposto devido
- Multa por atraso na declaração (mínimo de R$ 165,74)
- Juros sobre valores não pagos
- Malha fina e fiscalização

Vale muito mais a pena manter tudo em ordem desde o início.

## Casos Especiais

**Bonificações e desdobramentos**: Não geram imposto no recebimento, mas alteram seu preço médio.

**Subscrição de ações**: O valor pago na subscrição entra no cálculo do preço médio.

**Transferência por herança ou doação**: Há regras específicas, consulte um contador.

## Conclusão

A tributação sobre ações no Brasil pode parecer complicada no início, mas seguindo as regras básicas você não terá problemas:

1. Vendas até R$ 20.000 por mês são isentas
2. Acima desse valor, pague 15% sobre o lucro
3. Pague até o último dia útil do mês seguinte
4. Declare tudo na declaração anual
5. Guarde todos os registros

A isenção para pequenos investidores é muito generosa e beneficia quem está começando. À medida que sua carteira cresce, considere usar ferramentas ou contratar um contador para facilitar o controle.

Lembre-se: pagar impostos corretamente é parte de ser um investidor responsável e evita dores de cabeça futuras com a Receita Federal!
      `
    }
  ]

  const openModal = (article) => {
    setSelectedArticle(article)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setSelectedArticle(null)
    document.body.style.overflow = 'auto'
  }

  const renderMarkdown = (text) => {
    const lines = text.trim().split('\n')
    const elements = []
    let currentList = []
    
    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('## ')) {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{currentList}</ul>)
          currentList = []
        }
        elements.push(<h2 key={index}>{line.replace('## ', '')}</h2>)
      } else if (line.startsWith('### ')) {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{currentList}</ul>)
          currentList = []
        }
        elements.push(<h3 key={index}>{line.replace('### ', '')}</h3>)
      }
      // List items
      else if (line.startsWith('- ')) {
        const content = line.replace('- ', '')
        const parts = content.split(/(\*\*.*?\*\*)/)
        const formattedContent = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>
          }
          return part
        })
        currentList.push(<li key={index}>{formattedContent}</li>)
      }
      // Bold text
      else if (line.includes('**')) {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{currentList}</ul>)
          currentList = []
        }
        const parts = line.split(/(\*\*.*?\*\*)/)
        const formattedLine = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>
          }
          return part
        })
        elements.push(<p key={index}>{formattedLine}</p>)
      }
      // Empty line
      else if (line.trim() === '') {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{currentList}</ul>)
          currentList = []
        }
      }
      // Regular paragraph
      else if (line.trim()) {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{currentList}</ul>)
          currentList = []
        }
        elements.push(<p key={index}>{line}</p>)
      }
    })
    
    if (currentList.length > 0) {
      elements.push(<ul key="ul-final">{currentList}</ul>)
    }
    
    return elements
  }

  return (
    <div className="conteudo-page">
      <Logo />
      <PageTitle title="Conteúdo" />
      
      <div className="conteudo-container">
        <section className="content-section">
          <h2 className="section-title">Artigos</h2>
          
          <div className="articles-grid">
            {articles.map(article => (
              <div key={article.id} className="article-card">
                <div className="article-content">
                  <h3 className="article-title">{article.title}</h3>
                  <p className="article-preview">{article.preview}</p>
                  <button 
                    className="article-button"
                    onClick={() => openModal(article)}
                  >
                    Ver mais
                  </button>
                </div>
                <div className="article-image-container">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="article-image"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section books-section">
          <h2 className="section-title">Livros</h2>

          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card">
                <div className="book-image-container">
                  <img 
                    src={book.image} 
                    alt={book.title}
                    className="book-image"
                  />
                </div>
                <div className="book-content">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <p className="book-highlight">{book.highlight}</p>
                  <p className="book-description">{book.description}</p>
                  <a 
                    href={book.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="book-button"
                  >
                    Ver mais
                  </a>
                </div>
              </div>
            ))}
          </div>

          <p className="books-intro">
            Juntos, esses três livros formam a base completa para você se tornar um investidor de sucesso: a disciplina de Graham, a praticidade de Lynch e a visão estratégica de Fisher. Não é exagero dizer que estes são os pilares sobre os quais os maiores patrimônios do mercado de ações foram construídos.
          </p>
        </section>

        <section className="content-section videos-section">
          <h2 className="section-title">Vídeos</h2>
          
          <div className="videos-grid">
            {videos.map(video => (
              <div key={video.id} className="video-card">
                <div className="video-embed-container">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="video-embed"
                  ></iframe>
                </div>
                <div className="video-content">
                  <h3 className="video-title">{video.title}</h3>
                  <p className="video-description">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selectedArticle && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="modal-header">
              <img 
                src={selectedArticle.image} 
                alt={selectedArticle.title}
                className="modal-image"
              />
              <h2 className="modal-title">{selectedArticle.title}</h2>
            </div>
            <div className="modal-body">
              {renderMarkdown(selectedArticle.content)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Conteudo 