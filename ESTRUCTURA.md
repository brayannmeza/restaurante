# Estructura del Proyecto Fortaleza

Este proyecto está organizado en dos carpetas principales:

## Backend
La carpeta `backend/` contiene:
- `server.js` - Servidor Node.js principal
- `package.json` - Dependencias de npm
- `schema.sql` - Script SQL para crear las tablas en Neon PostgreSQL
- `data/` - Archivos de datos

## Frontend
La carpeta `frontend/` contiene:
- Archivos HTML (index.html, admin.html, owner.html)
- Archivos JavaScript (app.js, admin.js, owner.js)
- Estilos CSS (style.css)

## Cómo usar

1. Instala dependencias del backend:
   ```bash
   cd backend
   npm install
   ```

2. Configura las variables de entorno en un archivo `.env` en la carpeta `backend/`

3. Inicia el servidor:
   ```bash
   npm start
   ```

4. Abre http://127.0.0.1:3000 en tu navegador

## Para Railway

Railway detectará automáticamente la carpeta `backend/` y ejecutará `npm start` desde allí.
