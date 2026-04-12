const historial = JSON.parse(localStorage.getItem("historial") || "[]");

const lista = document.getElementById("lista");
const resumen = document.getElementById("resumen");

// ── RESUMEN TOTAL ─────────────────────────────
if (historial.length === 0) {
    lista.innerHTML = `<p class="vacio">No hay reservas registradas aún.</p>`;
    resumen.innerHTML = "";
} else {
    const total = historial.reduce((acc, r) => acc + r.precio, 0);

    resumen.innerHTML = `
        <div class="resumen-card">
            <div><span>Total reservas</span><strong>${historial.length}</strong></div>
            <div><span>Ingresos totales</span><strong>$${total.toLocaleString("es-CL")}</strong></div>
        </div>
    `;

    // ── TARJETAS ──────────────────────────────
    lista.innerHTML = [...historial].reverse().map(r => `
        <div class="card">
            <div class="card-header">
                <span class="nombre">${r.nombre} ${r.apellido}</span>
                <span class="precio">$${r.precio.toLocaleString("es-CL")}</span>
            </div>
            <div class="card-body">
                <p>📅 ${r.fecha} a las ${r.hora}</p>
                <p>${r.vehiculo} · ${r.servicio}</p>
                <p>💳 ${r.pago}</p>
                <p>📧 ${r.correo} · 📞 ${r.telefono}</p>
                <p class="fecha-registro">Registrado: ${r.fechaRegistro}</p>
            </div>
        </div>
    `).join("");
}

// ── EXPORTAR JSON ─────────────────────────────
function exportarJSON() {
    const blob = new Blob([JSON.stringify(historial, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservas-brillo-esplendor.json";
    a.click();
    URL.revokeObjectURL(url);
}

// ── LIMPIAR ───────────────────────────────────
function limpiarHistorial() {
    if (confirm("¿Seguro que quieres borrar todo el historial?")) {
        localStorage.removeItem("historial");
        location.reload();
    }
}
