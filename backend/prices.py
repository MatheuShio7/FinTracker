import requests
from datetime import datetime

# Função para converter o timestamp para formato de data
def convert_timestamp_to_date(timestamp):
    return datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d')

# URL para o histórico de preços de PETR4 (últimos 3 meses, com intervalos de 1 dia)
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