"""Pure helpers used by the backend-independent acceptance tests."""


def fetch_wallet_data(fetch, storage, force_refresh=False, now=None):
    now = now or __import__('time').time_ns
    timestamp = storage.get('timestamp')
    if not force_refresh and timestamp is not None and now() - timestamp < 5 * 60 * 1000:
        return storage['data']

    data = fetch()
    storage.update({'data': data, 'timestamp': now()})
    return data


def calculate_portfolio(transactions):
    positions = {}
    for transaction in transactions:
        ticker = transaction['ticker']
        quantity = transaction['quantity']
        invested = quantity * transaction['price']
        position = positions.setdefault(ticker, {'quantity': 0, 'invested': 0})
        position['quantity'] += quantity
        position['invested'] += invested

    total = sum(position['invested'] for position in positions.values())
    for position in positions.values():
        position['averagePrice'] = position['invested'] / position['quantity']
    distribution = {
        ticker: position['invested'] / total * 100
        for ticker, position in positions.items()
    }
    return {
        'totalInvested': total,
        'positions': positions,
        'distribution': distribution,
    }
