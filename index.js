const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config(); // Cargar variables de entorno

// Crear aplicación Express
const app = express();

// Usar middleware
app.use(cors());
app.use(bodyParser.json());

// Conexión a MongoDB con manejo de errores
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Falta la variable de entorno MONGODB_URI");
  process.exit(1);
}
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conexión exitosa a MongoDB"))
  .catch((err) => {
    console.error("Error en la conexión a MongoDB:", err.message);
    process.exit(1);
  });

// Crear el esquema para las comandas
const comandaSchema = new mongoose.Schema({
  identificador: { type: Number, required: true, unique: true }, // Índice único
  platos: [
    {
      nombre: { type: String, required: true },
      cantidad: { type: Number, required: true, min: 1 },
      precio: { type: Number, required: true, min: 0 }
    }
  ],
  total: { type: Number, required: true, min: 0 }
});

const Comanda = mongoose.model('Comanda', comandaSchema);

// Rutas

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Asegúrate de que index.html esté en la carpeta public
});

// Obtener todas las comandas
app.get('/api/comandas', async (req, res) => {
  try {
    const comandas = await Comanda.find();
    res.json(comandas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las comandas" });
  }
});

// Crear una nueva comanda
app.post('/api/comandas', async (req, res) => {
  const { id, platos, total } = req.body;
  try {
    const comanda = new Comanda({ identificador: id,
