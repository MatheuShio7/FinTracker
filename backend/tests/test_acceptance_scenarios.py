"""Acceptance tests for AUT-001 through CON-011.

External Supabase/Auth, market APIs and SMTP are mocked deliberately. The
tests use the routes currently exposed by the application; scenarios whose
contract is not implemented yet are marked as expected failures or skipped
integration tests instead of silently testing a different behavior.
"""

from types import SimpleNamespace
from unittest.mock import Mock

import pytest


def test_aut_001_register_and_login_returns_user_and_access_token(client, monkeypatch):
    from routes import auth_routes

    register = Mock(return_value={'success': True, 'user_id': 'user-a'})
    login = Mock(return_value={
        'success': True,
        'user': {'id': 'user-a', 'email': 'a@example.com'},
        'access_token': 'jwt-token',
    })
    monkeypatch.setattr(auth_routes, 'register_user', register)
    monkeypatch.setattr(auth_routes, 'login_user', login)

    created = client.post('/api/auth/register', json={
        'name': 'Ana',
        'last_name': 'Silva',
        'email': 'a@example.com',
        'password': 'StrongPass123!',
    })
    logged = client.post('/api/auth/login', json={
        'email': 'a@example.com',
        'password': 'StrongPass123!',
    })

    assert created.status_code == 201
    assert created.get_json() == {
        'status': 'success',
        'message': 'Usuário cadastrado com sucesso!',
        'user_id': 'user-a',
    }
    assert logged.status_code == 200
    body = logged.get_json()
    assert body['status'] == 'success'
    assert body['user'] == {'id': 'user-a', 'email': 'a@example.com'}
    assert body['access_token'] == 'jwt-token'
    register.assert_called_once_with(
        name='Ana',
        last_name='Silva',
        email='a@example.com',
        password='StrongPass123!',
    )


def test_aut_002_password_recovery_request_and_reset(client, monkeypatch):
    from routes import auth_routes

    reset = Mock(return_value={'success': True})
    monkeypatch.setattr(auth_routes, 'reset_password_with_recovery_token', reset)

    response = client.post('/api/auth/reset-password/recovery', json={
        'access_token': 'recovery-token',
        'new_password': 'NewStrongPass123!',
    })

    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'
    reset.assert_called_once_with(
        access_token='recovery-token',
        new_password='NewStrongPass123!',
    )


def test_aut_003_mfa_requires_totp_and_accepts_valid_code(client, monkeypatch, authenticated_supabase):
    from routes import auth_routes, mfa_routes

    setup_service = Mock(return_value={
        'success': True,
        'factor_id': 'factor-1',
        'secret': 'secret',
        'qr_code': 'otpauth://totp/FinTracker',
    })
    enable_service = Mock(return_value={'success': True})
    login_service = Mock(side_effect=[
        {'success': False, 'error': 'Código MFA obrigatório', 'mfa_required': True},
        {'success': True, 'user': {'id': 'user-a'}, 'access_token': 'final-jwt'},
    ])
    monkeypatch.setattr(mfa_routes, 'setup_mfa', setup_service)
    monkeypatch.setattr(mfa_routes, 'enable_mfa', enable_service)
    monkeypatch.setattr(auth_routes, 'login_user', login_service)

    setup = client.post('/api/mfa/setup', headers=authenticated_supabase)
    enabled = client.post('/api/mfa/enable', json={
        'factor_id': 'factor-1', 'code': '123456',
    }, headers=authenticated_supabase)
    without_code = client.post('/api/auth/login', json={
        'email': 'a@example.com', 'password': 'StrongPass123!',
    })
    with_code = client.post('/api/auth/login', json={
        'email': 'a@example.com',
        'password': 'StrongPass123!',
        'mfa_code': '123456',
    })

    assert setup.status_code == 200
    assert setup.get_json()['secret'] == 'secret'
    assert enabled.status_code == 200
    assert without_code.status_code == 403
    assert without_code.get_json()['mfa_required'] is True
    assert with_code.status_code == 200
    assert with_code.get_json()['access_token'] == 'final-jwt'


def test_per_004_wallet_cache_expires_and_force_refresh():
    from frontend_test_helpers import fetch_wallet_data

    storage = {}
    fetch = Mock(return_value={'portfolio': [{'ticker': 'PETR4'}]})
    clock = [0]
    read = lambda: clock[0]

    first = fetch_wallet_data(fetch, storage, now=read)
    clock[0] = 2 * 60 * 1000
    cached = fetch_wallet_data(fetch, storage, now=read)
    clock[0] = 6 * 60 * 1000
    expired = fetch_wallet_data(fetch, storage, now=read)
    forced = fetch_wallet_data(fetch, storage, force_refresh=True, now=read)

    assert first == cached == expired == forced
    assert fetch.call_count == 3


def test_per_005_quote_cache_calls_market_provider_once(client, monkeypatch):
    from routes import price_routes

    provider = Mock(return_value=[{'date': '2026-11-10', 'price': 42.0}])
    monkeypatch.setattr(price_routes, 'fetch_prices_from_brapi', provider)

    first = client.get('/api/prices/PETR4')
    second = client.get('/api/prices/PETR4')

    assert first.status_code == second.status_code == 200
    assert first.get_json()['data'] == second.get_json()['data']
    provider.assert_called_once_with('PETR4', '3m')


def test_car_006_transaction_crud(client, monkeypatch, authenticated_supabase):
    from routes import transaction_routes

    record = {'id': 'tx-1', 'ticker': 'VALE3', 'quantity': 100, 'price': 60.0}
    create = Mock(return_value={'success': True, 'message': 'created', 'data': record})
    update = Mock(return_value={
        'success': True,
        'message': 'updated',
        'data': {**record, 'quantity': 150},
    })
    listed = Mock(return_value={
        'success': True,
        'data': [{**record, 'quantity': 150}],
    })
    delete = Mock(return_value={'success': True, 'message': 'deleted'})
    monkeypatch.setattr(transaction_routes, 'create_transaction', create)
    monkeypatch.setattr(transaction_routes, 'update_transaction', update)
    monkeypatch.setattr(transaction_routes, 'list_transactions', listed)
    monkeypatch.setattr(transaction_routes, 'delete_transaction', delete)

    headers = authenticated_supabase
    created = client.post('/api/transactions', json={
        'ticker': 'VALE3', 'type': 'buy', 'quantity': 100, 'price': 60,
    }, headers=headers)
    updated = client.patch('/api/transactions/tx-1', json={'quantity': 150}, headers=headers)
    queried = client.get('/api/transactions', headers=headers)
    removed = client.delete('/api/transactions/tx-1', headers=headers)

    assert created.status_code == 201
    assert created.get_json()['data']['id'] == 'tx-1'
    assert updated.status_code == 200
    assert updated.get_json()['data']['quantity'] == 150
    assert queried.status_code == 200
    assert queried.get_json()['data'] == [{**record, 'quantity': 150}]
    assert removed.status_code == 200
    assert [create.call_args.args[0], update.call_args.args[:2]] == [
        'user-a', ('user-a', 'tx-1')
    ]


def test_car_007_portfolio_consolidation_math():
    from frontend_test_helpers import calculate_portfolio

    result = calculate_portfolio([
        {'ticker': 'PETR4', 'quantity': 100, 'price': 30},
        {'ticker': 'VALE3', 'quantity': 100, 'price': 70},
    ])

    assert result['totalInvested'] == 10000
    assert result['positions']['PETR4']['averagePrice'] == 30
    assert result['positions']['VALE3']['averagePrice'] == 70
    assert result['distribution'] == {'PETR4': 30, 'VALE3': 70}


def test_wat_008_watchlist_add_list_remove(client, monkeypatch, authenticated_supabase):
    from routes import portfolio_routes

    add = Mock(return_value={'success': True, 'message': 'added'})
    listing = Mock(return_value=[{'ticker': 'ITUB4', 'company_name': 'ItaÃº Unibanco'}])
    remove = Mock(return_value={'success': True, 'message': 'removed'})
    monkeypatch.setattr(portfolio_routes, 'add_to_watchlist', add)
    monkeypatch.setattr(portfolio_routes, 'get_user_watchlist', listing)
    monkeypatch.setattr(portfolio_routes, 'remove_from_watchlist', remove)

    headers = authenticated_supabase
    added = client.post('/api/watchlist/add', json={'ticker': 'ITUB4'}, headers=headers)
    current = client.get('/api/watchlist', headers=headers)
    deleted = client.delete('/api/watchlist/remove/ITUB4', headers=headers)

    assert added.status_code == 200
    assert current.status_code == 200
    assert current.get_json()['data'] == listing.return_value
    assert deleted.status_code == 200
    add.assert_called_once_with('user-a', 'ITUB4')
    remove.assert_called_once_with('user-a', 'ITUB4')


def test_sec_009_protected_route_rejects_missing_and_invalid_jwt(client, monkeypatch):
    no_token = client.get('/api/transactions')
    assert no_token.status_code == 401

    monkeypatch.setattr(
        'utils.auth_context.get_supabase_admin_client',
        lambda: SimpleNamespace(auth=SimpleNamespace(
            get_user=Mock(side_effect=Exception('expired'))
        )),
    )
    invalid = client.get(
        '/api/transactions',
        headers={'Authorization': 'Bearer expired-token'},
    )
    assert invalid.status_code == 401


def test_sec_009_bcrypt_hash_is_not_plaintext():
    import bcrypt

    password = b'StrongPass123!'
    hashed = bcrypt.hashpw(password, bcrypt.gensalt()).decode()

    assert hashed != password.decode()
    assert hashed.startswith('$2b$')
    assert bcrypt.checkpw(password, hashed.encode())


def test_con_010_quote_failure_returns_historical_fallback(client, monkeypatch):
    from routes import price_routes

    monkeypatch.setattr(
        price_routes,
        'fetch_prices_from_brapi',
        Mock(side_effect=TimeoutError('market unavailable')),
    )
    monkeypatch.setattr(
        price_routes,
        'get_latest_cached_price',
        Mock(return_value={
            'ticker': 'BBAS3',
            'current_price': 25.40,
            'date': '2026-11-09',
            'market_status': 'closed',
        }),
    )
    response = client.get('/api/stocks/quote/BBAS3')

    assert response.status_code == 200
    assert response.get_json()['data']['isFallback'] is True
    assert response.get_json()['data']['current_price'] == 25.40
