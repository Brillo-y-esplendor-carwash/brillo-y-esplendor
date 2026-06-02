/* ── INICIO SESIÓN ───────────────────────────── */
const token    = localStorage.getItem("token");
const rol      = localStorage.getItem("rol");
const username = localStorage.getItem("username");

// Si no hay token, ir al login
if (!token) window.location.href = "./login.html";

// Headers con JWT para todas las peticiones
const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
};

/* ── PERMISOS POR ROL ────────────────────────── */
const permisos = {
    dueno:          { verGanancias: true,  verFiltros: true,  borrar: true,  limpiar: true,  usuarios: true,  verDatosCliente: true  },
    recepcionista:  { verGanancias: false, verFiltros: true,  borrar: true,  limpiar: true,  usuarios: false, verDatosCliente: true  },
    lavandero:      { verGanancias: false, verFiltros: false, borrar: false, limpiar: false, usuarios: false, verDatosCliente: false }
};

const p = permisos[rol] || permisos.lavandero;

/* ── BADGES DE ROL ─────────────────────────── */
const rolLabels = {
    dueno: { label: "Dueño", color: "#7C3AED" },
    recepcionista: { label: "Recepcionista", color: "#0369A1" },
    lavandero: { label: "Lavandero", color: "#16A34A" }
};

/* ── INICIALIZAR UI SEGÚN ROL ────────────────── */
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("dashboard").style.display = "block";

    // Badge de rol
    const badge = document.getElementById("rolBadge");
    const info = rolLabels[rol] || { label: rol, color: "#64748B" };
    badge.textContent = info.label + " · " + username;
    badge.style.background = info.color;

    // Mostrar/ocultar controles según permisos
    if (p.limpiar)   document.getElementById("btnLimpiar").style.display  = "inline-block";
    if (p.usuarios)  document.getElementById("btnUsuarios").style.display = "inline-block";
    if (p.verFiltros) document.getElementById("secFiltros").style.display = "flex";
    if (p.verGanancias) document.getElementById("secResumen").style.display = "block";

    // Título adaptado por rol
    if (rol === "lavandero") {
        document.getElementById("dashTitle").textContent = "Órdenes del día";
    }

    cargarHistorial();
});

/* ── CERRAR SESIÓN ───────────────────────────── */
function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("username");
    window.location.href = "./login.html";
}

/* ── DATOS ────────────────────────────────────── */
let historialCompleto = [];

async function cargarHistorial() {
    const lista = document.getElementById("lista");

    try {
        const promesas = [fetch("/api/reservas", { headers: authHeaders })];
        if (p.verGanancias) promesas.push(fetch("/api/ganancias", { headers: authHeaders }));

        const resultados = await Promise.all(promesas);

        // Verificar si el token expiró (401)
        if (resultados[0].status === 401) {
            cerrarSesion();
            return;
        }

        historialCompleto = await resultados[0].json();

        if (p.verGanancias && resultados[1]) {
            const ganancias = await resultados[1].json();
            renderizarResumen(ganancias);
        }

        renderizarTarjetas(historialCompleto);

    } catch (err) {
        lista.innerHTML = `<p class="vacio">❌ No se pudo conectar al servidor.</p>`;
    }
}

/* ── RESUMEN (solo dueño) ────────────────────── */
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
    if (!p.borrar) return;
    if (!confirm("¿Marcar esta reserva como lista y eliminarla?")) return;

    try {
        const res = await fetch(`/api/reservas/${id}`, { method: "DELETE", headers: authHeaders });
        if (res.status === 401) { cerrarSesion(); return; }
        if (!res.ok) throw new Error();

        historialCompleto = historialCompleto.filter(r => r._id !== id);

        if (p.verGanancias) {
            const resG = await fetch("/api/ganancias", { headers: authHeaders });
            const ganancias = await resG.json();
            renderizarResumen(ganancias);
        }
        renderizarTarjetas(historialCompleto);

    } catch (err) {
        alert("❌ No se pudo eliminar la reserva.");
    }
}

/* ── RENDERIZAR TARJETAS ─────────────────────── */
function renderizarTarjetas(historial) {
    const lista = document.getElementById("lista");

    if (historial.length === 0) {
        lista.innerHTML = `<p class="vacio">No hay reservas pendientes.</p>`;
        return;
    }

    lista.innerHTML = [...historial].reverse().map(r => {

        // Vista lavandero: solo fecha, hora, vehículo, y servicio
        if (!p.verDatosCliente) {
            return `
            <div class="card">
                <div class="card-header">
                    <span class="nombre">📅 ${r.fecha} a las ${r.hora}</span>
                    <span class="tag-servicio">${r.servicio || "Sin especificar"}</span>
                </div>
                <div class="card-body">
                    <p>${r.vehiculo && r.vehiculo !== "Por confirmar" ? r.vehiculo : "Vehículo por confirmar"}</p>
                    ${r.servicio && r.servicio !== "Por confirmar" ? `<p>🧼 ${r.servicio}</p>` : ""}
                </div>
            </div>`;
        }

        // Vista dueño / recepcionista
        return `
        <div class="card">
            <div class="card-header">
                <span class="nombre">${r.nombre} ${r.apellido || ""}</span>
                <span class="precio">${r.precio ? "$" + r.precio.toLocaleString("es-CL") : "Por confirmar"}</span>
            </div>
            <div class="card-body">
                <p>📅 ${r.fecha} a las ${r.hora}</p>
                ${r.vehiculo && r.vehiculo !== "Por confirmar" ? `<p>${r.vehiculo} · ${r.servicio}</p>` : ""}
                ${r.pago && r.pago !== "Por confirmar" ? `<p>💳 ${r.pago}</p>` : ""}
                ${r.correo ? `<p>📧 ${r.correo} · 📞 ${r.telefono}</p>` : ""}
                ${r.origen ? `<p class="origen">📌 Origen: ${r.origen}</p>` : ""}
                <p class="fecha-registro">Registrado: ${r.fechaRegistro}</p>
            </div>
            <div class="card-footer">
                <button class="btn-lista" onclick="reservaLista('${r._id}')">✅ Reserva lista</button>
            </div>
        </div>`;

    }).join("");
}

/* ── FILTROS ─────────────────────────────────── */
function filtrar() {
    const nombre = document.getElementById("filtrNombre").value.toLowerCase().trim();
    const hora   = document.getElementById("filtrHora").value.toLowerCase().trim();
    const fecha  = document.getElementById("filtrFecha").value.toLowerCase().trim();

    const resultado = historialCompleto.filter(r => {
        const nombreCompleto = (r.nombre + " " + (r.apellido || "")).toLowerCase();
        return (!nombre || nombreCompleto.includes(nombre)) &&
               (!hora   || (r.hora  || "").toLowerCase().includes(hora)) &&
               (!fecha  || (r.fecha || "").toLowerCase().includes(fecha));
    });

    renderizarTarjetas(resultado);
}

function limpiarFiltros() {
    document.getElementById("filtrNombre").value = "";
    document.getElementById("filtrHora").value = "";
    document.getElementById("filtrFecha").value = "";
    renderizarTarjetas(historialCompleto);
}

/* == LIMPIAR TODO ================== */
async function limpiarHistorial() {
    if (!p.limpiar) return;
    if (!confirm("¿Seguro que quieres borrar todo el historial pendiente?\nLas ganancias acumuladas no se borrarán.")) return;

    const res = await fetch("/api/reservas", { method: "DELETE", headers: authHeaders });
    if (res.status === 401) { cerrarSesion(); return; }

    historialCompleto = [];
    renderizarTarjetas([]);

    if (p.verGanancias) {
        const resG = await fetch("/api/ganancias", { headers: authHeaders });
        const ganancias = await resG.json();
        renderizarResumen(ganancias);
    }
}

/* ======================================
   GESTIÓN DE USUARIOS (admin - dueño)
   ====================================== */

function abrirUsuarios() {
    document.getElementById("modalUsuarios").style.display = "flex";
    cargarUsuarios();
}

function cerrarUsuarios() {
    document.getElementById("modalUsuarios").style.display = "none";
    cancelarForm();
}

async function cargarUsuarios() {
    const lista = document.getElementById("listaUsuarios");
    lista.innerHTML = `<p class="cargando">Cargando...</p>`;

    try {
        const res = await fetch("/api/usuarios", { headers: authHeaders });
        if (res.status === 401) { cerrarSesion(); return; }
        const usuarios = await res.json();
        renderizarUsuarios(usuarios);
    } catch (err) {
        lista.innerHTML = `<p class="error-msg">❌ No se pudo cargar usuarios</p>`;
    }
}

function renderizarUsuarios(usuarios) {
    const lista = document.getElementById("listaUsuarios");

    if (usuarios.length === 0) {
        lista.innerHTML = `<p class="vacio-small">No hay usuarios creados.</p>`;
        return;
    }

    const colores = { dueno: "#7C3AED", recepcionista: "#0369A1", lavandero: "#16A34A" };
    const etiquetas = { dueno: "Dueño", recepcionista: "Recepcionista", lavandero: "Lavandero" };

    lista.innerHTML = `
    <table class="tabla-usuarios">
        <thead>
            <tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Acciones</th></tr>
        </thead>
        <tbody>
            ${usuarios.map(u => `
            <tr>
                <td>${u.nombre}</td>
                <td><code>${u.username}</code></td>
                <td><span class="rol-pill" style="background:${colores[u.rol] || '#64748B'}">${etiquetas[u.rol] || u.rol}</span></td>
                <td class="acciones-col">
                    <button class="btn-edit" onclick='editarUsuario(${JSON.stringify(u)})'>✏️</button>
                    <button class="btn-del" onclick="eliminarUsuario('${u._id}', '${u.username}')">🗑</button>
                </td>
            </tr>`).join("")}
        </tbody>
    </table>`;
}

/* ── CREAR / EDITAR USUARIO ──────────────────── */
function editarUsuario(u) {
    document.getElementById("formTitle").textContent = "Editar usuario";
    document.getElementById("editUserId").value = u._id;
    document.getElementById("uNombre").value = u.nombre;
    document.getElementById("uUsername").value = u.username;
    document.getElementById("uPassword").value = "";
    document.getElementById("uRol").value = u.rol;
    document.getElementById("uPassword").placeholder = "Nueva contraseña (Dejar vacío para no cambiar)";
}

function cancelarForm() {
    document.getElementById("formTitle").textContent = "Crear usuario";
    document.getElementById("editUserId").value = "";
    document.getElementById("uNombre").value = "";
    document.getElementById("uUsername").value = "";
    document.getElementById("uPassword").value = "";
    document.getElementById("uRol").value = "recepcionista";
    document.getElementById("uPassword").placeholder = "Contraseña";
    document.getElementById("formError").textContent = "";
}

async function guardarUsuario() {
    const id       = document.getElementById("editUserId").value;
    const nombre   = document.getElementById("uNombre").value.trim();
    const username = document.getElementById("uUsername").value.trim();
    const password = document.getElementById("uPassword").value.trim();
    const rolU     = document.getElementById("uRol").value;
    const errEl    = document.getElementById("formError");

    errEl.textContent = "";

    if (!nombre || !username) {
        errEl.textContent = "❌ Nombre y usuario son obligatorios";
        return;
    }
    if (!id && !password) {
        errEl.textContent = "❌ La contraseña es obligatoria al crear";
        return;
    }

    const body = { nombre, username, rol: rolU };
    if (password) body.password = password;

    try {
        const url    = id ? `/api/usuarios/${id}` : "/api/usuarios";
        const method = id ? "PUT" : "POST";

        const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(body) });
        const data = await res.json();

        if (!res.ok) {
            errEl.textContent = "❌ " + (data.error || "Error al guardar");
            return;
        }

        cancelarForm();
        cargarUsuarios();

    } catch (err) {
        errEl.textContent = "❌ Error de conexión";
    }
}

async function eliminarUsuario(id, uname) {
    if (!confirm(`¿Eliminar al usuario "${uname}"?`)) return;

    try {
        const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE", headers: authHeaders });
        if (!res.ok) throw new Error();
        cargarUsuarios();
    } catch (err) {
        alert("❌ No se pudo eliminar el usuario");
    }
}
