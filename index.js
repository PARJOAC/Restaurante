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

// Conexión a MongoDB con variables de entorno
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Conexión exitosa a MongoDB"))
  .catch((err) => console.log("Error en la conexión a MongoDB:", err));

// Crear el esquema para las comandas
const comandaSchema = new mongoose.Schema({
  identificador: { type: Number, required: true, unique: true }, // Añadir índice único
  platos: [
    {
      nombre: String,
      cantidad: Number,
      precio: Number
    }
  ],
  total: Number
});

const Comanda = mongoose.model('Comanda', comandaSchema);

// Rutas

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));  // Asegúrate de que index.html esté en la carpeta public
});

// Obtener todas las comandas
app.get('/api/comandas', async (req, res) => {
  try {
    const comandas = await Comanda.find();
    res.json(comandas);
  } catch (err) {
    res.status(500).send("Error al obtener las comandas");
  }
});

// Crear una nueva comanda
app.post('/api/comandas', async (req, res) => {
  const { id, platos, total } = req.body;
  try {
    const comanda = new Comanda({ identificador: id, platos: platos, total: total });
    await comanda.save();
    res.status(201).send("Comanda guardada");
  } catch (err) {
    res.status(500).send("Error al guardar la comanda");
  }
});

// Eliminar una comanda
app.delete('/api/comandas/:id', async (req, res) => {
  const { id } = req.params;
  console.log(req.params)
  try {
    await Comanda.findOneAndDelete({ identificador: id });
    res.send("Comanda eliminada");
  } catch (err) {
    console.log(err)
    res.status(500).send("Error al eliminar la comanda");
  }
});

// Eliminar todas las comandas
app.delete('/api/comandas', async (req, res) => {
  try {
    await Comanda.deleteMany();
    res.send("Todas las comandas eliminadas");
  } catch (err) {
    res.status(500).send("Error al eliminar todas las comandas");
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
