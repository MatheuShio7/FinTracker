"""
Aplicação principal Flask para o FinTracker API
"""
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from config.config import Config
from routes import health_routes
from routes import supabase_example_routes  # Descomente para habilitar rotas de exemplo do Supabase
from routes import price_routes  # Rotas de preços de ações
from routes import dividend_routes  # Rotas de dividendos de ações
from routes import stock_view_routes  # Rota de visualização de ações

# Carrega variáveis de ambiente
load_dotenv()

def create_app(config_class=Config):
    """Factory function para criar a aplicação Flask"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Habilita CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Registra blueprints (rotas)
    app.register_blueprint(health_routes.bp)
    app.register_blueprint(supabase_example_routes.bp)  # Rotas de exemplo do Supabase
    app.register_blueprint(price_routes.bp)  # Rotas de preços de ações
    app.register_blueprint(dividend_routes.bp)  # Rotas de dividendos de ações
    app.register_blueprint(stock_view_routes.bp)  # Rota de visualização de ações
    
    return app

# Cria a aplicação
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

