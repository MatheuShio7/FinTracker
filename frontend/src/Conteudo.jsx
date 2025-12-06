import { useState } from 'react'
import './Conteudo.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import 'bootstrap-icons/font/bootstrap-icons.css'

function Conteudo() {
  const [selectedArticle, setSelectedArticle] = useState(null)

  const articles = [
    {
      id: 1,
      title: 'O que é a B3 e Como Investir na Bolsa Brasileira',
      preview: 'A B3 (Brasil, Bolsa, Balcão) é a bolsa de valores oficial do Brasil. Pense nela como um grande mercado organizado onde empresas colocam suas ações à venda e investidores podem comprá-las. Quando você compra uma ação, está adquirindo uma pequena parte de uma empresa e pode lucrar com a valorização dessas ações ou com o pagamento de dividendos.',
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