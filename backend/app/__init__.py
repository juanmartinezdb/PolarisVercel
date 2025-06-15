import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from config.config import Config


db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    jwt.init_app(app) 
    
    # Configure CORS with specific settings
    allowed_origins = [
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://polaris-vercel2-juanmartinezdbs-projects.vercel.app",
        "https://polaris-vercel2.vercel.app",
        "https://polaris-vercel2-git-main-juanmartinezdbs-projects.vercel.app"
    ]
    
    # En producción, permitir solo dominios específicos
    if os.environ.get('FLASK_ENV') == 'production':
        allowed_origins = [
            "https://polaris-vercel2-juanmartinezdbs-projects.vercel.app",
            "https://polaris-vercel2.vercel.app",
            "https://polaris-vercel2-git-main-juanmartinezdbs-projects.vercel.app"
        ]
    
    CORS(app, 
         origins=allowed_origins,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True)
    
    migrate.init_app(app, db)
    
    @jwt.unauthorized_loader
    def unauthorized_response(callback_message):
        print(f"JWT ERROR CALLBACK: Unauthorized - {callback_message}")
        return jsonify(message="Faltan credenciales de acceso o son inválidas"), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback_message):
        print(f"JWT ERROR CALLBACK: Invalid Token - {callback_message}")
        return jsonify(message=f"Token inválido: {callback_message}"), 422 

    @jwt.expired_token_loader
    def expired_token_response(callback_header, callback_payload):
        print(f"JWT ERROR CALLBACK: Expired Token - {callback_header} {callback_payload}")
        return jsonify(message="Token expirado"), 401

    @jwt.revoked_token_loader
    def revoked_token_response(callback_header, callback_payload):
        print(f"JWT ERROR CALLBACK: Revoked Token - {callback_header} {callback_payload}")
        return jsonify(message="Token revocado"), 401

    @jwt.needs_fresh_token_loader
    def needs_fresh_token_response(callback_header, callback_payload):
        print(f"JWT ERROR CALLBACK: Needs Fresh Token - {callback_header} {callback_payload}")
        return jsonify(message="Se requiere un token fresco"), 401

   
    from app.models import user, campaign, task, daily, raid, logbook
    
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.campaigns import campaigns_bp
    from app.routes.tasks import tasks_bp
    from app.routes.dailies import dailies_bp
    from app.routes.raids import raids_bp
    from app.routes.logbooks import logbooks_bp
    from app.routes.balance import balance_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.calendar import calendar_bp 
    from app.routes.stats import stats_bp 
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(dailies_bp, url_prefix='/api/dailies')
    app.register_blueprint(raids_bp, url_prefix='/api/raids')
    app.register_blueprint(logbooks_bp, url_prefix='/api/logbooks')
    app.register_blueprint(balance_bp, url_prefix='/api/balance')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(calendar_bp, url_prefix='/api/calendar') 
    app.register_blueprint(stats_bp, url_prefix='/api/stats') 
    
    return app