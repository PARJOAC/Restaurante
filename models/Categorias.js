// Importa mongoose para definir esquemas y modelos que se almacenan en MongoDB
const mongoose = require("mongoose");

// Define el esquema para una categoría
const categoriaSchema = new mongoose.Schema({
  // Campo 'nombre': debe ser un texto, obligatorio y único (no puede haber dos categorías con el mismo nombre)
  nombre: { type: String, required: true, unique: true },
});

// Crea el modelo 'Categorias' a partir del esquema definido
const Categorias = mongoose.model("Categorias", categoriaSchema);

// Exporta el modelo para poder usarlo en otras partes del proyecto
module.exports = Categorias;
