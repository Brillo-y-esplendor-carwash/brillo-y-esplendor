const express    = require("express");
const mongoose   = require("mongoose");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ── CONEXIÓN A MONGODB ────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch(err => console.error("❌ Error conectando a MongoDB:", err));

// ── MODELO RESERVA ────────────────────────────
const reservaSchema = new mongoose.Schema({
    fecha:         String,
    hora:          String,
    nombre:        String,
    apellido:      String,
    correo:        String,
    telefono:      String,
    pago:          String,
    vehiculo:      String,
    servicio:      String,
    precio:        Number,
    fechaRegistro: String,
    origen:        String
});

const Reserva = mongoose.model("Reserva", reservaSchema);

// ── MODELO GANANCIAS (documento único) ───────
const gananciasSchema = new mongoose.Schema({
    total:          { type: Number, default: 0 },
    totalReservas:  { type: Number, default: 0 }
});

const Ganancias = mongoose.model("Ganancias", gananciasSchema);

// Obtener o crear el documento de ganancias
async function getGanancias() {
    let g = await Ganancias.findOne();
    if (!g) g = await Ganancias.create({ total: 0, totalReservas: 0 });
    return g;
}

// ── GET /api/reservas → obtener todas ────────
app.get("/api/reservas", async (req, res) => {
    try {
        const reservas = await Reserva.find().sort({ _id: 1 });
        res.json(reservas);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener reservas" });
    }
});

// ── GET /api/ganancias → obtener total histórico
app.get("/api/ganancias", async (req, res) => {
    try {
        const g = await getGanancias();
        res.json(g);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener ganancias" });
    }
});

// ── POST /api/reservas → guardar nueva y sumar ganancias
app.post("/api/reservas", async (req, res) => {
    try {
        const nueva = new Reserva(req.body);
        await nueva.save();

        // Sumar al total histórico
        const precio = req.body.precio || 0;
        await Ganancias.findOneAndUpdate(
            {},
            { $inc: { total: precio, totalReservas: 1 } },
            { upsert: true }
        );

        res.json({ ok: true, reserva: nueva });
    } catch (err) {
        res.status(500).json({ error: "Error al guardar reserva" });
    }
});

// ── DELETE /api/reservas/:id → eliminar una (NO resta ganancias)
app.delete("/api/reservas/:id", async (req, res) => {
    try {
        await Reserva.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar reserva" });
    }
});

// ── DELETE /api/reservas → limpiar todas (NO resetea ganancias)
app.delete("/api/reservas", async (req, res) => {
    try {
        await Reserva.deleteMany({});
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: "Error al limpiar reservas" });
    }
});

app.listen(PORT, () => {
    console.log(`🚗 Servidor corriendo en http://localhost:${PORT}`);
});
