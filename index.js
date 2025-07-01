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
const Camarero = require("./models/Camarero");
const Cocinero = require("./models/Cocinero");
const Categoria = require("./models/Categorias");

// Función para inicializar datos de prueba
async function insertarDatosDeTest() {
  const hayPlatos = await Plato.countDocuments();
  const hayComandas = await Comanda.countDocuments();

  if (hayPlatos === 0) {
    const platos = [
      {
        nombre: "Paella Valenciana",
        precio: 12.5,
        imagen:
          "https://via.placeholder.com/300x200.png?text=Paella+Valenciana",
        descripcion:
          "Arroz con pollo, conejo, garrofó y judías, aromatizado con azafrán y acabado con socarrat crujiente.",
      },
      {
        nombre: "Tortilla Española",
        precio: 6.0,
        imagen:
          "https://via.placeholder.com/300x200.png?text=Tortilla+Española",
        descripcion:
          "Omelette grueso de patata y cebolla, jugoso por dentro y dorado por fuera — clásico tapas.",
      },
      {
        nombre: "Croquetas Caseras",
        precio: 5.5,
        imagen:
          "https://via.placeholder.com/300x200.png?text=Croquetas+Caseras",
        descripcion:
          "Crujientes por fuera, suaves en su interior de bechamel con jamón ibérico.",
      },
      {
        nombre: "Pulpo a la Gallega",
        precio: 13.0,
        imagen:
          "https://via.placeholder.com/300x200.png?text=Pulpo+a+la+Gallega",
        descripcion:
          "Pulpo cocido tierno, espolvoreado con pimentón, sal gorda y aceite de oliva.",
      },
      {
        nombre: "Gazpacho Andaluz",
        precio: 4.5,
        imagen: "https://via.placeholder.com/300x200.png?text=Gazpacho+Andaluz",
        descripcion:
          "Sopa fría de tomate, pimiento y pepino, fresca y perfecta para el verano.",
      },
      {
        nombre: "Ensaladilla Rusa",
        precio: 5.0,
        imagen: "https://via.placeholder.com/300x200.png?text=Ensaladilla+Rusa",
        descripcion:
          "Ensalada cremosa de patata, zanahoria, guisantes y atún con mayonesa.",
      },
      {
        nombre: "Calamares a la Romana",
        precio: 8.0,
        imagen:
          "https://via.placeholder.com/300x200.png?text=Calamares+a+la+Romana",
        descripcion:
          "Anillas de calamar rebozadas y fritas, doradas y crujientes.",
      },
      {
        nombre: "Salmorejo Cordobés",
        precio: 5.0,
        imagen:
          "https://via.placeholder.com/300x200.png?text=Salmorejo+Cordobes",
        descripcion:
          "Crema fría espesa de tomate y pan, servida con huevo duro y jamón en taquitos.",
      },
      {
        nombre: "Albóndigas con Tomate",
        precio: 7.5,
        imagen:
          "https://via.placeholder.com/300x200.png?text=Albondigas+con+Tomate",
        descripcion:
          "Albóndigas caseras en salsa de tomate, tiernas y sabrosas.",
      },
      {
        nombre: "Pisto Manchego",
        precio: 6.0,
        imagen: "https://via.placeholder.com/300x200.png?text=Pisto+Manchego",
        descripcion:
          "Guiso de verduras (tomate, pimiento, calabacín) cocinado lentamente.",
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
if (!process.env.MONGODB_URI) {
  console.error("❌ Falta MONGODB_URI");
  process.exit(1);
}
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => {
    console.error("❌ Error conexión:", err.message);
    process.exit(1);
  });

// Crear admin y camarero por defecto
(async () => {
  try {
    if ((await Admin.countDocuments()) === 0) {
      const hash = await bcrypt.hash("admin", 10);
      await new Admin({ usuario: "admin", contraseña: hash }).save();
      console.log("🔐 Admin por defecto (admin/admin)");
    }
    if ((await Camarero.countDocuments()) === 0) {
      const hash2 = await bcrypt.hash("camarero", 10);
      await new Camarero({ usuario: "camarero", contraseña: hash2 }).save();
      console.log("🔐 Camarero por defecto (camarero/camarero)");
    }
    if ((await Cocinero.countDocuments()) === 0) {
      const hash2 = await bcrypt.hash("cocinero", 10);
      await new Cocinero({ usuario: "cocinero", contraseña: hash2 }).save();
      console.log("🔐 Cocinero por defecto (cocinero/cocinero)");
    }
  } catch (e) {
    console.error("❌ Error por defecto:", e.message);
  }
})();

// Middlewares
function requireAdmin(req, res, next) {
  if (req.session?.adminId) return next();
  res.redirect("/admin");
}
function requireCamarero(req, res, next) {
  if (req.session?.camareroId) return next();
  res.redirect("/camarero");
}
function puedeCrearComanda(req, res, next) {
  return next(); // permite público o camarero
}

function requireCocinero(req, res, next) {
  if (req.session?.cocineroId) return next();
  res.redirect("/cocinero");
}

// Rutas auth admin
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public/admin/login.html"))
);
app.post("/api/admin/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  const adm = await Admin.findOne({ usuario });
  if (!adm || !(await adm.comprobarPassword(contraseña)))
    return res.status(401).json({ error: "Credenciales inválidas" });
  req.session.adminId = adm._id;
  res.json({ message: "OK" });
});
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error logout" });
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada" });
  });
});

// Rutas auth camarero
app.get("/camarero", (req, res) =>
  res.sendFile(path.join(__dirname, "public/camarero/login.html"))
);
app.post("/api/camarero/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  const cam = await Camarero.findOne({ usuario });
  if (!cam || !(await cam.comprobarPassword(contraseña)))
    return res.status(401).json({ error: "Credenciales inválidas" });
  req.session.camareroId = cam._id;
  res.json({ message: "OK" });
});
app.post("/api/camarero/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error logout" });
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada" });
  });
});

// Rutas auth camarero
app.get("/cocinero", (req, res) =>
  res.sendFile(path.join(__dirname, "public/cocinero/login.html"))
);
app.post("/api/cocinero/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  const cam = await Cocinero.findOne({ usuario });
  if (!cam || !(await cam.comprobarPassword(contraseña)))
    return res.status(401).json({ error: "Credenciales inválidas" });
  req.session.cocineroId = cam._id;
  res.json({ message: "OK" });
});
app.post("/api/cocinero/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error logout" });
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada" });
  });
});

// Admin crea/elimina camareros
app.get("/api/camareros", requireAdmin, async (req, res) => {
  const lista = await Camarero.find({}, "usuario");
  res.json(lista);
});

app.post("/api/camareros", requireAdmin, async (req, res) => {
  const { usuario, contraseña } = req.body;

  try {
    if (await Camarero.findOne({ usuario })) {
      return res.status(409).json({ error: "Ese camarero ya existe." });
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

app.delete("/api/camareros/:id", requireAdmin, async (req, res) => {
  try {
    const eliminado = await Camarero.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "No encontrado" });
    res.json({ message: "Camarero eliminado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin crea/elimina camareros
app.get("/api/cocineros", requireAdmin, async (req, res) => {
  const lista = await Cocinero.find({}, "usuario");
  res.json(lista);
});

app.post("/api/cocineros", requireAdmin, async (req, res) => {
  const { usuario, contraseña } = req.body;

  try {
    if (await Cocinero.findOne({ usuario })) {
      return res.status(409).json({ error: "Ese cocinero ya existe." });
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

app.delete("/api/cocineros/:id", requireAdmin, async (req, res) => {
  try {
    const eliminado = await Cocinero.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "No encontrado" });
    res.json({ message: "Cocinero eliminado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Vistas
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
    const nueva = new Comanda({ mesa, platos, fecha, total });
    res.status(201).json(await nueva.save());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Resto rutas públicas y protegidas
app.get("/public/platos", async (req, res) => {
  try {
    const platos = await Plato.find().populate("categoria");
    res.json(platos);
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

// Ruta específica para cocina (comandas para cocinero)
app.get("/api/comandas/cocina", requireCocinero, async (req, res) => {
  try {
    const comandas = await Comanda.find().sort({ fecha: -1 });
    res.json(comandas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/comandas/:id", requireCocinero, async (req, res) => {
  try {
    const eliminada = await Comanda.findByIdAndDelete(req.params.id);
    if (!eliminada)
      return res.status(404).json({ error: "Comanda no encontrada" });
    res.json({ message: "Comanda eliminada" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/comandas/:id", requireCocinero, async (req, res) => {
  try {
    const { id } = req.params;
    const { platos } = req.body;

    const comanda = await Comanda.findById(id);
    if (!comanda)
      return res.status(404).json({ error: "Comanda no encontrada" });

    comanda.platos = platos;
    await comanda.save();

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/comandas/:id/plato", requireCocinero, async (req, res) => {
  try {
    const { platoIndex, nuevosHechos } = req.body;
    const comanda = await Comanda.findById(req.params.id);
    if (!comanda) return res.status(404).json({ error: "No encontrada" });
    if (!comanda.platos[platoIndex])
      return res.status(400).json({ error: "Índice inválido" });

    comanda.platos[platoIndex].ready = nuevosHechos;
    await comanda.save();
    res.json({ message: "Actualizado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CRUD Platos (solo admin)
app.get("/api/platos", requireAdmin, async (req, res) => {
  const platos = await Plato.find().populate("categoria");
  res.json(platos);
});
app.get("/api/platos/:id", requireAdmin, async (req, res) => {
  const p = await Plato.findById(req.params.id).populate("categoria");
  if (!p) return res.status(404).json({ error: "No encontrado" });
  res.json(p);
});
app.post("/api/platos", requireAdmin, async (req, res) => {
  res.status(201).json(await new Plato(req.body).save());
});
app.put("/api/platos/:id", requireAdmin, async (req, res) => {
  const updated = await Plato.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).populate("categoria");
  res.json(updated);
});
app.delete("/api/platos/:id", requireAdmin, async (req, res) => {
  await Plato.findByIdAndDelete(req.params.id);
  res.json({ message: "Eliminado" });
});

// CRUD Categorías (solo admin)
app.get("/api/categorias", requireAdmin, async (req, res) =>
  res.json(await Categoria.find())
);
app.get("/api/categorias/:id", requireAdmin, async (req, res) => {
  const cat = await Categoria.findById(req.params.id);
  if (!cat) return res.status(404).json({ error: "No encontrada" });
  res.json(cat);
});
app.post("/api/categorias", requireAdmin, async (req, res) => {
  const nombre = req.body.nombre.trim().toLowerCase();
  if (await Categoria.findOne({ nombre }))
    return res.status(409).json({ error: "Ya existe" });
  const nueva = new Categoria({ nombre });
  await nueva.save();
  res.status(201).json(nueva);
});
app.put("/api/categorias/:id", requireAdmin, async (req, res) => {
  const updated = await Categoria.findByIdAndUpdate(
    req.params.id,
    { nombre: req.body.nombre },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "No encontrada" });
  res.json(updated);
});
app.delete("/api/categorias/:id", requireAdmin, async (req, res) => {
  await Plato.updateMany(
    { categoria: req.params.id },
    { $unset: { categoria: null } }
  );
  const cat = await Categoria.findByIdAndDelete(req.params.id);
  if (!cat) return res.status(404).json({ error: "No encontrada" });
  res.json({ message: "Eliminada y platos actualizados" });
});

// Front-end público
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/index.html"))
);
app.get("/:mesa/comanda", (req, res) =>
  res.sendFile(path.join(__dirname, "public/mesa/comanda.html"))
);
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor en http://localhost:${PORT}`));
