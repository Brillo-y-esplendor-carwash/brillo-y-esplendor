/* ── RESERVA BOX ─────────────────────────────── */
function actualizarDias() {
    let mes = document.getElementById("mes").value;
    let diaSelect = document.getElementById("dia");

    let dias = 31;
    if (mes === "Abril" || mes === "Junio" || mes === "Septiembre" || mes === "Noviembre") dias = 30;
    if (mes === "Febrero") dias = 28;

    diaSelect.innerHTML = "";
    for (let i = 1; i <= dias; i++) {
        let option = document.createElement("option");
        option.text = i;
        diaSelect.add(option);
    }
}

function abrirReserva() { document.getElementById("reservaBox").style.display = "block"; }
function cerrarReserva() { document.getElementById("reservaBox").style.display = "none"; }

// NEW

function confirmarReserva() {
    if (!localStorage.getItem("dia")) {
        alert("❌ Selecciona una fecha y hora");
        return;
    }
    window.location.href = "reserva-vehiculo.html";
}

// OLD 
// function confirmarReserva() {
//     let dia = document.getElementById("dia").value;
//     let mes = document.getElementById("mes").value;
//     let hora = document.getElementById("hora").value;

//     const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
//         "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

//     const hoy = new Date();
//     const mesActual = hoy.getMonth();
//     const diaActual = hoy.getDate();
//     const mesSeleccionado = meses.indexOf(mes);
//     const diaSeleccionado = parseInt(dia);

//     if (mesSeleccionado < mesActual || (mesSeleccionado === mesActual && diaSeleccionado < diaActual)) {
//         alert("⚠️ No puedes reservar una fecha que ya pasó. Selecciona una fecha disponible.");
//         return;
//     }

//     localStorage.setItem("dia", dia);
//     localStorage.setItem("mes", mes);
//     localStorage.setItem("hora", hora);

//     window.location.href = "reserva-vehiculo.html";
// }

function irA(id) {
    document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

/* ── SLIDER ──────────────────────────────────── */
let slides = document.querySelectorAll(".slide");
let index = 0;

function showSlide(i) {
    slides[index].classList.remove("active");
    index = i;
    slides[index].classList.add("active");
}

setInterval(() => { showSlide((index + 1) % slides.length); }, 3000);

/* ── CHAT ────────────────────────────────────── */
function openChat() {
    document.querySelector(".chat-small").style.display = "none";
    document.getElementById("chatBox").style.display = "flex";
}

function minimizeChat() {
    document.getElementById("chatBox").style.display = "none";
    document.querySelector(".chat-small").style.display = "none";

    let bubble = document.querySelector(".chat-bubble-icon");
    bubble.style.display = "block";

    setTimeout(() => {
        bubble.style.display = "none";
        document.querySelector(".chat-small").style.display = "block";
    }, 4000);
}

function restoreChat() {
    document.querySelector(".chat-bubble-icon").style.display = "none";
    document.getElementById("chatBox").style.display = "flex";
}

function sendMessage() {
    let input = document.getElementById("userInput");
    let msg = input.value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
    if (msg === "") return;

    addMessage(input.value, "user");
    input.value = "";
    process(msg);
}

let estadoChat = null;
let reservaData = {};

const mesesTexto = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/* ── GUARDAR RESERVA DEL CHAT EN EL SERVIDOR ── */
async function guardarReservaChat() {
    const reserva = {
        fecha: reservaData.dia + " de " + mesesTexto[reservaData.mes - 1],
        hora: reservaData.hora,
        nombre: reservaData.nombre,
        apellido: "",
        correo: "",
        telefono: "",
        pago: "Por confirmar",
        vehiculo: "Por confirmar",
        servicio: "Por confirmar",
        precio: 0,
        fechaRegistro: new Date().toLocaleString("es-CL"),
        origen: "Chat IA"
    };

    try {
        await fetch("/api/reservas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reserva)
        });
    } catch (err) {
        console.error("No se pudo guardar la reserva del chat:", err);
    }
}

function process(msg) {

    if (msg.includes("hola") || msg.includes("cancelar") || msg.includes("salir")) {
        estadoChat = null;
    }

    /* RESERVAS */
    if (
    msg.includes("reserv") ||
    msg.includes("agend") ||
    msg === "hora" ||
    msg.includes("quiero una hora") ||
    msg.includes("pedir hora") ||
    msg.includes("tomar hora") ||
    msg.includes("cita")
) {
        reply("📅 Para reservar una hora utiliza el apartado 'Reservar' disponible en el menú principal.");
        return;
    }

    /* FLUJO RESERVA */
    if (estadoChat === "dia") {
        let match = msg.match(/\d+/);
        let numero = match ? parseInt(match[0]) : NaN;

        let mes = null;
        if (msg.includes("enero")) mes = 1;
        if (msg.includes("febrero")) mes = 2;
        if (msg.includes("marzo")) mes = 3;
        if (msg.includes("abril")) mes = 4;
        if (msg.includes("mayo")) mes = 5;
        if (msg.includes("junio")) mes = 6;
        if (msg.includes("julio")) mes = 7;
        if (msg.includes("agosto")) mes = 8;
        if (msg.includes("septiembre")) mes = 9;
        if (msg.includes("octubre")) mes = 10;
        if (msg.includes("noviembre")) mes = 11;
        if (msg.includes("diciembre")) mes = 12;

        if (!mes) mes = new Date().getMonth() + 1;

        let maxDias = 31;
        if ([4, 6, 9, 11].includes(mes)) maxDias = 30;
        if (mes === 2) maxDias = 28;

        if (isNaN(numero) || numero < 1 || numero > maxDias) {
            reply("❌ Ese día no es válido para ese mes");
            return;
        }

        reservaData.dia = numero;
        reservaData.mes = mes;
        estadoChat = "hora";
        reply("Genial 😊 ¿A qué hora? (ej: 10:00)");
        return;
    }

    if (estadoChat === "hora") {
        let hora = msg.replace("a las", "").trim();
        reservaData.hora = hora;
        estadoChat = "nombre";
        reply("Perfecto 👌 ¿Cuál es tu nombre?");
        return;
    }

    if (estadoChat === "nombre") {
        reservaData.nombre = msg;
        estadoChat = "confirmar";
        reply("Listo 🎉 Reserva para el " + reservaData.dia + " de " + mesesTexto[reservaData.mes - 1] +
            " a las " + reservaData.hora + " a nombre de " + reservaData.nombre + ". ¿Confirmas? (si/no)");
        return;
    }

    if (estadoChat === "confirmar") {
        if (msg.includes("si")) {
            guardarReservaChat(); // ✅ guarda en el servidor
            reply("✅ Reserva confirmada, te esperamos 🚗✨");
        } else {
            reply("❌ Reserva cancelada");
        }
        estadoChat = null;
        return;
    }

    /* RESPUESTAS NORMALES */
    if (
    msg.includes("pago") ||
    msg.includes("pagar") ||
    msg.includes("tarjeta") ||
    msg.includes("transferencia") ||
    msg.includes("efectivo") ||
    msg.includes("debito") ||
    msg.includes("credito")
) {
        reply("💳 Aceptamos pago en local, tarjeta y transferencia. Puedes elegir el método de pago al realizar tu reserva.");
        return;
    }

    if (msg.includes("punto") || msg.includes("puntos brillo") || msg.includes("canje") || msg.includes("canjear") || msg.includes("fidelizacion") || msg.includes("beneficio")) {
        reply("⭐ Nuestro sistema Puntos Brillo permite acumular puntos por cada lavado y luego canjearlos por servicios.\n\nPuntos que ganas:\nBásico: Citycar 500 pts, Sedán 625 pts, SUV/Camioneta 750 pts.\nPremium: Citycar 1000 pts, Sedán 1200 pts, SUV/Camioneta 1450 pts.\nCompleto: Citycar 2000 pts, Sedán 2350 pts, SUV/Camioneta 3000 pts.\n\nPuntos necesarios para canjear:\nBásico: Citycar 4000 pts, Sedán 5000 pts, SUV/Camioneta 6000 pts.\nPremium: Citycar 7500 pts, Sedán 9000 pts, SUV/Camioneta 11000 pts.\nCompleto: Citycar 15000 pts, Sedán 17500 pts, SUV/Camioneta 22500 pts.");
        return;
    }

    if (
    msg.includes("descuento") ||
    msg.includes("descuentos") ||
    msg.includes("promo") ||
    msg.includes("promocion") ||
    msg.includes("promociones") ||
    msg.includes("oferta") ||
    msg.includes("cumple") ||
    msg.includes("cumpleanos") ||
    msg.includes("halloween") ||
    msg.includes("navidad") ||
    msg.includes("fiestas patrias") ||
    msg.includes("semana santa")
) {
        reply("🎁 Promociones disponibles:\n\n🎂 Cumpleaños: 25% de descuento en servicio Premium o Completo, o doble puntaje durante el mes de cumpleaños.\n\n👨‍👩‍👧 Espacio Familiar: 15% de descuento en servicio Premium para embarazadas o familias con niños de 1 a 10 años, de lunes a miércoles.\n\n🐇 Semana Santa: bono de +300 Puntos Brillo extra.\n\n🇨🇱 Fiestas Patrias: 20% de descuento si traes tu auto caracterizado.\n\n🎃 Halloween: 15% de descuento si vienes disfrazado o tu auto trae decoración temática.\n\n🎄 Navidad: compra un lavado Completo y lleva un Básico al 50% para regalar.\n\n*Promociones no acumulables con otros descuentos ni con canjes de puntos.*");
        return;
    }


    if (
    msg.includes("contacto") ||
    msg.includes("correo") ||
    msg.includes("email") ||
    msg.includes("mail") ||
    msg.includes("telefono") ||
    msg.includes("fono") ||
    msg.includes("whatsapp")
) {
        reply("📩 Por ahora el contacto oficial disponible es contacto@brilloyesplendor.cl.");
        return;
    }
    if (
    msg.includes("hola") ||
    msg.includes("buenas") ||
    msg.includes("buen dia") ||
    msg.includes("buenas tardes") ||
    msg.includes("buenas noches") ||
    msg.includes("ayuda")
) {
    reply("¡Hola! 👋 Bienvenido a Brillo y Esplendor.\n\nPuedes consultarme sobre:\n🚗 Precios\n🧼 Servicios\n⭐ Puntos Brillo\n🎁 Promociones y descuentos\n💳 Medios de pago\n📅 Reservas\n⏰ Horarios\n📩 Contacto");
    return;
}

if (
    msg.includes("horario") ||
    msg.includes("horarios") ||
    msg.includes("abren") ||
    msg.includes("abierto") ||
    msg.includes("cierran") ||
    msg.includes("cerrado") ||
    msg.includes("atienden") ||
    msg.includes("atencion")
) {
    reply("⏰ Atendemos de lunes a sábado de 9:00 a 18:00.");
    return;
}
    const pidePrecio = msg.includes("precio") || msg.includes("precios") || msg.includes("cuanto") || msg.includes("cuesta") || msg.includes("valor") || msg.includes("sale");

    const esBasico = msg.includes("basico");
    const esPremium = msg.includes("premium");
    const esCompleto = msg.includes("completo");

    const esCitycar = msg.includes("citycar") || msg.includes("peque") || msg.includes("auto chico") || msg.includes("vehiculo chico");
    const esSedan = msg.includes("sedan") || msg.includes("mediano");
    const esSuv = msg.includes("suv") || msg.includes("camioneta") || msg.includes("grande");

    if (pidePrecio && esBasico && esCitycar) {
        reply("💰 El lavado Básico para Citycar tiene un valor de $8.000.");
        return;
    }

    if (pidePrecio && esBasico && esSedan) {
        reply("💰 El lavado Básico para Sedán tiene un valor de $10.000.");
        return;
    }

    if (pidePrecio && esBasico && esSuv) {
        reply("💰 El lavado Básico para SUV/Camioneta tiene un valor de $12.000.");
        return;
    }

    if (pidePrecio && esPremium && esCitycar) {
        reply("💰 El lavado Premium para Citycar tiene un valor de $15.000.");
        return;
    }

    if (pidePrecio && esPremium && esSedan) {
        reply("💰 El lavado Premium para Sedán tiene un valor de $18.000.");
        return;
    }

    if (pidePrecio && esPremium && esSuv) {
        reply("💰 El lavado Premium para SUV/Camioneta tiene un valor de $22.000.");
        return;
    }

    if (pidePrecio && esCompleto && esCitycar) {
        reply("💰 El lavado Completo para Citycar tiene un valor de $30.000.");
        return;
    }

    if (pidePrecio && esCompleto && esSedan) {
        reply("💰 El lavado Completo para Sedán tiene un valor de $35.000.");
        return;
    }

    if (pidePrecio && esCompleto && esSuv) {
        reply("💰 El lavado Completo para SUV/Camioneta tiene un valor de $45.000.");
        return;
    }

    if (pidePrecio && esCitycar) {
        reply("🚗 Precios para Citycar:\nBásico: $8.000\nPremium: $15.000\nCompleto: $30.000");
        return;
    }

    if (pidePrecio && esSedan) {
        reply("🚙 Precios para Sedán:\nBásico: $10.000\nPremium: $18.000\nCompleto: $35.000");
        return;
    }

    if (pidePrecio && esSuv) {
        reply("🚐 Precios para SUV/Camioneta:\nBásico: $12.000\nPremium: $22.000\nCompleto: $45.000");
        return;
    }

    if (pidePrecio && (esBasico || esPremium || esCompleto)) {
        reply("Para darte el valor exacto, dime si tu vehículo es Citycar, Sedán o SUV/Camioneta.");
        return;
    }

    if (pidePrecio) {
        reply("Claro 😊 ¿Tu vehículo es Citycar 🚗, Sedán 🚙 o SUV/Camioneta 🚐?");
        return;
    }

    if (esCitycar) {
        reply("🚗 Precios para Citycar:\nBásico: $8.000\nPremium: $15.000\nCompleto: $30.000");
        return;
    }

    if (esSedan) {
        reply("🚙 Precios para Sedán:\nBásico: $10.000\nPremium: $18.000\nCompleto: $35.000");
        return;
    }

    if (esSuv) {
        reply("🚐 Precios para SUV/Camioneta:\nBásico: $12.000\nPremium: $22.000\nCompleto: $45.000");
        return;
    }
        if (msg.includes("servicio") || msg.includes("servicios") || msg.includes("lavado") || msg.includes("basico") || msg.includes("premium") || msg.includes("completo")) {
        reply("🧼 Tenemos tres servicios:\n\nBásico: lavado exterior simple.\nPremium: lavado exterior e interior con mayor detalle.\nCompleto: servicio más completo, ideal para una limpieza profunda del vehículo.");
        return;
    }

if (
    msg.includes("resena") ||
    msg.includes("resenas") ||
    msg.includes("reseña") ||
    msg.includes("reseñas") ||
    msg.includes("calificacion") ||
    msg.includes("calificaciones") ||
    msg.includes("opinion") ||
    msg.includes("opiniones") ||
    msg.includes("estrellas")
) {
    reply("⭐ Puedes ver reseñas y calificaciones de clientes en el apartado 'Reseñas y calificaciones' de la página principal.");
    return;
}


    reply("🤔 No entendí bien tu consulta. Puedes preguntarme por precios, servicios, horarios, reservas, pagos, promociones, descuentos, Puntos Brillo o contacto.");
}

function addMessage(text, type) {
    let div = document.createElement("div");
    div.classList.add("message", type);
    div.innerText = text;

    let chat = document.getElementById("chatMessages");
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function reply(t) { setTimeout(() => addMessage(t, "bot"), 500); }

/* ── INIT ────────────────────────────────────── */
window.onload = function () {
    actualizarDias();

    document.getElementById("userInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    // Mostrar usuario si hay sesión activa
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("nombre");

    if (token && name) {
        const navLogin = document.querySelector(".nav-login");
        navLogin.textContent = "👤 " + name + " / Dashboard";
        navLogin.href = "./historial.html";
    }
};
