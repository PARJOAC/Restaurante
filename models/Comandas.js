// models/Comandas.js
const mongoose = require("mongoose");
const ComandaSchema = new mongoose.Schema({
  mesa: String,
  platos: [
    {
      nombre: String,
      cantidad: Number,
      precio: Number,
    },
  ],
  fecha: String,
  total: Number,
});
const Comandas = mongoose.model("Comandas", ComandaSchema);
module.exports = Comandas;
