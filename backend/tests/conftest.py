import os
import sys

import pytest


BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)


@pytest.fixture
def app():
    from app import create_app
    from config.config import TestingConfig

    return create_app(TestingConfig)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def authenticated_supabase(monkeypatch):
    """Provide a deterministic Supabase JWT identity to protected routes."""
    from types import SimpleNamespace

    user_query = SimpleNamespace(
        limit=lambda *_args, **_kwargs: SimpleNamespace(
            execute=lambda: SimpleNamespace(data=[{
                'id': 'user-a',
                'email': 'a@example.com',
                'name': 'Ana',
                'last_name': 'Silva',
            }])
        )
    )
    auth_client = SimpleNamespace(
        auth=SimpleNamespace(
            get_user=lambda token: SimpleNamespace(
                user=SimpleNamespace(id='user-a', email='a@example.com')
            )
        ),
        table=lambda name: SimpleNamespace(
            select=lambda *_args, **_kwargs: SimpleNamespace(
                eq=lambda *_args, **_kwargs: user_query
            )
        ),
    )
    monkeypatch.setattr(
        'utils.auth_context.get_supabase_admin_client',
        lambda: auth_client,
    )
    monkeypatch.setattr(
        'services.auth_service.get_supabase_admin_client',
        lambda: auth_client,
    )
    return {'Authorization': 'Bearer test-jwt'}
