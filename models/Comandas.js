// Comandas.js (REEMPLAZA tu esquema actual por este)
const mongoose = require("mongoose");

const ComandaSchema = new mongoose.Schema({
  mesa: String,
  platos: [
    {
      plato: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Platos",
        required: true,
      },
      cantidad: { type: Number, required: true },
      ready: { type: Number, default: 0 },
    },
  ],
  fecha: String,
  total: Number,
});

const Comandas = mongoose.model("Comandas", ComandaSchema);
module.exports = Comandas;
