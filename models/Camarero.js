// Importa la librería mongoose para interactuar con MongoDB
const mongoose = require("mongoose");

// Importa bcrypt para poder comparar contraseñas de forma segura (hash vs. texto plano)
const bcrypt = require("bcrypt");

// Define el esquema del camarero en la base de datos
const camareroSchema = new mongoose.Schema({
  // Campo 'usuario': tipo texto, obligatorio y no se puede repetir (único)
  usuario: { type: String, required: true, unique: true },

  // Campo 'contraseña': tipo texto, obligatorio
  contraseña: { type: String, required: true },
});

// Método del esquema para comprobar si la contraseña introducida coincide con la guardada (encriptada)
camareroSchema.methods.comprobarPassword = function (inputPassword) {
  // Compara la contraseña en texto plano con la encriptada usando bcrypt
  return bcrypt.compare(inputPassword, this.contraseña);
};

// Crea el modelo 'Camarero' basado en el esquema anterior
const Camarero = mongoose.model("Camarero", camareroSchema);

// Exporta el modelo para poder utilizarlo en otros archivos del proyecto
module.exports = Camarero;
