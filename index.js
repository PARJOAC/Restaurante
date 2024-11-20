const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

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

const comandaSchema = new mongoose.Schema({
  identificador: { type: Number, required: true, unique: true },
  platos: [
    {
      nombre: { type: String, required: true },
      cantidad: { type: Number, required: true, min: 1 },
      precio: { type: Number, required: true, min: 0 }
    }
  ],
  fecha: { type: String, required: true },
  total: { type: Number, required: true, min: 0 }
});

const Comanda = mongoose.model('Comanda', comandaSchema);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/comandas', async (req, res) => {
  const { platos, total } = req.body;

  try {
const formatearFecha = (fecha) => {
  const opciones = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Madrid',
  };

  const fechaFormateada = new Intl.DateTimeFormat('es-ES', opciones).format(fecha);

  // Ajuste para que siga el formato DD/MM/YYYY HH:mm:ss
  const [dia, mes, anio, hora] = fechaFormateada
    .replace(',', '')
    .split(/\/| |:/);

  return `${dia}/${mes}/${anio} ${hora}`;
};
    
    const lastComanda = await Comanda.findOne().sort({ identificador: -1 });
    const identificador = lastComanda ? lastComanda.identificador + 1 : 1;
    const fecha = formatearFecha(fecha);
    const comanda = new Comanda({ identificador, platos, fecha, total });
    await comanda.save();

    res.status(201).json({ message: "Comanda guardada con éxito", comanda });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar la comanda", details: err.message });
  }
});

app.post('/api/comandas', async (req, res) => {
  const { platos, total } = req.body;
  try {
    const lastComanda = await Comanda.findOne().sort({ identificador: -1 });
    const identificador = lastComanda ? lastComanda.identificador + 1 : 1;

    const comanda = new Comanda({ identificador, platos, fecha, total });
    await comanda.save();
    res.status(201).json({ message: "Comanda guardada con éxito", comanda });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar la comanda", details: err.message });
  }
});

app.get('/api/comandas', async (req, res) => {
  try {
    const comandas = await Comanda.find();
    res.json(comandas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las comandas", details: err.message });
  }
});


app.delete('/api/comandas/:id', async (req, res) => {
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

app.delete('/api/comandas', async (req, res) => {
  try {
    await Comanda.deleteMany();
    res.json({ message: "Todas las comandas eliminadas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar todas las comandas", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
