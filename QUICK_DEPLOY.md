# 🚀 Despliegue Rápido - Polaris

## ✅ Checklist de Despliegue

### 1. Preparación del Repositorio
- [x] Archivos de configuración creados
- [x] Variables de entorno configuradas
- [x] Rutas de imágenes adaptadas para producción
- [x] CORS configurado para Vercel
- [ ] Commit y push de todos los cambios

### 2. Backend en Railway

1. **Crear proyecto en Railway**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu repositorio GitHub
   - Selecciona "Deploy from GitHub repo"

2. **Agregar PostgreSQL**
   - En tu proyecto, haz clic en "+ New"
   - Selecciona "Database" → "PostgreSQL"
   - Copia la `DATABASE_URL` generada

3. **Configurar Variables de Entorno**
   ```
   DATABASE_URL=postgresql://...
   SECRET_KEY=tu-clave-super-secreta
   JWT_SECRET_KEY=tu-jwt-clave-secreta
   FLASK_ENV=production
   ```

4. **Verificar Despliegue**
   - URL del backend: `https://tu-proyecto.railway.app`
   - Test: `https://tu-proyecto.railway.app/api/auth/health`

### 3. Frontend en Vercel

1. **Crear proyecto en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu repositorio GitHub
   - Framework: **Vite**
   - Root Directory: **frontend**

2. **Configurar Variables de Entorno**
   ```
   VITE_API_URL=https://tu-proyecto.railway.app/api
   ```

3. **Desplegar**
   - Vercel detectará automáticamente la configuración
   - El build se ejecutará automáticamente

### 4. Actualizar CORS

1. **Obtener URL de Vercel** (ej: `https://polaris-frontend.vercel.app`)

2. **Actualizar backend/app/__init__.py**
   ```python
   # Línea 26, reemplazar:
   "https://your-frontend-domain.vercel.app"
   # Por:
   "https://tu-dominio-real.vercel.app"
   ```

3. **Commit y push** para actualizar Railway

## 🔧 Comandos de Verificación

```bash
# Verificar backend
curl https://tu-proyecto.railway.app/api/auth/health

# Verificar frontend
curl https://tu-proyecto.vercel.app
```

## ⚠️ Problemas Conocidos y Soluciones

### Imágenes/Avatares
**Problema**: Los avatares se guardan localmente y se pierden en Railway.

**Solución Temporal**: Los avatares se guardan en `/tmp` (se pierden al reiniciar).

**Solución Permanente**: Implementar Cloudinary:
```bash
pip install cloudinary
```

### CORS Errors
**Problema**: Error de CORS al conectar frontend con backend.

**Solución**: Verificar que la URL de Vercel esté en la lista de orígenes permitidos.

### Variables de Entorno
**Problema**: La aplicación no encuentra las variables de entorno.

**Solución**: 
- Railway: Verificar en la pestaña "Variables"
- Vercel: Verificar en "Settings" → "Environment Variables"
- Reiniciar ambos servicios después de cambios

## 📱 URLs Finales

Después del despliegue exitoso:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend**: `https://tu-proyecto.railway.app`
- **API**: `https://tu-proyecto.railway.app/api`

## 🎉 ¡Listo!

Tu aplicación Polaris debería estar funcionando correctamente en producción.

### Próximos Pasos Recomendados:
1. Configurar dominio personalizado
2. Implementar Cloudinary para imágenes
3. Configurar monitoreo y alertas
4. Configurar backups automáticos de la base de datos