# 🍽️ Fortaleza - Sistema de Pedidos para Restaurante

Sistema web moderno para gestión de pedidos de un restaurante con panel administrativo.

## 📋 Características

- **Frontend moderno**: Interfaz responsive para clientes
- **Panel de administrador**: Gestión de pedidos en tiempo real
- **Base de datos**: PostgreSQL (Neon)
- **Autenticación**: Tokens seguros con JWT-like tokens
- **API REST**: Backend Node.js

## 🗂️ Estructura del Proyecto

```
restaurante/
├── backend/           # Servidor Node.js
│   ├── server.js      # API principal
│   ├── package.json   # Dependencias
│   ├── schema.sql     # Esquema PostgreSQL
│   └── data/          # Datos locales
├── frontend/          # Aplicación cliente
│   ├── index.html     # Página principal
│   ├── admin.html     # Panel de admin
│   ├── owner.html     # Panel de dueño
│   ├── app.js         # Lógica cliente
│   ├── admin.js       # Lógica admin
│   ├── owner.js       # Lógica dueño
│   └── style.css      # Estilos
└── README.md          # Este archivo
```

## 🚀 Instalación

### Backend

```bash
cd backend
npm install
```

### Variables de entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
PORT=3000
HOST=127.0.0.1
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
ADMIN_SECRET=tu_secret_seguro_aqui
```

## 🔧 Ejecutar localmente

```bash
cd backend
npm start
```

Abre en tu navegador: `http://127.0.0.1:3000`

## 🗄️ Base de datos

Usa el archivo `backend/schema.sql` para crear las tablas en Neon PostgreSQL.

1. Ve a tu dashboard de Neon
2. Abre el SQL Editor
3. Copia y ejecuta el contenido de `schema.sql`

## 👤 Credenciales por defecto

- **Usuario**: `admin`
- **Contraseña**: `admin123`

## 🚢 Despliegue en Railway

1. Conecta tu repo de GitHub a Railway
2. Configura las variables de entorno en Railway
3. Railway detectará automáticamente `package.json` en la carpeta `backend/`

[Ver instrucciones de Railway](https://docs.railway.app/deploy/deployments)

## 📝 API Endpoints

### Público
- `POST /api/orders` - Crear pedido
- `GET /` - Página principal

### Protegido (requiere token)
- `POST /api/admin/login` - Login admin
- `GET /api/admin/orders` - Listar pedidos
- `PATCH /api/admin/orders/:id/status` - Actualizar estado
- `DELETE /api/admin/orders/:id` - Eliminar pedido

## 🔐 Seguridad

- Contraseñas hasheadas con SHA256
- Tokens con HMAC-SHA256
- Validación en servidor y cliente
- Protección contra inyección SQL con prepared statements

## 📧 Soporte

Para reportar bugs o sugerencias, abre un issue en GitHub.

---

**Hecho con ❤️ por Brayan Meza**
