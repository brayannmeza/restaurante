const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "fortaleza_super_secret_change_me";

// Conexión a Neon PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_0WFqhijyrp4H@ep-nameless-moon-anr0lz7p-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const PUBLIC_FILES = new Set([
    "/index.html",
    "/admin.html",
    "/owner.html",
    "/style.css",
    "/app.js",
    "/admin.js",
    "/owner.js"
]);
const VALID_PAYMENT_METHODS = new Set(["Yape", "Mercado Pago", "PagoEfectivo"]);
const VALID_ORDER_STATUSES = new Set(["Pendiente", "En proceso", "Entregado"]);

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp"
};

async function initializeDatabase() {
    try {
        const result = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users')"
        );
        
        if (!result.rows[0].exists) {
            console.error("Las tablas no existen. Ejecuta el schema.sql primero en Neon.");
            process.exit(1);
        }
        
        console.log("✓ Conexión a PostgreSQL exitosa. Tablas verificadas.");
    } catch (error) {
        console.error("✗ Error al conectar a PostgreSQL:", error.message);
        process.exit(1);
    }
}

function ensureDataFiles() {
    // Esta función ya no es necesaria con PostgreSQL
}

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

function readJson(filePath, fallback) {
    // Esta función ya no es necesaria con PostgreSQL
    return fallback;
}

function writeJson(filePath, data) {
    // Esta función ya no es necesaria con PostgreSQL
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
            if (body.length > 1024 * 32) {
                reject(new Error("Payload demasiado grande"));
                req.destroy();
            }
        });
        req.on("end", () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(new Error("JSON invalido"));
            }
        });
        req.on("error", reject);
    });
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
    res.end(JSON.stringify(payload));
}

function safeCompare(a, b) {
    const aBuf = Buffer.from(a || "");
    const bBuf = Buffer.from(b || "");
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}

function normalizeText(value, maxLength) {
    if (typeof value !== "string") return "";
    return value
        .normalize("NFKC")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

function sanitizeItems(rawItems) {
    if (!Array.isArray(rawItems)) return [];

    return rawItems
        .map((item) => {
            const nombre = normalizeText(item?.nombre, 80);
            const precio = Number(item?.precio);

            if (!nombre || !Number.isFinite(precio) || precio <= 0) return null;
            return {
                nombre,
                precio: Number(precio.toFixed(2))
            };
        })
        .filter(Boolean)
        .slice(0, 25);
}

function calculateOrderTotal(items) {
    return Number(items.reduce((acc, item) => acc + item.precio, 0).toFixed(2));
}

function signToken(username) {
    const ts = Date.now().toString();
    const payload = `${username}:${ts}`;
    const signature = crypto.createHmac("sha256", adminSecret).update(payload).digest("hex");
    return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, "base64url").toString("utf8");
        const [username, ts, signature] = decoded.split(":");
        if (!username || !ts || !signature) return null;
        const payload = `${username}:${ts}`;
        const expected = crypto.createHmac("sha256", adminSecret).update(payload).digest("hex");
        if (!safeCompare(signature, expected)) return null;

        const ageMs = Date.now() - Number(ts);
        const maxAgeMs = 1000 * 60 * 60 * 12;
        if (ageMs > maxAgeMs) return null;
        return { username };
    } catch (error) {
        return null;
    }
}

function getBearerToken(req) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return "";
    return auth.slice(7);
}

function serveStatic(req, res) {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || HOST}`).pathname);
    const cleanUrl = pathname === "/" ? "/index.html" : pathname;

    if (!PUBLIC_FILES.has(cleanUrl)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Archivo no encontrado");
        return;
    }

    const filePath = path.join(__dirname, cleanUrl.slice(1));
    const fs = require("fs");

    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Archivo no encontrado");
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(data);
    });
}

async function handleApi(req, res) {
    try {
        // Crear nuevo pedido
        if (req.method === "POST" && req.url === "/api/orders") {
            const body = await parseBody(req);
            const items = sanitizeItems(body.items);
            const metodoPago = normalizeText(body.metodoPago || "", 40);
            const total = calculateOrderTotal(items);

            if (!items.length || total <= 0 || !VALID_PAYMENT_METHODS.has(metodoPago)) {
                return sendJson(res, 400, { message: "Datos del pedido incompletos" });
            }

            const orderId = `FRT-${Date.now().toString().slice(-6)}`;
            
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                
                // Insertar orden
                await client.query(
                    "INSERT INTO orders (id, fecha, total, metodo_pago, estado) VALUES ($1, $2, $3, $4, $5)",
                    [orderId, new Date(), total, metodoPago, "Pendiente"]
                );

                // Insertar items del pedido
                for (const item of items) {
                    await client.query(
                        "INSERT INTO order_items (order_id, nombre, precio, cantidad) VALUES ($1, $2, $3, $4)",
                        [orderId, item.nombre, item.precio, 1]
                    );
                }

                await client.query("COMMIT");
                
                const order = {
                    id: orderId,
                    fecha: new Date().toISOString(),
                    items,
                    total,
                    metodoPago,
                    estado: "Pendiente"
                };

                return sendJson(res, 201, { message: "Pedido registrado", order });
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            } finally {
                client.release();
            }
        }

        // Login admin
        if (req.method === "POST" && req.url === "/api/admin/login") {
            const body = await parseBody(req);
            const username = String(body.username || "");
            const password = String(body.password || "");

            const result = await pool.query(
                "SELECT username, password_hash FROM admin_users WHERE username = $1",
                [username]
            );

            if (result.rows.length === 0) {
                return sendJson(res, 401, { message: "Credenciales invalidas" });
            }

            const user = result.rows[0];
            const passwordHash = hashPassword(password);

            if (!safeCompare(passwordHash, user.password_hash)) {
                return sendJson(res, 401, { message: "Credenciales invalidas" });
            }

            const token = signToken(username);
            return sendJson(res, 200, { token });
        }

        // Rutas protegidas del admin
        if (req.url.startsWith("/api/admin/orders")) {
            const token = getBearerToken(req);
            const auth = verifyToken(token);
            if (!auth) return sendJson(res, 401, { message: "No autorizado" });

            // Obtener todos los pedidos
            if (req.method === "GET" && req.url === "/api/admin/orders") {
                const result = await pool.query(
                    "SELECT * FROM orders ORDER BY fecha DESC"
                );

                const orders = [];
                for (const order of result.rows) {
                    const itemsResult = await pool.query(
                        "SELECT nombre, precio FROM order_items WHERE order_id = $1",
                        [order.id]
                    );

                    orders.push({
                        id: order.id,
                        fecha: order.fecha.toISOString(),
                        items: itemsResult.rows,
                        total: parseFloat(order.total),
                        metodoPago: order.metodo_pago,
                        estado: order.estado
                    });
                }

                return sendJson(res, 200, { orders });
            }

            // Actualizar estado del pedido
            if (req.method === "PATCH" && /\/api\/admin\/orders\/[^/]+\/status$/.test(req.url)) {
                const id = req.url.split("/")[4];
                const body = await parseBody(req);
                const estado = normalizeText(body.estado || "", 20);

                if (!VALID_ORDER_STATUSES.has(estado)) {
                    return sendJson(res, 400, { message: "Estado no permitido" });
                }

                const result = await pool.query(
                    "UPDATE orders SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
                    [estado, id]
                );

                if (result.rows.length === 0) {
                    return sendJson(res, 404, { message: "Pedido no encontrado" });
                }

                const order = result.rows[0];
                const itemsResult = await pool.query(
                    "SELECT nombre, precio FROM order_items WHERE order_id = $1",
                    [id]
                );

                return sendJson(res, 200, {
                    message: "Estado actualizado",
                    order: {
                        id: order.id,
                        fecha: order.fecha.toISOString(),
                        items: itemsResult.rows,
                        total: parseFloat(order.total),
                        metodoPago: order.metodo_pago,
                        estado: order.estado
                    }
                });
            }

            // Eliminar pedido (solo si está entregado)
            if (req.method === "DELETE" && /\/api\/admin\/orders\/[^/]+$/.test(req.url)) {
                const id = req.url.split("/")[4];

                const orderResult = await pool.query(
                    "SELECT estado FROM orders WHERE id = $1",
                    [id]
                );

                if (orderResult.rows.length === 0) {
                    return sendJson(res, 404, { message: "Pedido no encontrado" });
                }

                if (orderResult.rows[0].estado !== "Entregado") {
                    return sendJson(res, 400, { message: "Solo se pueden eliminar pedidos entregados" });
                }

                const client = await pool.connect();
                try {
                    await client.query("BEGIN");
                    await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);
                    const result = await client.query("DELETE FROM orders WHERE id = $1 RETURNING *", [id]);
                    await client.query("COMMIT");

                    const deleted = result.rows[0];
                    return sendJson(res, 200, {
                        message: "Pedido eliminado",
                        order: {
                            id: deleted.id,
                            fecha: deleted.fecha.toISOString(),
                            total: parseFloat(deleted.total),
                            metodoPago: deleted.metodo_pago,
                            estado: deleted.estado
                        }
                    });
                } catch (error) {
                    await client.query("ROLLBACK");
                    throw error;
                } finally {
                    client.release();
                }
            }
        }

        sendJson(res, 404, { message: "Ruta API no encontrada" });
    } catch (error) {
        console.error("Error en API:", error.message);
        sendJson(res, 500, { message: "Error interno del servidor" });
    }
}


initializeDatabase();

const server = http.createServer(async (req, res) => {
    try {
        if (req.url.startsWith("/api/")) {
            await handleApi(req, res);
            return;
        }
        serveStatic(req, res);
    } catch (error) {
        console.error("Error:", error.message);
        sendJson(res, 500, { message: "Error interno del servidor" });
    }
});

server.listen(PORT, HOST, () => {
    console.log(`\n✓ Fortaleza app corriendo en http://${HOST}:${PORT}`);
    console.log("✓ Base de datos: Neon PostgreSQL");
    console.log("✓ Admin por defecto -> usuario: admin | clave: admin123\n");
});

// Cerrar pool al terminar
process.on("SIGINT", async () => {
    console.log("\nCerrando conexiones...");
    await pool.end();
    process.exit(0);
});

