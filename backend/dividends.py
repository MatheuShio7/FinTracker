import yfinance as yf

def buscar_dividendos(ticker):
    """
    Busca o histórico de dividendos de uma ação usando Yahoo Finance
    
    Args:
        ticker (str): Símbolo da ação (ex: PETR4.SA, VALE3.SA)
    """
    
    try:
        # Adiciona .SA para ações brasileiras se não estiver presente
        if not ticker.endswith('.SA'):
            ticker = ticker + '.SA'
        
        # Cria um objeto Ticker
        acao = yf.Ticker(ticker)
        
        print(f"\n{'='*60}")
        print(f"Histórico de Dividendos de {ticker}")
        print(f"{'='*60}\n")
        
        # Obtém o histórico de dividendos
        dividendos = acao.dividends
        
        if dividendos.empty:
            print("Nenhum dividendo encontrado para esta ação.")
        else:
            # Filtra apenas dividendos com valor maior que 0
            dividendos_validos = dividendos[dividendos > 0]
            
            # Pega apenas os últimos 12 dividendos válidos
            ultimos_12 = dividendos_validos.tail(12)
            
            if ultimos_12.empty:
                print("Nenhum dividendo com valor válido encontrado para esta ação.")
            else:
                # Itera sobre os dividendos
                for data, valor in ultimos_12.items():
                    data_formatada = data.strftime('%Y-%m-%d')
                    print(f"{data_formatada} | Dividendo: R$ {valor:.2f}")
        
    except Exception as e:
        print(f"Erro ao buscar dados: {e}")
        print("Verifique se o ticker está correto. Use o formato: PETR4 ou PETR4.SA")

def main():
    """Função principal"""
    print("\n" + "="*60)
    print("Consultor de Dividendos - Yahoo Finance")
    print("="*60)
    print("Digite o ticker da ação brasileira (ex: PETR4, VALE3, WEGE3)")
    
    while True:
        ticker = input("\nDigite o ticker da ação (ou 'sair' para encerrar): ").upper().strip()
        
        if ticker.lower() == 'sair':
            print("\nAté logo!")
            break
        
        if not ticker:
            print("Por favor, digite um ticker válido.")
            continue
        
        buscar_dividendos(ticker)

if __name__ == "__main__":
    main()