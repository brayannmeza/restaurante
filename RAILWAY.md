# 🚀 Guía de Despliegue en Railway

Tu proyecto está listo para ser desplegado en Railway. Sigue estos pasos:

## 1. Conectar GitHub a Railway

1. Ve a [railway.app](https://railway.app)
2. Haz login con tu cuenta de GitHub
3. Haz clic en **"New Project"**
4. Selecciona **"Deploy from GitHub"**
5. Selecciona tu repositorio `brayannmeza/restaurante`
6. Autoriza a Railway

## 2. Configurar variables de entorno

En el dashboard de Railway:

1. Ve a tu proyecto recién creado
2. Haz clic en **"Variables"**
3. Añade las siguientes variables:

```env
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://neondb_owner:npg_0WFqhijyrp4H@ep-nameless-moon-anr0lz7p-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
ADMIN_SECRET=tu_secret_muy_seguro_cambiar_en_produccion
NODE_ENV=production
```

> ⚠️ **Importante**: Reemplaza `ADMIN_SECRET` con un valor único y seguro

## 3. Especificar la carpeta del proyecto

En Railway, necesita saber dónde está el backend:

1. Ve a **"Settings"** del servicio
2. En **"Start Command"**, asegúrate de que esté: `npm start`
3. En **"Root Directory"**, coloca: `backend`

O alternativamente:
- Railway debería detectar automáticamente el `Procfile` en `backend/`

## 4. Enlazar PostgreSQL (Neon)

Ya tienes una base de datos PostgreSQL en Neon. Railroad no necesita crear una nueva:

- La `DATABASE_URL` que configuraste en las variables de entorno es suficiente

## 5. Desplegar

1. Una vez configuradas todas las variables
2. Railway debería detectar cambios en GitHub automáticamente
3. Verás un proceso de build y deploy en el dashboard
4. Espera a que termine (esto toma 2-5 minutos)

## 6. Obtener tu URL

Una vez deployado:

1. En el dashboard de Railway, ve a tu proyecto
2. Haz clic en **"Deployments"**
3. Verás tu URL pública (algo como: `https://tu-app-xxxx.railway.app`)
4. ¡Abre esa URL en tu navegador!

## 7. Prueba el panel admin

1. Abre `https://tu-app-xxxx.railway.app/admin.html`
2. Login con:
   - **Usuario**: `admin`
   - **Contraseña**: `admin123`

## 🔧 Solución de problemas

### El build falla
- Verifica que `package.json` esté en la carpeta `backend/`
- Revisa los logs en Railway

### Base de datos no conecta
- Verifica la `DATABASE_URL` en las variables de entorno
- Asegúrate de que Neon esté corriendo
- Revisa los logs en Railway

### Archivos no se sirven
- Verifica que el `Root Directory` sea `backend`
- Comprueba que los archivos estén en la carpeta `frontend/`

## 📝 Notas importantes

- Railway detecta cambios en GitHub automáticamente y redeploy
- Los logs están disponibles en **"Logs"** del dashboard
- Puedes ver la actividad en **"Deployments"**
- Si editas variables, el app se reiniciará automáticamente

## 🆘 Soporte

Para ayuda sobre Railway: https://docs.railway.app/

Para problemas específicos de tu app, revisa los logs en Railway o abre un issue en GitHub.

---

**¡Tu app estará online 24/7 en Railway!** 🎉
