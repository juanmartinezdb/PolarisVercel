from app import create_app, db
from flask_migrate import upgrade
import os
from dotenv import load_dotenv

load_dotenv()

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    # Usar el puerto de Railway o 5000 por defecto
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)