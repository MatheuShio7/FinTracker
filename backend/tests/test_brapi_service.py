"""
Script de teste simples para o serviço BraAPI
Execute: python tests/test_brapi_service.py
"""
import sys
import os

# Adiciona o diretório pai ao path para importar os módulos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.brapi_price_service import fetch_prices_from_brapi, get_price_summary


def test_fetch_prices():
    """Testa a busca de preços"""
    print("\n" + "="*60)
    print("TESTE 1: Buscar preços de PETR4 (7 dias)")
    print("="*60)
    
    prices = fetch_prices_from_brapi("PETR4", "7d")
    
    if prices:
        print(f"\n✅ Teste passou! {len(prices)} preços encontrados")
        print("\nÚltimos 3 preços:")
        for item in prices[-3:]:
            print(f"  {item['date']}: R$ {item['price']:.2f}")
        return True
    else:
        print("\n❌ Teste falhou!")
        return False


def test_get_summary():
    """Testa o resumo estatístico"""
    print("\n" + "="*60)
    print("TESTE 2: Obter resumo de VALE3 (1 mês)")
    print("="*60)
    
    summary = get_price_summary("VALE3", "1m")
    
    if summary:
        print("\n✅ Teste passou! Resumo obtido:")
        print(f"\n  Ticker: {summary['ticker']}")
        print(f"  Preço atual: R$ {summary['current_price']:.2f}")
        print(f"  Variação: R$ {summary['variation']:.2f} ({summary['variation_percent']:.2f}%)")
        print(f"  Preço máximo: R$ {summary['max_price']:.2f}")
        print(f"  Preço mínimo: R$ {summary['min_price']:.2f}")
        print(f"  Preço médio: R$ {summary['avg_price']:.2f}")
        print(f"  Pontos de dados: {summary['data_points']}")
        return True
    else:
        print("\n❌ Teste falhou!")
        return False


def test_invalid_ticker():
    """Testa com ticker inválido"""
    print("\n" + "="*60)
    print("TESTE 3: Testar com ticker inválido (INVALID)")
    print("="*60)
    
    prices = fetch_prices_from_brapi("INVALID", "7d")
    
    if prices is None:
        print("\n✅ Teste passou! Erro tratado corretamente")
        return True
    else:
        print("\n❌ Teste falhou! Deveria retornar None")
        return False


def main():
    """Executa todos os testes"""
    print("\n" + "="*60)
    print("INICIANDO TESTES DO SERVIÇO BRAPI")
    print("="*60)
    
    results = []
    
    # Executa os testes
    results.append(("Buscar preços", test_fetch_prices()))
    results.append(("Obter resumo", test_get_summary()))
    results.append(("Ticker inválido", test_invalid_ticker()))
    
    # Resumo dos testes
    print("\n" + "="*60)
    print("RESUMO DOS TESTES")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{name}: {status}")
    
    print(f"\nTotal: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n🎉 Todos os testes passaram!")
    else:
        print(f"\n⚠️ {total - passed} teste(s) falharam")
    
    print("="*60 + "\n")


if __name__ == "__main__":
    main()

