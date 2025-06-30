// models/Plato.js
const mongoose = require("mongoose");

const platoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    precio: { type: Number, required: true, min: 0 },
    imagen: { type: String, required: true }, // URL o ruta
    descripcion: { type: String, default: "" }, // Opcional,
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Categorias" },
  },
  { timestamps: true }
);

const Platos = mongoose.model("Platos", platoSchema);
module.exports = Platos;
