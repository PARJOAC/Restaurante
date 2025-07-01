const mongoose = require("mongoose");

const ComandaSchema = new mongoose.Schema({
  mesa: String,
  platos: [
    {
      nombre: String,
      cantidad: Number,
      precio: Number,
      ready: { type: Number, default: 0 }, // ← cuántos ya están hechos
    },
  ],
  fecha: String,
  total: Number,
});

const Comandas = mongoose.model("Comandas", ComandaSchema);
module.exports = Comandas;
