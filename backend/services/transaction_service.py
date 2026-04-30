"""
Serviço para gerenciamento de transações de compra e venda.
"""
from datetime import datetime

from config.supabase_config import get_supabase_admin_client


VALID_TRANSACTION_TYPES = {"buy", "sell"}


def _normalize_transaction_type(raw_type):
    """Mapeia valores do frontend para o padrão da base."""
    if raw_type is None:
        return None

    text = str(raw_type).strip().lower()
    if text == "compra":
        return "buy"
    if text == "venda":
        return "sell"
    return text


def _resolve_stock_id(supabase, stock_id=None, ticker=None):
    """Resolve stock_id a partir de stock_id informado ou ticker."""
    if stock_id:
        response = supabase.table('stocks')\
            .select('id, ticker, company_name')\
            .eq('id', stock_id)\
            .limit(1)\
            .execute()

        if response.data and len(response.data) > 0:
            return response.data[0]

        return None

    if ticker:
        clean_ticker = str(ticker).strip().upper()
        response = supabase.table('stocks')\
            .select('id, ticker, company_name')\
            .eq('ticker', clean_ticker)\
            .limit(1)\
            .execute()

        if response.data and len(response.data) > 0:
            return response.data[0]

    return None


def _parse_positive_decimal(raw_value, field_name):
    try:
        value = float(raw_value)
        if value <= 0:
            raise ValueError(f"{field_name} deve ser maior que zero")
        return value
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} inválido")


def _parse_positive_int(raw_value, field_name):
    try:
        value = int(raw_value)
        if value <= 0:
            raise ValueError(f"{field_name} deve ser maior que zero")
        return value
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} inválido")


def _parse_transaction_date(raw_date):
    if raw_date is None or str(raw_date).strip() == "":
        return datetime.utcnow().isoformat()

    text = str(raw_date).strip()

    # Aceita YYYY-MM-DD
    if len(text) == 10 and text[4] == '-' and text[7] == '-':
        return f"{text}T12:00:00"

    # Aceita formato ISO padrão
    try:
        datetime.fromisoformat(text.replace('Z', '+00:00'))
        return text
    except ValueError:
        raise ValueError("date inválida")


def _friendly_error(error):
    message = str(error)
    if "Saldo insuficiente" in message:
        return "Saldo insuficiente para realizar venda"
    return message


def create_transaction(user_id, payload):
    """Cria uma nova transação para o usuário autenticado."""
    try:
        supabase = get_supabase_admin_client()

        tx_type = _normalize_transaction_type(payload.get('type'))
        if tx_type not in VALID_TRANSACTION_TYPES:
            return {
                "success": False,
                "message": "type deve ser 'buy' ou 'sell'"
            }

        stock = _resolve_stock_id(
            supabase,
            stock_id=payload.get('stock_id'),
            ticker=payload.get('ticker')
        )
        if not stock:
            return {
                "success": False,
                "message": "Ação não encontrada"
            }

        price = _parse_positive_decimal(payload.get('price'), 'price')
        quantity = _parse_positive_int(payload.get('quantity'), 'quantity')
        transaction_date = _parse_transaction_date(payload.get('date'))

        insert_payload = {
            'user_id': user_id,
            'stock_id': stock['id'],
            'type': tx_type,
            'price': price,
            'quantity': quantity,
            'date': transaction_date
        }

        response = supabase.table('transactions')\
            .insert(insert_payload)\
            .execute()

        if not response.data or len(response.data) == 0:
            return {
                "success": False,
                "message": "Não foi possível criar a transação"
            }

        created = response.data[0]
        # After creating transaction, ensure we have a recent price in cache
        try:
            from services.portfolio_service import ensure_current_stock_price

            # If the user already has this stock in their portfolio, guarantee current price
            portfolio_check = supabase.table('user_portfolio')\
                .select('id')\
                .eq('user_id', user_id)\
                .eq('stock_id', stock['id'])\
                .limit(1)\
                .execute()

            if portfolio_check.data and len(portfolio_check.data) > 0:
                ensure_current_stock_price(stock['id'], stock.get('ticker'))
        except Exception as e:
            print(f"[WARN] Não foi possível garantir preço após criação de transação: {str(e)}")

        # Try to include the most recent cached price in the response
        try:
            price_resp = supabase.table('stock_prices')\
                .select('price')\
                .eq('stock_id', stock['id'])\
                .order('date', desc=True)\
                .limit(1)\
                .execute()

            current_price = float(price_resp.data[0]['price']) if price_resp.data and len(price_resp.data) > 0 else None
        except Exception:
            current_price = None

        current_total = None
        try:
            qty = created.get('quantity') or quantity
            if current_price is not None and qty is not None:
                current_total = current_price * float(qty)
        except Exception:
            current_total = None

        return {
            "success": True,
            "message": "Transação criada com sucesso",
            "data": {
                'id': created.get('id'),
                'stock_id': stock['id'],
                'ticker': stock.get('ticker'),
                'company_name': stock.get('company_name'),
                'type': created.get('type'),
                'price': created.get('price'),
                'quantity': created.get('quantity'),
                'total': created.get('total'),
                'date': created.get('date'),
                'created_at': created.get('created_at'),
                'updated_at': created.get('updated_at'),
                'current_price': current_price,
                'current_total': current_total
            }
        }
    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }
    except Exception as error:
        return {
            "success": False,
            "message": _friendly_error(error)
        }


def list_transactions(user_id, stock_id=None):
    """Lista transações do usuário ordenadas por data decrescente."""
    try:
        supabase = get_supabase_admin_client()

        query = supabase.table('transactions')\
            .select('id, user_id, stock_id, type, price, quantity, total, date, created_at, updated_at, stocks(ticker, company_name)')\
            .eq('user_id', user_id)

        if stock_id:
            query = query.eq('stock_id', stock_id)

        response = query.order('date', desc=True)\
            .order('created_at', desc=True)\
            .execute()

        items = []
        for tx in response.data or []:
            stock = tx.get('stocks') or {}
            items.append({
                'id': tx.get('id'),
                'stock_id': tx.get('stock_id'),
                'ticker': stock.get('ticker'),
                'company_name': stock.get('company_name'),
                'type': tx.get('type'),
                'price': tx.get('price'),
                'quantity': tx.get('quantity'),
                'total': tx.get('total'),
                'date': tx.get('date'),
                'created_at': tx.get('created_at'),
                'updated_at': tx.get('updated_at')
            })

        return {
            "success": True,
            "data": items
        }
    except Exception as error:
        return {
            "success": False,
            "message": _friendly_error(error)
        }


def update_transaction(user_id, transaction_id, payload):
    """Atualiza uma transação existente pertencente ao usuário."""
    try:
        if not payload:
            return {
                "success": False,
                "message": "Nenhum campo para atualizar"
            }

        supabase = get_supabase_admin_client()

        existing_response = supabase.table('transactions')\
            .select('id, stock_id, type, price, quantity, date')\
            .eq('id', transaction_id)\
            .eq('user_id', user_id)\
            .limit(1)\
            .execute()

        if not existing_response.data or len(existing_response.data) == 0:
            return {
                "success": False,
                "message": "Transação não encontrada"
            }

        existing = existing_response.data[0]

        update_payload = {}

        if 'type' in payload:
            tx_type = _normalize_transaction_type(payload.get('type'))
            if tx_type not in VALID_TRANSACTION_TYPES:
                return {
                    "success": False,
                    "message": "type deve ser 'buy' ou 'sell'"
                }
            update_payload['type'] = tx_type

        if 'price' in payload:
            update_payload['price'] = _parse_positive_decimal(payload.get('price'), 'price')

        if 'quantity' in payload:
            update_payload['quantity'] = _parse_positive_int(payload.get('quantity'), 'quantity')

        if 'date' in payload:
            update_payload['date'] = _parse_transaction_date(payload.get('date'))

        if 'stock_id' in payload or 'ticker' in payload:
            stock = _resolve_stock_id(
                supabase,
                stock_id=payload.get('stock_id'),
                ticker=payload.get('ticker')
            )
            if not stock:
                return {
                    "success": False,
                    "message": "Ação não encontrada"
                }
            update_payload['stock_id'] = stock['id']

        if len(update_payload) == 0:
            return {
                "success": False,
                "message": "Nenhum campo válido para atualizar"
            }

        response = supabase.table('transactions')\
            .update(update_payload)\
            .eq('id', transaction_id)\
            .eq('user_id', user_id)\
            .execute()

        if not response.data or len(response.data) == 0:
            return {
                "success": False,
                "message": "Não foi possível atualizar a transação"
            }

        updated = response.data[0]
        stock_id = updated.get('stock_id', existing.get('stock_id'))

        stock_response = supabase.table('stocks')\
            .select('ticker, company_name')\
            .eq('id', stock_id)\
            .limit(1)\
            .execute()
        stock = stock_response.data[0] if stock_response.data else {}

        return {
            "success": True,
            "message": "Transação atualizada com sucesso",
            "data": {
                'id': updated.get('id'),
                'stock_id': stock_id,
                'ticker': stock.get('ticker'),
                'company_name': stock.get('company_name'),
                'type': updated.get('type'),
                'price': updated.get('price'),
                'quantity': updated.get('quantity'),
                'total': updated.get('total'),
                'date': updated.get('date'),
                'created_at': updated.get('created_at'),
                'updated_at': updated.get('updated_at')
            }
        }
    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }
    except Exception as error:
        return {
            "success": False,
            "message": _friendly_error(error)
        }


def delete_transaction(user_id, transaction_id):
    """Remove uma transação do usuário."""
    try:
        supabase = get_supabase_admin_client()

        existing_response = supabase.table('transactions')\
            .select('id')\
            .eq('id', transaction_id)\
            .eq('user_id', user_id)\
            .limit(1)\
            .execute()

        if not existing_response.data or len(existing_response.data) == 0:
            return {
                "success": False,
                "message": "Transação não encontrada"
            }

        supabase.table('transactions')\
            .delete()\
            .eq('id', transaction_id)\
            .eq('user_id', user_id)\
            .execute()

        return {
            "success": True,
            "message": "Transação removida com sucesso"
        }
    except Exception as error:
        return {
            "success": False,
            "message": _friendly_error(error)
        }
