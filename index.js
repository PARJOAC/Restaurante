// Importación de módulos necesarios
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
require("dotenv").config();

// Modelos de la base de datos
const Plato = require("./models/Platos");
const Comanda = require("./models/Comandas");
const Admin = require("./models/Admin");
const Camarero = require("./models/Camarero");
const Cocinero = require("./models/Cocinero");
const Categoria = require("./models/Categorias");

// Inicialización de la app Express y middlewares básicos
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

// Conexión a MongoDB usando la URI de entorno
if (!process.env.MONGODB_URI) {
  console.error("❌ Falta MONGODB_URI");
  process.exit(1);
}
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB se ha conectado"))
  .catch((err) => {
    console.error("❌ Error en la conexión:", err.message);
    process.exit(1);
  });

// Crea usuarios por defecto si no existen (admin)
(async () => {
  try {
    if ((await Admin.countDocuments()) === 0) {
      const hash = await bcrypt.hash("admin", 10);
      await new Admin({ usuario: "admin", contraseña: hash }).save();
      console.log("🔐 Admin por defecto creado (admin/admin)");
    }
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
})();

// Middlewares de autenticación para proteger rutas según el rol
function requireAdmin(req, res, next) {
  if (req.session?.adminId) return next();
  res.redirect("/admin");
}
function requireCamarero(req, res, next) {
  if (req.session?.camareroId) return next();
  res.redirect("/camarero");
}
function requireCocinero(req, res, next) {
  if (req.session?.cocineroId) return next();
  res.redirect("/cocinero");
}
function puedeCrearComanda(req, res, next) {
  return next(); // permite público o camarero
}

function requireAdminOrCocinero(req, res, next) {
  if (req.session && (req.session.adminId || req.session.cocineroId)) {
    return next();
  }
  res.redirect("/cocinero");
}

// Rutas de autenticación para admin
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public/admin/login.html"))
);

// Login de admin
app.post("/api/admin/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  const adm = await Admin.findOne({ usuario });
  if (!adm || !(await adm.comprobarPassword(contraseña)))
    return res.status(401).json({ error: "Credenciales inválidas." });
  req.session.adminId = adm._id;
  res.json({ message: "OK" });
});

// Logout de admin
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error al cerrar sesión." });
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada correctamente." });
  });
});

// Cambiar contraseña de admin
app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
  const { current, new: newPass } = req.body;
  try {
    const adm = await Admin.findById(req.session.adminId);
    if (!adm) return res.status(400).json({ error: "Admin no encontrado." });

    const dbHash = String(adm.contraseña).trim();
    const match = await bcrypt.compare(current, dbHash);

    if (!match) {
      return res.status(400).json({ error: "Contraseña actual incorrecta." });
    }

    const hash = await bcrypt.hash(newPass, 10);
    adm.contraseña = hash;
    await adm.save();
    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar contraseña." });
  }
});

// Rutas de autenticación para camarero
app.get("/camarero", (req, res) =>
  res.sendFile(path.join(__dirname, "public/camarero/login.html"))
);

// Login de camarero
app.post("/api/camarero/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  const cam = await Camarero.findOne({ usuario });
  if (!cam || !(await cam.comprobarPassword(contraseña)))
    return res.status(401).json({ error: "Credenciales inválidas." });
  req.session.camareroId = cam._id;
  res.json({ message: "OK" });
});

// Logout de camarero
app.post("/api/camarero/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error al cerrar sesión." });
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada correctamente." });
  });
});

// Rutas de autenticación para cocinero
app.get("/cocinero", (req, res) =>
  res.sendFile(path.join(__dirname, "public/cocinero/login.html"))
);

// Login de cocinero
app.post("/api/cocinero/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  const cam = await Cocinero.findOne({ usuario });
  if (!cam || !(await cam.comprobarPassword(contraseña)))
    return res.status(401).json({ error: "Credenciales inválidas." });
  req.session.cocineroId = cam._id;
  res.json({ message: "OK" });
});

// Logout de cocinero
app.post("/api/cocinero/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error al cerrar sesión." });
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada correctamente." });
  });
});

// CRUD de camareros (admin)
app.get("/api/camareros", requireAdmin, async (req, res) => {
  const lista = await Camarero.find({}, "usuario");
  res.json(lista);
});

// Crear un nuevo camarero
app.post("/api/camareros", requireAdmin, async (req, res) => {
  const { usuario, contraseña } = req.body;

  try {
    if (await Camarero.findOne({ usuario })) {
      return res
        .status(409)
        .json({ error: `El camarero llamado \"${usuario}\" ya existe.` });
    }

    // Generar el hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contraseña, salt);

    // Crear y guardar el nuevo camarero con contraseña cifrada
    const nuevo = new Camarero({ usuario, contraseña: hash });
    await nuevo.save();

    res.status(201).json({ usuario: nuevo.usuario, _id: nuevo._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar un camarero
app.delete("/api/camareros/:id", requireAdmin, async (req, res) => {
  try {
    const eliminado = await Camarero.findByIdAndDelete(req.params.id);
    if (!eliminado)
      return res.status(404).json({
        error: `No se ha encontrado el camarero llamado \"${eliminado.usuario}\".`,
      });
    res.json({
      message: `El camarero llamado \"${eliminado.usuario}\" ha sido eliminado`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CRUD de cocineros (admin)
app.get("/api/cocineros", requireAdmin, async (req, res) => {
  const lista = await Cocinero.find({}, "usuario");
  res.json(lista);
});

// Crear un nuevo cocinero
app.post("/api/cocineros", requireAdmin, async (req, res) => {
  const { usuario, contraseña } = req.body;

  try {
    if (await Cocinero.findOne({ usuario })) {
      return res
        .status(409)
        .json({ error: `El cocinero llamado \"${usuario}\" ya existe.` });
    }

    // Generar el hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contraseña, salt);

    // Crear y guardar el nuevo camarero con contraseña cifrada
    const nuevo = new Cocinero({ usuario, contraseña: hash });
    await nuevo.save();

    res.status(201).json({ usuario: nuevo.usuario, _id: nuevo._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar un cocinero
app.delete("/api/cocineros/:id", requireAdmin, async (req, res) => {
  try {
    const eliminado = await Cocinero.findByIdAndDelete(req.params.id);
    if (!eliminado)
      return res.status(404).json({
        error: `No se ha encontrado el cocinero llamado \"${eliminado.usuario}\".`,
      });
    res.json({ message: "Cocinero eliminado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Vistas protegidas según el rol
app.get("/admin/panel", requireAdmin, (req, res) =>
  res.sendFile(path.join(__dirname, "public/admin/admin-panel.html"))
);
app.get("/camarero/comanda", requireCamarero, (req, res) =>
  res.sendFile(path.join(__dirname, "public/camarero/comanda.html"))
);
app.get("/cocinero/comandas", requireCocinero, (req, res) =>
  res.sendFile(path.join(__dirname, "public/cocinero/comanda.html"))
);

// Crear comanda (camarero o público)
app.post("/api/comandas", puedeCrearComanda, async (req, res) => {
  try {
    const { mesa, platos: items, total } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "No hay platos en la comanda" });

    // Valida el contenido y construye la estructura para Mongo
    const platosParaGuardar = items.map((i) => ({
      plato: i._id,
      cantidad: i.cantidad,
    }));

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

    // Construye y guarda la comanda
    const nueva = new Comanda({
      mesa,
      platos: platosParaGuardar,
      total,
      fecha,
    });
    const result = await nueva.save();

    res.status(201).json(result);
  } catch (e) {
    console.error("Error al guardar comanda", e);
    res.status(500).json({ error: e.message });
  }
});

// Obtener platos públicos
app.get("/public/platos", async (req, res) => {
  try {
    const platos = await Plato.find().populate("categoria");
    res.json(platos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CRUD Comandas (admin)
app.get("/api/comandas", requireAdminOrCocinero, async (req, res) => {
  try {
    const lista = await Comanda.find()
      .sort({ fecha: -1 })
      .populate("platos.plato");

    res.json(lista);
  } catch (e) {
    console.error("Error en /api/comandas:", e); // ⬅️ Añade esto
    res.status(500).json({ error: e.message });
  }
});

// Obtener una comanda por ID (cocinero)
app.delete("/api/comandas/:id", requireCocinero, async (req, res) => {
  try {
    const eliminada = await Comanda.findByIdAndDelete(req.params.id);
    if (!eliminada)
      return res.status(404).json({ error: "Comanda no encontrada." });
    res.json({ message: "Comanda eliminada." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Actualizar una comanda (cocinero)
app.patch("/api/comandas/:id", requireCocinero, async (req, res) => {
  try {
    const { id } = req.params;
    const { platos } = req.body;

    const comanda = await Comanda.findById(id);
    if (!comanda)
      return res.status(404).json({ error: "Comanda no encontrada." });

    comanda.platos = platos;
    await comanda.save();

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Actualizar el estado de un plato (cocinero)
app.put("/api/comandas/:id/plato", requireCocinero, async (req, res) => {
  try {
    const { platoIndex, nuevosHechos } = req.body;
    const comanda = await Comanda.findById(req.params.id);
    if (!comanda) return res.status(404).json({ error: "No encontrada." });
    if (!comanda.platos[platoIndex])
      return res.status(400).json({ error: "Índice inválido." });

    comanda.platos[platoIndex].ready = nuevosHechos;
    await comanda.save();
    res.json({ message: "Actualizado." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CRUD Platos (admin)
app.get("/api/platos", requireAdmin, async (req, res) => {
  const platos = await Plato.find().populate("categoria");
  res.json(platos);
});

// Obtener un plato por ID (admin)
app.get("/api/platos/:id", requireAdmin, async (req, res) => {
  const p = await Plato.findById(req.params.id).populate("categoria");
  if (!p) return res.status(404).json({ error: "No encontrado." });
  res.json(p);
});

// Crear un nuevo plato (admin)
app.post("/api/platos", requireAdmin, async (req, res) => {
  res.status(201).json(await new Plato(req.body).save());
});

// Actualizar un plato (admin)
app.put("/api/platos/:id", requireAdmin, async (req, res) => {
  const updated = await Plato.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).populate("categoria");
  res.json(updated);
});

// Eliminar un plato (admin)
app.delete("/api/platos/:id", requireAdmin, async (req, res) => {
  await Plato.findByIdAndDelete(req.params.id);
  res.json({ message: "Se ha eliminado el plato." });
});

// CRUD Categorías (admin)
app.get("/api/categorias", requireAdmin, async (req, res) =>
  res.json(await Categoria.find())
);

// Obtener una categoría por ID (admin)
app.get("/api/categorias/:id", requireAdmin, async (req, res) => {
  const cat = await Categoria.findById(req.params.id);
  if (!cat)
    return res.status(404).json({ error: "No se ha encontrado la categoría." });
  res.json(cat);
});

// Crear una nueva categoría (admin)
app.post("/api/categorias", requireAdmin, async (req, res) => {
  const nombre = req.body.nombre.trim().toLowerCase();
  if (await Categoria.findOne({ nombre }))
    return res.status(409).json({ error: "Ya existe esa categoría." });
  const nueva = new Categoria({ nombre });
  await nueva.save();
  res.status(201).json(nueva);
});

// Actualizar una categoría (admin)
app.put("/api/categorias/:id", requireAdmin, async (req, res) => {
  const updated = await Categoria.findByIdAndUpdate(
    req.params.id,
    { nombre: req.body.nombre },
    { new: true }
  );
  if (!updated)
    return res.status(404).json({ error: "No se ha encontrado la categoría." });
  res.json(updated);
});

// Eliminar una categoría (admin) y actualizar platos
app.delete("/api/categorias/:id", requireAdmin, async (req, res) => {
  await Plato.updateMany(
    { categoria: req.params.id },
    { $unset: { categoria: null } }
  );
  const cat = await Categoria.findByIdAndDelete(req.params.id);
  if (!cat)
    return res.status(404).json({ error: "No se ha encontrado la categoría." });
  res.json({ message: "Categoría eliminada y platos actualizados." });
});

// Rutas públicas para el frontend
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/index.html"))
);

// Rutas para público
app.get("/:mesa/comanda", (req, res) =>
  res.sendFile(path.join(__dirname, "public/mesa/comanda.html"))
);

// Esta ruta sirve los archivos estáticos del frontend
app.use(express.static(path.join(__dirname, "public")));

// Arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor en http://localhost:${PORT}`));
