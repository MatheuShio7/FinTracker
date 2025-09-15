import requests
from datetime import datetime

# Função para converter o timestamp para formato de data
def convert_timestamp_to_date(timestamp):
    return datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d')

# URL para o histórico de preços de PETR4 (último mês, com intervalos de 1 dia)
url_precos = "https://brapi.dev/api/quote/PETR4?range=3mo&interval=1d"

# Realizando a requisição GET para os preços
response_precos = requests.get(url_precos)

if response_precos.status_code == 200:
    data_precos = response_precos.json()  # Converte a resposta JSON em um dicionário Python
    print("Histórico de Preços de PETR4:")
    # Extraindo apenas a data e o preço de fechamento
    for item in data_precos['results'][0]['historicalDataPrice']:
        data = convert_timestamp_to_date(item['date'])
        fechamento = item['close']
        print(f"Data: {data} | Fechamento: {fechamento}")
else:
    print(f"Erro ao buscar histórico de preços: {response_precos.status_code}")


# URL para os dividendos de PETR4
url_dividendos = "https://brapi.dev/api/quote/PETR4?dividends=true"

# Realizando a requisição GET para os dividendos
response_dividendos = requests.get(url_dividendos)

if response_dividendos.status_code == 200:
    data_dividendos = response_dividendos.json()  # Converte a resposta JSON em um dicionário Python
    print("\nHistórico de Dividendos de PETR4:")
    # Extraindo apenas a data de pagamento e o valor do dividendo
    for item in data_dividendos['results'][0]['dividendsData']['cashDividends']:
        # Verifica se a data de pagamento não é None
        if item['paymentDate']:
            data_pagamento = item['paymentDate']
            valor_dividendo = item['rate']
            # Converte a data para o formato desejado
            data_formatada = datetime.strptime(data_pagamento, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%d')
            print(f"Data: {data_formatada} | Valor do Dividendo: {valor_dividendo}")
        else:
            print("Data de pagamento não disponível para este dividendo.")
else:
    print(f"Erro ao buscar histórico de dividendos: {response_dividendos.status_code}")
