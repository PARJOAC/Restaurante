// index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
require("dotenv").config();

const Plato = require("./models/Platos");
const Comanda = require("./models/Comandas");
const Admin = require("./models/Admin");

// Función para insertar datos de test
async function insertarDatosDeTest() {
  const hayPlatos = await Plato.countDocuments();
  const hayComandas = await Comanda.countDocuments();

  if (hayPlatos === 0) {
    const platos = [
      {
        nombre: "Paella Valenciana",
        precio: 12.5,
        imagen: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90",
        descripcion: "Arroz con pollo, conejo y verduras",
      },
      {
        nombre: "Tortilla Española",
        precio: 6.0,
        imagen: "https://images.unsplash.com/photo-1605479130549-c7bd026ff7a1",
        descripcion: "Con cebolla y jugosa por dentro",
      },
      {
        nombre: "Croquetas Caseras",
        precio: 5.5,
        imagen: "https://images.unsplash.com/photo-1608571424600-d0db84b3b75b",
        descripcion: "De jamón ibérico",
      },
      {
        nombre: "Pulpo a la Gallega",
        precio: 13.0,
        imagen: "https://images.unsplash.com/photo-1583337130417-3346a1fc1d50",
        descripcion: "Con pimentón y aceite de oliva",
      },
      {
        nombre: "Gazpacho Andaluz",
        precio: 4.5,
        imagen: "https://images.unsplash.com/photo-1625940480216-f092e15b314b",
        descripcion: "Sopa fría de tomate y verduras",
      },
      {
        nombre: "Ensaladilla Rusa",
        precio: 5.0,
        imagen: "https://images.unsplash.com/photo-1562967916-eb82221dfb52",
        descripcion: "Con atún y mayonesa",
      },
      {
        nombre: "Calamares a la Romana",
        precio: 8.0,
        imagen: "https://images.unsplash.com/photo-1608748494116-54740f291fe1",
        descripcion: "Rebozados y crujientes",
      },
      {
        nombre: "Salmorejo Cordobés",
        precio: 5.0,
        imagen: "https://images.unsplash.com/photo-1616486235650-bb0db59de030",
        descripcion: "Sopa espesa de tomate con jamón",
      },
      {
        nombre: "Albóndigas con Tomate",
        precio: 7.5,
        imagen: "https://images.unsplash.com/photo-1576402187878-974f2b480eb2",
        descripcion: "Carne picada con salsa casera",
      },
      {
        nombre: "Pisto Manchego",
        precio: 6.0,
        imagen: "https://images.unsplash.com/photo-1598515213887-300b1b50b809",
        descripcion: "Verduras guisadas al estilo manchego",
      },
    ];
    await Plato.insertMany(platos);
    console.log("✔ Platos insertados");
  }

  if (hayComandas === 0) {
    const platosDB = await Plato.find();
    const comandas = [
      {
        mesa: "1",
        platos: [
          {
            nombre: platosDB[0].nombre,
            cantidad: 2,
            precio: platosDB[0].precio,
          },
          {
            nombre: platosDB[1].nombre,
            cantidad: 1,
            precio: platosDB[1].precio,
          },
        ],
        fecha: new Date().toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Europe/Madrid",
        }),
        total: platosDB[0].precio * 2 + platosDB[1].precio,
      },
      {
        mesa: "3",
        platos: [
          {
            nombre: platosDB[3].nombre,
            cantidad: 1,
            precio: platosDB[3].precio,
          },
          {
            nombre: platosDB[5].nombre,
            cantidad: 2,
            precio: platosDB[5].precio,
          },
        ],
        fecha: new Date().toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Europe/Madrid",
        }),
        total: platosDB[3].precio + platosDB[5].precio * 2,
      },
      {
        mesa: "5",
        platos: [
          {
            nombre: platosDB[6].nombre,
            cantidad: 3,
            precio: platosDB[6].precio,
          },
        ],
        fecha: new Date().toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Europe/Madrid",
        }),
        total: platosDB[6].precio * 3,
      },
    ];
    await Comanda.insertMany(comandas);
    console.log("✔ Comandas insertadas");
  }
}
insertarDatosDeTest();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "clave_secreta",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ Falta la variable de entorno MONGODB_URI");
  process.exit(1);
}
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => {
    console.error("❌ Error en la conexión a MongoDB:", err.message);
    process.exit(1);
  });

// Crear admin por defecto si no existe
(async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const hashed = await bcrypt.hash("admin", 10);
      await new Admin({ usuario: "admin", contraseña: hashed }).save();
      console.log("🔐 Usuario admin creado (admin/admin)");
    }
  } catch (e) {
    console.error("❌ Error creando admin por defecto:", e.message);
  }
})();

// Middleware para proteger rutas admin
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  // Redirigir a la página de login si no está autenticado
  return res.redirect("/admin");
}

// AUTH — login/logout
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/login.html"));
});
app.post("/api/admin/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  try {
    const admin = await Admin.findOne({ usuario });
    if (!admin) return res.status(401).json({ error: "Usuario no encontrado" });
    const valid = await bcrypt.compare(contraseña, admin.contraseña);
    if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });
    req.session.adminId = admin._id;
    res.json({ message: "Login correcto" });
  } catch {
    res.status(500).json({ error: "Error interno" });
  }
});
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error al cerrar sesión" });
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada" });
  });
});

// Panel admin (protegido)
app.get("/admin/panel.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/panel.html"));
});

app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
  const { current, new: newPwd } = req.body;
  try {
    const admin = await Admin.findById(req.session.adminId);
    const match = await bcrypt.compare(current, admin.contraseña);
    if (!match)
      return res.status(400).json({ error: "Contraseña actual incorrecta" });

    admin.contraseña = await bcrypt.hash(newPwd, 10);
    await admin.save();
    res.json({ message: "Contraseña actualizada" });
  } catch (e) {
    res.status(500).json({ error: "Error interno" });
  }
});

// CRUD Platos (solo admin)
app.get("/api/platos", requireAdmin, async (req, res) => {
  try {
    res.json(await Plato.find());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/platos/:id", requireAdmin, async (req, res) => {
  try {
    const p = await Plato.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Plato no encontrado" });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/platos", requireAdmin, async (req, res) => {
  try {
    res.status(201).json(await new Plato(req.body).save());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.put("/api/platos/:id", requireAdmin, async (req, res) => {
  try {
    res.json(
      await Plato.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.delete("/api/platos/:id", requireAdmin, async (req, res) => {
  try {
    await Plato.findByIdAndDelete(req.params.id);
    res.json({ message: "Plato eliminado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API pública — ver platos y enviar comandas
app.get("/public/platos", async (req, res) => {
  try {
    res.json(await Plato.find());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/comandas", async (req, res) => {
  try {
    const { mesa, platos, total } = req.body;
    const fecha = new Date().toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Europe/Madrid",
    });
    res
      .status(201)
      .json(await new Comanda({ mesa, platos, fecha, total }).save());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/comandas", requireAdmin, async (req, res) => {
  try {
    const lista = await Comanda.find().sort({ fecha: -1 });
    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Front-end público
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
app.get("/:mesa/comanda.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/mesa/comanda.html"));
});

// Servir estáticos
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor en http://localhost:${PORT}`));
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
