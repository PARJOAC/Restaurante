// Importa mongoose para trabajar con esquemas y modelos en MongoDB
const mongoose = require("mongoose");

// Importa bcrypt para poder comparar contraseñas cifradas de forma segura
const bcrypt = require("bcrypt");

// Define el esquema del cocinero para la base de datos
const cocineroSchema = new mongoose.Schema({
  // Campo 'usuario': de tipo texto, obligatorio y único (no se repite entre cocineros)
  usuario: { type: String, required: true, unique: true },

  // Campo 'contraseña': de tipo texto, obligatorio
  contraseña: { type: String, required: true },
});

// Método personalizado del esquema para comprobar si la contraseña ingresada coincide
cocineroSchema.methods.comprobarPassword = function (inputPassword) {
  // Usa bcrypt para comparar la contraseña en texto plano con la cifrada almacenada
  return bcrypt.compare(inputPassword, this.contraseña);
};

// Crea el modelo 'Cocinero' a partir del esquema definido
const Cocinero = mongoose.model("Cocinero", cocineroSchema);

// Exporta el modelo para poder usarlo en otras partes del proyecto
module.exports = Cocinero;
