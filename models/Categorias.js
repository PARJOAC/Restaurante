const mongoose = require("mongoose");

const categoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
});

const Categorias = mongoose.model("Categorias", categoriaSchema);
module.exports = Categorias;
