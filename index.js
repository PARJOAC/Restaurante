const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Usar middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Falta la variable de entorno MONGODB_URI");
  process.exit(1);
}
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Conexión exitosa a MongoDB"))
  .catch((err) => {
    console.error("Error en la conexión a MongoDB:", err.message);
    process.exit(1);
  });

// Middleware de autenticación
const authenticateUser = (req, res, next) => {
  const { username, password } = req.body;

  if ((username === "cocina" && password === "cocina") || (username === "camarero" && password === "camarero")) {
    next(); // Si las credenciales son correctas, seguimos con la solicitud
  } else {
    res.status(401).json({ error: "Credenciales incorrectas" }); // Si no son correctas, devolvemos error
  }
};

// Ruta para iniciar sesión
app.post('/login', authenticateUser, (req, res) => {
  res.json({ message: "Inicio de sesión exitoso" });
});

// Rutas protegidas
const isAuthenticated = (req, res, next) => {
  // Aquí podrías implementar un sistema de token JWT para asegurar la sesión del usuario
  // Por ejemplo, si ya se validó previamente el inicio de sesión
  if (req.body.username === "cocina" || req.body.username === "camarero") {
    return next();
  }
  res.status(401).json({ error: "No autenticado" });
};

// Comandas
app.post('/api/comandas', isAuthenticated, async (req, res) => {
  const { platos, total } = req.body;
  try {
    const lastComanda = await Comanda.findOne().sort({ identificador: -1 });
    const identificador = lastComanda ? lastComanda.identificador + 1 : 1;
    const comanda = new Comanda({ identificador, platos, total });
    await comanda.save();
    res.status(201).json({ message: "Comanda guardada con éxito", comanda });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar la comanda", details: err.message });
  }
});

// Mostrar comandas
app.get('/api/comandas', isAuthenticated, async (req, res) => {
  try {
    const comandas = await Comanda.find();
    res.json(comandas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las comandas", details: err.message });
  }
});

// Eliminar comandas
app.delete('/api/comandas/:id', isAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  try {
    const result = await Comanda.findOneAndDelete({ identificador: id });
    if (result) {
      res.json({ message: "Comanda eliminada" });
    } else {
      res.status(404).json({ error: "Comanda no encontrada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la comanda", details: err.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
