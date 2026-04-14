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

function confirmarReserva() {
    let dia = document.getElementById("dia").value;
    let mes = document.getElementById("mes").value;
    let hora = document.getElementById("hora").value;

    localStorage.setItem("dia", dia);
    localStorage.setItem("mes", mes);
    localStorage.setItem("hora", hora);

    window.location.href = "reserva-vehiculo.html";
}

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
    let msg = input.value.toLowerCase().trim();
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

    /* INICIAR RESERVA */
    if (msg.includes("reserv") || msg.includes("agend") || msg.includes("quiero una hora")) {
        estadoChat = "dia";
        reply("Perfecto 👍 ¿Qué día quieres reservar?");
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
    if (msg.includes("hola") || msg.includes("buenas")) {
        reply("¡Hola! 👋 Bienvenido a Brillo y Esplendor, ¿en qué puedo ayudarte?");
        return;
    }
    if (msg.includes("horario") || msg.includes("abren") || msg.includes("atienden")) {
        reply("Atendemos de lunes a sábado de 9:00 a 18:00 ⏰");
        return;
    }
    if (msg.includes("precio") || msg.includes("cuanto")) {
        reply("Claro 😊 ¿Tu vehículo es pequeño 🚗, mediano 🚙 o grande 🚐?");
        return;
    }
    if (msg.includes("peque")) {
        reply("Autos pequeños 🚗:\nBásico: $8.000\nPremium: $15.000\nCompleto: $30.000");
        return;
    }
    if (msg.includes("mediano")) {
        reply("Autos medianos 🚙:\nBásico: $10.000\nPremium: $18.000\nCompleto: $35.000");
        return;
    }
    if (msg.includes("grande") || msg.includes("camioneta")) {
        reply("Vehículos grandes 🚐:\nBásico: $12.000\nPremium: $22.000\nCompleto: $45.000");
        return;
    }

    reply("🤔 No entendí bien. Puedes preguntarme por precios, horarios o escribir 'reservar' para agendar una hora.");
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
};
