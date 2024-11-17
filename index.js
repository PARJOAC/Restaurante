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
mongoose.connect(MONGODB_URI)
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
  const { platos, total } = req.body;
  try {
    // Generar un identificador único si no se proporciona
    const maxId = (await Comanda.find().sort({ identificador: -1 }).limit(1))[0]?.identificador || 0;
    const identificador = req.body.id || maxId + 1;

    const comanda = new Comanda({ identificador, platos, total });
    await comanda.save();
    res.status(201).json({ message: "Comanda guardada", comanda });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar la comanda", details: err.message });
  }
});


// Eliminar una comanda
app.delete('/api/comandas/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10); // Convertir a número
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

// Eliminar todas las comandas
app.delete('/api/comandas', async (req, res) => {
  try {
    await Comanda.deleteMany();
    res.json({ message: "Todas las comandas eliminadas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar todas las comandas", details: err.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
