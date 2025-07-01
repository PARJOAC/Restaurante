// Importa mongoose para definir esquemas y modelos en MongoDB
const mongoose = require("mongoose");

// Define el esquema de una comanda (pedido realizado en una mesa)
const ComandaSchema = new mongoose.Schema({
  // Número o identificador de la mesa que hizo la comanda
  mesa: String,

  // Lista de platos incluidos en la comanda
  platos: [
    {
      // Nombre del plato
      nombre: String,

      // Cantidad de unidades pedidas de ese plato
      cantidad: Number,

      // Precio unitario del plato
      precio: Number,

      // Número de unidades ya preparadas o listas (por defecto 0)
      ready: { type: Number, default: 0 }, // ← cuántos ya están hechos
    },
  ],

  // Fecha en que se hizo la comanda (puede estar en formato string, ej. "2025-07-01 14:22")
  fecha: String,

  // Precio total de la comanda
  total: Number,
});

// Crea el modelo 'Comandas' usando el esquema anterior
const Comandas = mongoose.model("Comandas", ComandaSchema);

// Exporta el modelo para usarlo en otros archivos del proyecto
module.exports = Comandas;
