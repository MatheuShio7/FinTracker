import requests
from datetime import datetime

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
