const WA_PHONE = "51932522826";

let carrito = [];

function agregar(nombre, precio) {
    carrito.push({ nombre, precio });
    mostrar();
}

function mostrar() {
    const lista = document.getElementById("lista");
    const totalEl = document.getElementById("total");
    if (!lista || !totalEl) return;

    lista.innerHTML = "";
    carrito.forEach((item) => {
        lista.innerHTML += `<li>${item.nombre} - S/ ${item.precio.toFixed(2)}</li>`;
    });
    totalEl.innerText = totalCarrito().toFixed(2);
}

function totalCarrito() {
    return carrito.reduce((acc, item) => acc + item.precio, 0);
}

async function registrarPedidoBackend(pedido) {
    const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido)
    });

    if (!response.ok) {
        throw new Error("No se pudo registrar el pedido en el servidor.");
    }

    return response.json();
}

async function pedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("Agrega al menos un producto antes de enviar.");
        return;
    }

    const metodoPago = document.getElementById("metodoPago").value;
    const total = totalCarrito();
    const pedido = {
        items: carrito,
        total,
        metodoPago
    };

    let numeroPedido = "FRT-PENDIENTE";
    try {
        const data = await registrarPedidoBackend(pedido);
        numeroPedido = data.order.id;
    } catch (error) {
        alert(error.message);
        return;
    }

    const detalle = carrito.map((item) => `- ${item.nombre} (S/ ${item.precio.toFixed(2)})`).join("\n");
    const texto = [
        `Hola Fortaleza, quiero hacer un pedido (${numeroPedido})`,
        "",
        "Detalle:",
        detalle,
        "",
        `Total: S/ ${total.toFixed(2)}`,
        `Metodo de pago: ${metodoPago}`,
        "",
        "Por favor confirmar disponibilidad y tiempo de entrega."
    ].join("\n");

    const url = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");

    carrito = [];
    mostrar();
    alert("Pedido enviado correctamente. Te abrimos WhatsApp para confirmar.");
}