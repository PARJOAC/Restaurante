// models/Plato.js
// Importa mongoose para definir el esquema y el modelo
const mongoose = require("mongoose");

// Define el esquema de un plato del menú
const platoSchema = new mongoose.Schema(
  {
    // Nombre del plato: obligatorio
    nombre: { type: String, required: true },

    // Precio del plato: obligatorio, debe ser un número mayor o igual a 0
    precio: { type: Number, required: true, min: 0 },

    // Imagen del plato: puede ser una URL o ruta local, obligatorio
    imagen: { type: String, required: true },

    // Descripción del plato: no obligatoria, por defecto es una cadena vacía
    descripcion: { type: String, default: "" },

    // Referencia a una categoría (relación con la colección 'Categorias')
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Categorias" },
  },
  {
    // Activa los timestamps: crea automáticamente 'createdAt' y 'updatedAt'
    timestamps: true,
  }
);

// Crea el modelo 'Platos' usando el esquema definido
const Platos = mongoose.model("Platos", platoSchema);

// Exporta el modelo para que pueda ser utilizado en otros archivos
module.exports = Platos;
