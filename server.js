const express    = require("express");
const mongoose   = require("mongoose");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "brillo_secret_2026";

app.use(express.json());
app.use(express.static(__dirname));

// ── CONEXIÓN A MONGODB ────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Conectado a MongoDB Atlas");
        crearDuenoPorDefecto(); // Crear dueño si no existe ningún usuario
    })
    .catch(err => console.error("❌ Error conectando a MongoDB:", err));

// ── MODELO USUARIO ────────────────────────────
const usuarioSchema = new mongoose.Schema({
    nombre:   { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // bcrypt hash
    rol:      { type: String, enum: ["dueno", "recepcionista", "lavandero"], default: "recepcionista" }
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

// Crear dueño por defecto si no existe ningún usuario
async function crearDuenoPorDefecto() {
    const existe = await Usuario.findOne();
    if (!existe) {
        const hash = await bcrypt.hash("brillo2026", 10);
        await Usuario.create({
            nombre: "Dueño",
            username: "admin",
            password: hash,
            rol: "dueno"
        });
        console.log("👤 Usuario dueño creado por defecto: admin / brillo2026");
    }
}

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

// ── MODELO GANANCIAS ──────────────────────────
const gananciasSchema = new mongoose.Schema({
    total:         { type: Number, default: 0 },
    totalReservas: { type: Number, default: 0 }
});

const Ganancias = mongoose.model("Ganancias", gananciasSchema);

async function getGanancias() {
    let g = await Ganancias.findOne();
    if (!g) g = await Ganancias.create({ total: 0, totalReservas: 0 });
    return g;
}

// ── MIDDLEWARE JWT ────────────────────────────
function authMiddleware(rolesPermitidos = []) {
    return (req, res, next) => {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

        if (!token) return res.status(401).json({ error: "No autenticado" });

        try {
            const payload = jwt.verify(token, JWT_SECRET);
            req.usuario = payload;

            if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(payload.rol)) {
                return res.status(403).json({ error: "Sin permisos para esta acción" });
            }

            next();
        } catch (err) {
            return res.status(401).json({ error: "Token inválido o expirado" });
        }
    };
}

// ===========================
// RUTAS DE AUTENTICACIÓN
// ===========================

// POST /api/login
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: "Datos incompletos" });

    try {
        const usuario = await Usuario.findOne({ username });
        if (!usuario)
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        const match = await bcrypt.compare(password, usuario.password);
        if (!match)
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        const token = jwt.sign(
            { id: usuario._id, username: usuario.username, rol: usuario.rol, nombre: usuario.nombre },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({ token, rol: usuario.rol, username: usuario.username, nombre: usuario.nombre });

    } catch (err) {
        res.status(500).json({ error: "Error del servidor" });
    }
});

// ======================================
// RUTAS DE USUARIOS (solo dueño)
// ======================================

// GET /api/usuarios
app.get("/api/usuarios", authMiddleware(["dueno"]), async (req, res) => {
    try {
        const usuarios = await Usuario.find({}, "-password").sort({ username: 1 });
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// POST /api/usuarios → crear usuario
app.post("/api/usuarios", authMiddleware(["dueno"]), async (req, res) => {
    const { nombre, username, password, rol } = req.body;

    if (!nombre || !username || !password)
        return res.status(400).json({ error: "Nombre, usuario y contraseña son obligatorios" });

    try {
        const existe = await Usuario.findOne({ username });
        if (existe)
            return res.status(400).json({ error: "Ese nombre de usuario ya existe" });

        const hash = await bcrypt.hash(password, 10);
        const nuevo = await Usuario.create({ nombre, username, password: hash, rol: rol || "recepcionista" });

        res.json({ ok: true, usuario: { _id: nuevo._id, nombre: nuevo.nombre, username: nuevo.username, rol: nuevo.rol } });

    } catch (err) {
        res.status(500).json({ error: "Error al crear usuario" });
    }
});

// PUT /api/usuarios/:id → editar usuario
app.put("/api/usuarios/:id", authMiddleware(["dueno"]), async (req, res) => {
    const { nombre, username, password, rol } = req.body;

    try {
        const update = { nombre, username, rol };
        if (password) update.password = await bcrypt.hash(password, 10);

        // Verificar username único (excepto el propio)
        const duplicado = await Usuario.findOne({ username, _id: { $ne: req.params.id } });
        if (duplicado)
            return res.status(400).json({ error: "Ese nombre de usuario ya existe" });

        await Usuario.findByIdAndUpdate(req.params.id, update);
        res.json({ ok: true });

    } catch (err) {
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

// DELETE /api/usuarios/:id
app.delete("/api/usuarios/:id", authMiddleware(["dueno"]), async (req, res) => {
    try {
        // No permitir que el dueño se borre a sí mismo
        if (req.params.id === req.usuario.id)
            return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });

        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

// ========================================
// RUTAS DE RESERVAS (protegidas con JWT)
// ========================================

// GET /api/reservas — todos los roles autenticados
app.get("/api/reservas", authMiddleware(["dueno","recepcionista","lavandero"]), async (req, res) => {
    try {
        const reservas = await Reserva.find().sort({ _id: 1 });
        res.json(reservas);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener reservas" });
    }
});

// GET /api/ganancias — solo dueño
app.get("/api/ganancias", authMiddleware(["dueno"]), async (req, res) => {
    try {
        const g = await getGanancias();
        res.json(g);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener ganancias" });
    }
});

app.post("/api/reservas", async (req, res) => {
    try {
        const nueva = new Reserva(req.body);
        await nueva.save();

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

// DELETE /api/reservas/:id — dueño y recepcionista
app.delete("/api/reservas/:id", authMiddleware(["dueno","recepcionista"]), async (req, res) => {
    try {
        await Reserva.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar reserva" });
    }
});

// DELETE /api/reservas — dueño y recepcionista
app.delete("/api/reservas", authMiddleware(["dueno","recepcionista"]), async (req, res) => {
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
