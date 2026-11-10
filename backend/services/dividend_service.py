"""
Fachada de dividendos: BraAPI (principal) + Yahoo Finance (fallback).
"""
from typing import List, Dict, Optional

from services.brapi_dividend_service import fetch_dividends_from_brapi
from services.yahoo_dividend_service import fetch_dividends_from_yahoo


def fetch_dividends(ticker: str) -> Optional[List[Dict[str, any]]]:
    """
    Busca os últimos 12 dividendos/JCP de uma ação.

    Preferência:
      1. BraAPI (confiável no Render)
      2. Yahoo Finance (fallback local / se BraAPI falhar)

    Returns:
        Lista de dicts, [] sem proventos, None se não foi possível obter dados.
    """
    ticker_clean = (ticker or '').upper().strip()
    if not ticker_clean:
        return None

    brapi_result = fetch_dividends_from_brapi(ticker_clean)

    # Lista (mesmo vazia) = resposta válida da BraAPI
    if brapi_result is not None:
        return brapi_result

    print(f"[INFO] Fallback Yahoo Finance para dividendos de {ticker_clean}...")
    return fetch_dividends_from_yahoo(ticker_clean)
