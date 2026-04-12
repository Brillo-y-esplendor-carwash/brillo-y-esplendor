let dia = localStorage.getItem("dia");
let mes = localStorage.getItem("mes");
let hora = localStorage.getItem("hora");

// Mostrar fecha
document.getElementById("fecha").innerText =
    "📅 " + dia + " de " + mes + " a las " + hora;

// Limpiar localStorage
localStorage.clear();

// Validar y finalizar reserva
function finalizar() {
    let nombre = document.getElementById("nombre").value.trim();
    let apellido = document.getElementById("apellido").value.trim();
    let correo = document.getElementById("correo").value.trim();
    let telefono = document.getElementById("telefono").value.trim();

    if (!nombre || !apellido || !correo || !telefono) {
        alert("❌ Completa todos los campos");
        return;
    }

    // Mensaje de confirmación
    document.querySelector(".box").innerHTML = `
        <h2>✅ Reserva confirmada</h2>
        <p><strong>${nombre} ${apellido}</strong></p>
        <p>📅 ${dia} de ${mes}</p>
        <p>⏰ ${hora}</p>
        <p>🚗 Te esperamos en Brillo y Esplendor</p>
    `;
}
