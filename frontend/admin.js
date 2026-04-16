const tokenStorageKey = "fortaleza_admin_token";

function getToken() {
    return localStorage.getItem(tokenStorageKey) || "";
}

function setToken(token) {
    localStorage.setItem(tokenStorageKey, token);
}

function limpiarToken() {
    localStorage.removeItem(tokenStorageKey);
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
    };
}

function setLoginState(isLoading) {
    const loginBtn = document.getElementById("loginBtn");
    const usuario = document.getElementById("usuario");
    const clave = document.getElementById("clave");

    if (!loginBtn || !usuario || !clave) return;

    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? "Ingresando..." : "Ingresar";
    usuario.disabled = isLoading;
    clave.disabled = isLoading;
}

function togglePassword() {
    const clave = document.getElementById("clave");
    const toggleBtn = document.querySelector(".toggle-password");
    if (!clave || !toggleBtn) return;

    const isPassword = clave.type === "password";
    clave.type = isPassword ? "text" : "password";
    toggleBtn.textContent = isPassword ? "Ocultar" : "Mostrar";
    clave.focus();
}

function mostrarLogin() {
    document.getElementById("loginBox")?.classList.remove("hidden");
    document.getElementById("panelBox")?.classList.add("hidden");
}

function mostrarPanel() {
    document.getElementById("loginBox")?.classList.add("hidden");
    document.getElementById("panelBox")?.classList.remove("hidden");
}

function setStatus(message, isError = false) {
    const statusEl = document.getElementById("panelStatus");
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.classList.toggle("error-text", isError);
}

async function login() {
    const username = document.getElementById("usuario")?.value.trim() || "";
    const password = document.getElementById("clave")?.value.trim() || "";
    const errorEl = document.getElementById("loginError");
    if (errorEl) errorEl.textContent = "";

    if (!username || !password) {
        if (errorEl) errorEl.textContent = "Completa usuario y contrasena.";
        return;
    }

    setLoginState(true);

    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Credenciales invalidas.");
        }

        setToken(data.token);
        await cargarPedidos();
    } catch (error) {
        if (errorEl) errorEl.textContent = error.message;
    } finally {
        setLoginState(false);
    }
}

function logout() {
    limpiarToken();
    mostrarLogin();
    setStatus("");
}

function appendCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
    return cell;
}

function buildActionButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
}

function renderPedidos(pedidos) {
    const tbody = document.querySelector("#tablaPedidos tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 7;
        cell.textContent = "No hay pedidos todavia.";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    pedidos.forEach((pedido) => {
        const row = document.createElement("tr");
        const items = Array.isArray(pedido.items)
            ? pedido.items.map((item) => item.nombre).join(", ")
            : "";
        const fecha = new Date(pedido.fecha).toLocaleString("es-PE");

        appendCell(row, pedido.id || "");
        appendCell(row, fecha);
        appendCell(row, items);
        appendCell(row, `S/ ${Number(pedido.total || 0).toFixed(2)}`);
        appendCell(row, pedido.metodoPago || "");

        const estadoCell = document.createElement("td");
        const estadoTag = document.createElement("span");
        const estado = pedido.estado || "Pendiente";
        const estadoClass = estado.toLowerCase().replace(/\s+/g, "-");
        estadoTag.className = `estado estado-${estadoClass}`;
        estadoTag.textContent = estado;
        estadoCell.appendChild(estadoTag);
        row.appendChild(estadoCell);

        const actionsCell = document.createElement("td");
        actionsCell.appendChild(
            buildActionButton("En proceso", "mini-btn", () => actualizarEstado(pedido.id, "En proceso"))
        );
        actionsCell.appendChild(
            buildActionButton("Entregado", "mini-btn success", () => actualizarEstado(pedido.id, "Entregado"))
        );

        if (estado === "Entregado") {
            actionsCell.appendChild(
                buildActionButton("Eliminar", "mini-btn danger", () => eliminarPedido(pedido.id))
            );
        }

        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });
}

async function cargarPedidos() {
    try {
        const response = await fetch("/api/admin/orders", {
            headers: authHeaders()
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "No autorizado.");
        }

        renderPedidos(data.orders);
        mostrarPanel();
        setStatus("Panel sincronizado con el servidor.");
    } catch (error) {
        limpiarToken();
        mostrarLogin();
        setStatus("Inicia sesion para ver los pedidos.", true);
    }
}

async function actualizarEstado(id, estado) {
    const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ estado })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        alert(data.message || "No se pudo actualizar el estado.");
        return;
    }

    await cargarPedidos();
}

async function eliminarPedido(id) {
    if (!confirm("Este pedido entregado se eliminara del panel. Deseas continuar?")) {
        return;
    }

    const response = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        alert(data.message || "No se pudo eliminar el pedido.");
        return;
    }

    await cargarPedidos();
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        login();
    });
}

cargarPedidos();
