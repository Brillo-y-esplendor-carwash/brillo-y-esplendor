const precios = {
    basico:   { citycar: 8000,  sedan: 10000, suv: 12000 },
    premium:  { citycar: 15000, sedan: 18000, suv: 22000 },
    completo: { citycar: 30000, sedan: 35000, suv: 45000 }
};

const nombresServicio = {
    basico: "Básico — Lavado exterior",
    premium: "Premium — Interior + exterior",
    completo: "Completo — Detalle total"
};

const nombresVehiculo = {
    citycar: "🚗 Citycar",
    sedan: "🚙 Sedán",
    suv: "🚐 SUV / Camioneta"
};

function actualizarPrecio() {
    let vehiculo = document.getElementById("vehiculo").value;
    let servicio = document.getElementById("servicio").value;
    let precio = precios[servicio][vehiculo];
    document.getElementById("precio-display").innerText =
        "$" + precio.toLocaleString("es-CL");
}

function continuar() {
    let vehiculo = document.getElementById("vehiculo").value;
    let servicio = document.getElementById("servicio").value;
    let precio = precios[servicio][vehiculo];

    localStorage.setItem("vehiculo", nombresVehiculo[vehiculo]);
    localStorage.setItem("servicio", nombresServicio[servicio]);
    localStorage.setItem("precio", precio);

    window.location.href = "./reserva-datos.html";
}

// Mostrar fecha y hora seleccionadas
document.getElementById("fecha-resumen").innerText =
    "📅 " + localStorage.getItem("dia") +
    " de " + localStorage.getItem("mes") +
    " a las " + localStorage.getItem("hora");

// Actualizar precio al cambiar selects
document.getElementById("vehiculo").addEventListener("change", actualizarPrecio);
document.getElementById("servicio").addEventListener("change", actualizarPrecio);

// Precio inicial
actualizarPrecio();
