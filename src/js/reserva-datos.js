let dia      = localStorage.getItem("dia");
let mes      = localStorage.getItem("mes");
let hora     = localStorage.getItem("hora");
let vehiculo = localStorage.getItem("vehiculo");
let servicio = localStorage.getItem("servicio");
let precio   = localStorage.getItem("precio");

// Mostrar fecha
document.getElementById("fecha").innerText =
    "📅 " + dia + " de " + mes + " a las " + hora;

// Mostrar resumen de servicio
document.getElementById("resumen-servicio").innerText =
    vehiculo + " · " + servicio + " · $" + parseInt(precio).toLocaleString("es-CL");

async function finalizar() {
    let nombre   = document.getElementById("nombre").value.trim();
    let apellido = document.getElementById("apellido").value.trim();
    let correo   = document.getElementById("correo").value.trim();
    let telefono = document.getElementById("telefono").value.trim();
    let pago     = document.getElementById("pago").value;

    if (!nombre || !apellido || !correo || !telefono) {
        alert("❌ Completa todos los campos");
        return;
    }

    const reserva = {
        fecha: dia + " de " + mes,
        hora: hora,
        nombre: nombre,
        apellido: apellido,
        correo: correo,
        telefono: telefono,
        pago: pago,
        vehiculo: vehiculo,
        servicio: servicio,
        precio: parseInt(precio),
        fechaRegistro: new Date().toLocaleString("es-CL")
    };

    try {
        const res = await fetch("/api/reservas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reserva)
        });

        if (!res.ok) throw new Error("Error al guardar");

        // Limpiar localStorage
        ["dia", "mes", "hora", "vehiculo", "servicio", "precio"].forEach(k =>
            localStorage.removeItem(k)
        );

        // Mostrar confirmación
        document.querySelector(".reserva-card").innerHTML = `
            <div style="text-align:center; padding: 10px 0 20px;">
                <div style="font-size:52px; margin-bottom:12px; filter:drop-shadow(0 0 12px rgba(56,189,248,0.4));">✅</div>
                <h2 style="font-family:'Syne',sans-serif; font-size:22px; color:#38BDF8; margin-bottom:6px;">¡Reserva confirmada!</h2>
                <p style="color:#94A3B8; font-size:14px; margin-bottom:24px;">Te esperamos en Brillo y Esplendor 🚗✨</p>
            </div>

            <div style="
                background: rgba(56,189,248,0.06);
                border: 1px solid rgba(56,189,248,0.15);
                border-radius: 14px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 24px;
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
                    <span style="color:#94A3B8; font-size:13px; text-transform:uppercase; letter-spacing:0.4px;">Cliente</span>
                    <span style="color:#F1F5F9; font-weight:700;">${nombre} ${apellido}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
                    <span style="color:#94A3B8; font-size:13px; text-transform:uppercase; letter-spacing:0.4px;">Fecha</span>
                    <span style="color:#F1F5F9; font-weight:600;">📅 ${reserva.fecha} · ${hora}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
                    <span style="color:#94A3B8; font-size:13px; text-transform:uppercase; letter-spacing:0.4px;">Vehículo</span>
                    <span style="color:#F1F5F9; font-weight:600;">${vehiculo}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
                    <span style="color:#94A3B8; font-size:13px; text-transform:uppercase; letter-spacing:0.4px;">Servicio</span>
                    <span style="color:#F1F5F9; font-weight:600;">${servicio}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
                    <span style="color:#94A3B8; font-size:13px; text-transform:uppercase; letter-spacing:0.4px;">Pago</span>
                    <span style="color:#F1F5F9; font-weight:600;">${pago}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#94A3B8; font-size:13px; text-transform:uppercase; letter-spacing:0.4px;">Total</span>
                    <span style="color:#38BDF8; font-weight:800; font-size:20px; font-family:'Syne',sans-serif;">$${reserva.precio.toLocaleString("es-CL")}</span>
                </div>
            </div>

            <button onclick="window.location.href='./index.html'" style="
                width:100%;
                padding:13px;
                background:#1E3A8A;
                color:white;
                border:none;
                border-radius:12px;
                font-size:15px;
                font-weight:700;
                font-family:'DM Sans',Arial,sans-serif;
                cursor:pointer;
                box-shadow:0 4px 20px rgba(30,58,138,0.4);
                transition:background 0.2s;
            " onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#1E3A8A'">
                ← Volver al inicio
            </button>
        `;

    } catch (err) {
        alert("❌ No se pudo guardar la reserva. ¿Está corriendo el servidor?");
    }
}