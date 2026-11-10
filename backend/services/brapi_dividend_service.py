"""
Serviço de dividendos via BraAPI (fonte principal em produção).
O Yahoo Finance costuma falhar em hosts cloud (ex.: Render).
"""
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / '.env')

BRAPI_TOKEN = os.getenv('BRAPI_TOKEN')
BRAPI_QUOTE_URL = "https://brapi.dev/api/quote"


def _parse_payment_date(raw: Optional[str]) -> Optional[str]:
    """Normaliza datas ISO da BraAPI para YYYY-MM-DD."""
    if not raw:
        return None
    try:
        # Ex.: 2026-08-24T03:00:00.000Z
        if 'T' in raw:
            return raw.split('T', 1)[0]
        datetime.strptime(raw[:10], '%Y-%m-%d')
        return raw[:10]
    except (ValueError, TypeError):
        return None


def fetch_dividends_from_brapi(ticker: str) -> Optional[List[Dict[str, any]]]:
    """
    Busca dividendos/JCP de uma ação na BraAPI.

    Returns:
        Lista [{"payment_date": "YYYY-MM-DD", "value": float}, ...] (últimos 12),
        [] se não houver proventos, None se ticker inválido / erro de auth.
    """
    if not BRAPI_TOKEN:
        print("[ERRO] BRAPI_TOKEN não configurado - não é possível buscar dividendos na BraAPI")
        return None

    ticker_clean = (ticker or '').upper().strip().replace('.SA', '')
    if not ticker_clean:
        return None

    url = f"{BRAPI_QUOTE_URL}/{ticker_clean}"
    params = {
        'token': BRAPI_TOKEN,
        'dividends': 'true',
    }

    print(f"[INFO] Buscando dividendos de {ticker_clean} na BraAPI...")

    try:
        response = requests.get(url, params=params, timeout=30)

        if response.status_code == 404:
            print(f"[ERRO] Ticker '{ticker_clean}' não encontrado na BraAPI")
            return None

        if response.status_code == 401:
            print("[ERRO] Token BraAPI inválido ao buscar dividendos")
            return None

        if response.status_code == 403:
            print("[ERRO] Plano BraAPI sem acesso a dividendos (403)")
            return None

        if response.status_code == 429:
            print("[ERRO] Limite de requisições BraAPI atingido ao buscar dividendos")
            return None

        if response.status_code != 200:
            print(f"[ERRO] BraAPI dividendos status={response.status_code}: {response.text[:200]}")
            return None

        payload = response.json()
        results = payload.get('results') or []
        if not results:
            print(f"[AVISO] BraAPI sem results para {ticker_clean}")
            return None

        dividends_data = results[0].get('dividendsData') or {}
        cash_dividends = dividends_data.get('cashDividends') or []

        if not cash_dividends:
            print(f"[AVISO] Nenhum dividendo/JCP na BraAPI para {ticker_clean}")
            return []

        parsed = []
        for item in cash_dividends:
            try:
                rate = float(item.get('rate') or 0)
                if rate <= 0:
                    continue

                payment_date = (
                    _parse_payment_date(item.get('paymentDate'))
                    or _parse_payment_date(item.get('exDate'))
                    or _parse_payment_date(item.get('lastDatePrior'))
                )
                if not payment_date:
                    continue

                parsed.append({
                    'payment_date': payment_date,
                    'value': rate,
                })
            except (TypeError, ValueError) as exc:
                print(f"[AVISO] Item de dividendo inválido na BraAPI: {exc}")
                continue

        if not parsed:
            print(f"[AVISO] Nenhum dividendo válido processado para {ticker_clean}")
            return []

        # Ordena por data e pega os 12 mais recentes (ordem cronológica para o gráfico)
        parsed.sort(key=lambda d: d['payment_date'])
        last_12 = parsed[-12:]

        print(f"[OK] BraAPI: {len(last_12)} dividendos para {ticker_clean}")
        return last_12

    except requests.Timeout:
        print(f"[ERRO] Timeout ao buscar dividendos de {ticker_clean} na BraAPI")
        return None
    except Exception as exc:
        print(f"[ERRO] Erro inesperado nos dividendos BraAPI ({ticker_clean}): {exc}")
        return None
