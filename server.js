const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ARCHIVO = path.join(__dirname, "reservas.json");

// Middlewares
app.use(express.json());
app.use(express.static(__dirname)); // sirve index.html y todo lo demás

// Inicializar archivo si no existe
if (!fs.existsSync(ARCHIVO)) {
    fs.writeFileSync(ARCHIVO, "[]", "utf8");
}

// ── GET /api/reservas → leer todas las reservas
app.get("/api/reservas", (req, res) => {
    const datos = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    res.json(datos);
});

// ── POST /api/reservas → guardar una nueva reserva
app.post("/api/reservas", (req, res) => {
    const datos = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    const nueva = { ...req.body, id: Date.now() };
    datos.push(nueva);
    fs.writeFileSync(ARCHIVO, JSON.stringify(datos, null, 2), "utf8");
    res.json({ ok: true, reserva: nueva });
});

// ── DELETE /api/reservas → limpiar todas las reservas
app.delete("/api/reservas", (req, res) => {
    fs.writeFileSync(ARCHIVO, "[]", "utf8");
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
