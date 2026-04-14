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
        document.querySelector(".box").innerHTML = `
            <h2>✅ Reserva confirmada</h2>
            <p><strong>${nombre} ${apellido}</strong></p>
            <p>📅 ${reserva.fecha} a las ${hora}</p>
            <p>${vehiculo} · ${servicio}</p>
            <p>💰 $${reserva.precio.toLocaleString("es-CL")} — ${pago}</p>
            <p>🚗 Te esperamos en Brillo y Esplendor</p>
            <br>
            <button onclick="window.location.href='./index.html'">Volver al inicio</button>
        `;

    } catch (err) {
        alert("❌ No se pudo guardar la reserva. ¿Está corriendo el servidor?");
    }
}
