/* ── CREDENCIALES (cámbialas cuando quieras) ── */
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

// Login con Enter
document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && document.getElementById("loginBox").style.display !== "none") {
        login();
    }
});

/* ── DATOS ────────────────────────────────────── */
let historialCompleto = [];

async function cargarHistorial() {
    const lista = document.getElementById("lista");
    const resumen = document.getElementById("resumen");

    try {
        const res = await fetch("/api/reservas");
        historialCompleto = await res.json();
        renderizar(historialCompleto);
    } catch (err) {
        lista.innerHTML = `<p class="vacio">❌ No se pudo conectar al servidor.</p>`;
    }
}

/* ── RENDERIZAR TARJETAS ─────────────────────── */
function renderizar(historial) {
    const lista = document.getElementById("lista");
    const resumen = document.getElementById("resumen");

    if (historial.length === 0) {
        lista.innerHTML = `<p class="vacio">No se encontraron reservas.</p>`;
        resumen.innerHTML = "";
        return;
    }

    const total = historial.reduce((acc, r) => acc + (r.precio || 0), 0);
    resumen.innerHTML = `
        <div class="resumen-card">
            <div><span>Total reservas</span><strong>${historial.length}</strong></div>
            <div><span>Ingresos totales</span><strong>$${total.toLocaleString("es-CL")}</strong></div>
        </div>
    `;

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

    renderizar(resultado);
}

function limpiarFiltros() {
    document.getElementById("filtrNombre").value = "";
    document.getElementById("filtrHora").value = "";
    document.getElementById("filtrFecha").value = "";
    renderizar(historialCompleto);
}

/* ── LIMPIAR HISTORIAL ───────────────────────── */
async function limpiarHistorial() {
    if (confirm("¿Seguro que quieres borrar todo el historial?")) {
        await fetch("/api/reservas", { method: "DELETE" });
        historialCompleto = [];
        renderizar([]);
    }
}
