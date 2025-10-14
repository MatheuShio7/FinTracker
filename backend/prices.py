import requests
from datetime import datetime

TOKEN = "fuHtHs3Lr2iC1HShnRAWUY"

def convert_timestamp_to_date(timestamp):
    """Converte timestamp para formato de data (YYYY-MM-DD)"""
    return datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d')

def buscar_historico_precos(ticker, range_period="3mo", interval="1d"):
    """
    Busca o histórico de preços de uma ação
    
    Args:
        ticker (str): Símbolo da ação (ex: PETR4, VALE3)
        range_period (str): Período de dados (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        interval (str): Intervalo dos dados (1m, 5m, 15m, 30m, 60m, 1h, 1d, etc)
    """
    
    # URL da API
    url = f"https://brapi.dev/api/quote/{ticker}"
    
    # Parâmetros da requisição
    params = {
        "range": range_period,
        "interval": interval,
        # Método 1: Passando o token como query parameter
        "token": TOKEN
        # Método alternativo (descomente para usar header):
        # Use o header "Authorization" na seção de headers abaixo
    }
    
    # Headers da requisição (método alternativo de autenticação)
    headers = {
        # Descomente a linha abaixo para usar autenticação via header (mais seguro)
        # "Authorization": f"Bearer {TOKEN}"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'results' in data and len(data['results']) > 0:
                resultado = data['results'][0]
                
                print(f"\n{'='*60}")
                print(f"Histórico de Preços de {ticker}")
                print(f"{'='*60}\n")
                
                # Extraindo os dados históricos
                if 'historicalDataPrice' in resultado:
                    historico = resultado['historicalDataPrice']
                    if historico:
                        for item in historico:
                            data_formatada = convert_timestamp_to_date(item['date'])
                            fechamento = item['close']
                            print(f"{data_formatada} | Fechamento: R$ {fechamento:.2f}")
                    else:
                        print("Nenhum dado histórico disponível para este período.")
                
                # Exibir cotação atual ao final
                preco_atual = resultado.get('regularMarketPrice')
                hora_atualizacao = resultado.get('regularMarketTime')
                if preco_atual and hora_atualizacao:
                    print(f"{hora_atualizacao[:10]} | Fechamento: R$ {preco_atual:.2f}")
                else:
                    print("Sem dados históricos para este ticker.")
            else:
                print(f"Erro: Não foi possível encontrar dados para {ticker}")
                
        elif response.status_code == 401:
            print("Erro 401: Token inválido ou ausente. Verifique seu token em brapi.dev/dashboard")
        elif response.status_code == 402:
            print("Erro 402: Limite de requisições do seu plano excedido.")
        elif response.status_code == 404:
            print(f"Erro 404: A ação {ticker} não foi encontrada.")
        else:
            print(f"Erro {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Erro na requisição: {e}")

def main():
    """Função principal"""
    print("\n" + "="*60)
    print("Consultor de Preços - Brapi API")
    print("="*60)
    
    # Verificar se o token foi configurado
    if TOKEN == "SEU_TOKEN_AQUI":
        print("\nAVISO: Você precisa inserir seu token!")
        print("Edite a variável 'TOKEN' no topo do script com seu token da Brapi.")
        print("Obtenha seu token em: https://brapi.dev/dashboard")
        return
    
    while True:
        ticker = input("\nDigite o ticker da ação (ou 'sair' para encerrar): ").upper().strip()
        
        if ticker.lower() == 'sair':
            print("\nAté logo!")
            break
        
        if not ticker:
            print("Por favor, digite um ticker válido.")
            continue
        
        # Opcionalmente, perguntar pelo período e intervalo
        range_choice = input("Período (padrão: 3mo - últimos 3 meses)? Digite ou pressione Enter: ").strip() or "3mo"
        interval_choice = input("Intervalo (padrão: 1d - diário)? Digite ou pressione Enter: ").strip() or "1d"
        
        buscar_historico_precos(ticker, range_period=range_choice, interval=interval_choice)

if __name__ == "__main__":
    main()