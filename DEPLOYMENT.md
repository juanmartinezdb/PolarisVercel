# Guía de Despliegue - Polaris

Esta guía te ayudará a desplegar tu aplicación Polaris con el backend en Railway y el frontend en Vercel.

## 📋 Prerrequisitos

- Cuenta en [Railway](https://railway.app/)
- Cuenta en [Vercel](https://vercel.com/)
- Base de datos PostgreSQL (puedes usar Railway para esto también)
- Repositorio en GitHub

## 🚀 Despliegue del Backend en Railway

### 1. Preparar la Base de Datos

1. Ve a [Railway](https://railway.app/) y crea un nuevo proyecto
2. Agrega un servicio de PostgreSQL:
   - Haz clic en "+ New"
   - Selecciona "Database" → "PostgreSQL"
   - Anota la URL de conexión que se genera

### 2. Configurar Variables de Entorno

En tu proyecto de Railway, ve a la pestaña "Variables" y agrega:

```
DATABASE_URL=postgresql://username:password@hostname:port/database_name
SECRET_KEY=tu-clave-secreta-super-segura
JWT_SECRET_KEY=tu-jwt-clave-secreta
FLASK_ENV=production
```

### 3. Desplegar el Backend

1. Conecta tu repositorio de GitHub a Railway
2. Selecciona la rama principal
3. Railway detectará automáticamente que es una aplicación Python
4. El despliegue comenzará automáticamente

### 4. Verificar el Despliegue

- Railway te proporcionará una URL como: `https://tu-app.railway.app`
- Verifica que funcione visitando: `https://tu-app.railway.app/api/auth/health`

## 🌐 Despliegue del Frontend en Vercel

### 1. Configurar Variables de Entorno

En tu proyecto de Vercel, ve a "Settings" → "Environment Variables" y agrega:

```
VITE_API_URL=https://tu-app.railway.app/api
```

### 2. Desplegar el Frontend

1. Ve a [Vercel](https://vercel.com/) y crea un nuevo proyecto
2. Conecta tu repositorio de GitHub
3. Configura el proyecto:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
4. Haz clic en "Deploy"

### 3. Actualizar CORS en el Backend

Una vez que tengas la URL de Vercel (ej: `https://tu-app.vercel.app`), actualiza el archivo `backend/app/__init__.py`:

```python
# Reemplaza esta línea:
"https://your-frontend-domain.vercel.app"

# Por tu URL real:
"https://tu-app.vercel.app"
```

Haz commit y push para que Railway se actualice automáticamente.

## 🖼️ Solución para Problemas con Imágenes

### Problema Identificado
El sistema actual guarda avatares en el sistema de archivos local, lo cual no funciona en servicios como Railway (sistema de archivos efímero).

### Soluciones Recomendadas

#### Opción 1: Cloudinary (Recomendado)

1. Crea una cuenta en [Cloudinary](https://cloudinary.com/)
2. Instala el SDK: `pip install cloudinary`
3. Agrega las variables de entorno en Railway:
   ```
   CLOUDINARY_CLOUD_NAME=tu-cloud-name
   CLOUDINARY_API_KEY=tu-api-key
   CLOUDINARY_API_SECRET=tu-api-secret
   ```

#### Opción 2: AWS S3

1. Configura un bucket en AWS S3
2. Instala boto3: `pip install boto3`
3. Configura las credenciales de AWS

#### Opción 3: Supabase Storage

1. Crea un proyecto en [Supabase](https://supabase.com/)
2. Configura el storage
3. Usa la API de Supabase para subir archivos

## 🔧 Comandos Útiles

### Para desarrollo local:
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python app.py

# Frontend
npm install
npm run dev
```

### Para build de producción:
```bash
# Frontend
npm run build
```

## 🐛 Solución de Problemas Comunes

### Error de CORS
- Verifica que la URL del frontend esté en la lista de orígenes permitidos
- Asegúrate de que las variables de entorno estén configuradas correctamente

### Error de Base de Datos
- Verifica que la `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la base de datos esté accesible desde Railway

### Problemas con Imágenes
- En producción, las imágenes se guardan en `/tmp` (temporal)
- Para una solución permanente, implementa uno de los servicios de almacenamiento recomendados

### Error de Variables de Entorno
- Verifica que todas las variables estén configuradas en ambos servicios
- Reinicia los servicios después de cambiar variables de entorno

## 📝 Notas Importantes

1. **Seguridad**: Cambia todas las claves secretas por valores seguros en producción
2. **Base de Datos**: Haz backup regular de tu base de datos
3. **Monitoreo**: Configura alertas para monitorear el estado de tus servicios
4. **Logs**: Revisa los logs regularmente para detectar errores

## 🔗 Enlaces Útiles

- [Documentación de Railway](https://docs.railway.app/)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de Flask](https://flask.palletsprojects.com/)