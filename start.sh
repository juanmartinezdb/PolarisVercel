#!/bin/bash

# Cambiar al directorio del backend
cd backend

# Activar entorno virtual
source venv/bin/activate

# Ejecutar migraciones si existen
if [ -d "migrations" ]; then
    echo "Ejecutando migraciones de base de datos..."
    python -c "from app import create_app, db; from flask_migrate import upgrade; app = create_app(); app.app_context().push(); upgrade()"
fi

# Iniciar la aplicación
echo "Iniciando la aplicación..."
python app.py