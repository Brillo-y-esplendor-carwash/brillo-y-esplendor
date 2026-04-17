/* ── CREDENCIALES ─────────────────────────────── */
const USUARIO = ["admin","martin","ezequiel"];
const PASSWORD = "brillo2026";

/* ── LOGIN ────────────────────────────────────── */
function login() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value.trim();

    if (USUARIO.includes(user) && pass === PASSWORD) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        cargarHistorial();
    } else {
        const err = document.getElementById("loginError");
        err.innerText = "❌ Usuario o contraseña incorrectos";
        err.style.display = "block";
    }
}

function cerrarSesion() {
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("loginBox").style.display = "flex";
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginError").innerText = "";
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && document.getElementById("loginBox").style.display !== "none") {
        login();
    }
});

/* ── DATOS ────────────────────────────────────── */
let historialCompleto = [];

async function cargarHistorial() {
    const lista = document.getElementById("lista");

    try {
        // Cargar reservas activas y ganancias históricas en paralelo
        const [resReservas, resGanancias] = await Promise.all([
            fetch("/api/reservas"),
            fetch("/api/ganancias")
        ]);

        historialCompleto = await resReservas.json();
        const ganancias   = await resGanancias.json();

        renderizarResumen(ganancias);
        renderizarTarjetas(historialCompleto);

    } catch (err) {
        lista.innerHTML = `<p class="vacio">❌ No se pudo conectar al servidor.</p>`;
    }
}

/* ── RESUMEN FIJO (ganancias históricas) ─────── */
function renderizarResumen(ganancias) {
    document.getElementById("resumen").innerHTML = `
        <div class="resumen-card">
            <div>
                <span>Reservas totales atendidas</span>
                <strong>${ganancias.totalReservas || 0}</strong>
            </div>
            <div>
                <span>Ganancias totales</span>
                <strong>$${(ganancias.total || 0).toLocaleString("es-CL")}</strong>
            </div>
            <div>
                <span>Reservas pendientes</span>
                <strong>${historialCompleto.length}</strong>
            </div>
        </div>
    `;
}

/* ── ELIMINAR RESERVA ────────────────────────── */
async function reservaLista(id) {
    if (!confirm("¿Marcar esta reserva como lista y eliminarla?")) return;

    try {
        const res = await fetch(`/api/reservas/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();

        historialCompleto = historialCompleto.filter(r => r._id !== id);

        // Actualizar solo el contador de pendientes en el resumen
        const resGanancias = await fetch("/api/ganancias");
        const ganancias = await resGanancias.json();
        renderizarResumen(ganancias);
        renderizarTarjetas(historialCompleto);

    } catch (err) {
        alert("❌ No se pudo eliminar la reserva.");
    }
}

/* ── RENDERIZAR TARJETAS ─────────────────────── */
function renderizar(historial) {
    renderizarTarjetas(historial);
}

function renderizarTarjetas(historial) {
    const lista = document.getElementById("lista");

    if (historial.length === 0) {
        lista.innerHTML = `<p class="vacio">No hay reservas pendientes.</p>`;
        return;
    }

    lista.innerHTML = [...historial].reverse().map(r => `
        <div class="card">
            <div class="card-header">
                <span class="nombre">${r.nombre} ${r.apellido || ""}</span>
                <span class="precio">${r.precio ? "$" + r.precio.toLocaleString("es-CL") : "Por confirmar"}</span>
            </div>
            <div class="card-body">
                <p>📅 ${r.fecha} a las ${r.hora}</p>
                ${r.vehiculo !== "Por confirmar" ? `<p>${r.vehiculo} · ${r.servicio}</p>` : ""}
                ${r.pago !== "Por confirmar" ? `<p>💳 ${r.pago}</p>` : ""}
                ${r.correo ? `<p>📧 ${r.correo} · 📞 ${r.telefono}</p>` : ""}
                ${r.origen ? `<p class="origen">📌 Origen: ${r.origen}</p>` : ""}
                <p class="fecha-registro">Registrado: ${r.fechaRegistro}</p>
            </div>
            <div class="card-footer">
                <button class="btn-lista" onclick="reservaLista('${r._id}')">✅ Reserva lista</button>
            </div>
        </div>
    `).join("");
}

/* ── FILTROS ─────────────────────────────────── */
function filtrar() {
    const nombre = document.getElementById("filtrNombre").value.toLowerCase().trim();
    const hora   = document.getElementById("filtrHora").value.toLowerCase().trim();
    const fecha  = document.getElementById("filtrFecha").value.toLowerCase().trim();

    const resultado = historialCompleto.filter(r => {
        const nombreCompleto = (r.nombre + " " + (r.apellido || "")).toLowerCase();
        const matchNombre = !nombre || nombreCompleto.includes(nombre);
        const matchHora   = !hora   || (r.hora || "").toLowerCase().includes(hora);
        const matchFecha  = !fecha  || (r.fecha || "").toLowerCase().includes(fecha);
        return matchNombre && matchHora && matchFecha;
    });

    renderizarTarjetas(resultado);
}

function limpiarFiltros() {
    document.getElementById("filtrNombre").value = "";
    document.getElementById("filtrHora").value = "";
    document.getElementById("filtrFecha").value = "";
    renderizarTarjetas(historialCompleto);
}

/* ── LIMPIAR TODO ────────────────────────────── */
async function limpiarHistorial() {
    if (confirm("¿Seguro que quieres borrar todo el historial pendiente?\nLas ganancias acumuladas no se borrarán.")) {
        await fetch("/api/reservas", { method: "DELETE" });
        historialCompleto = [];
        renderizarTarjetas([]);

        const resGanancias = await fetch("/api/ganancias");
        const ganancias = await resGanancias.json();
        renderizarResumen(ganancias);
    }
}
