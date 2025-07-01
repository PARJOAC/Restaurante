// Importa la librería mongoose para interactuar con MongoDB
const mongoose = require("mongoose");

// Importa bcrypt para encriptar y comparar contraseñas de forma segura
const bcrypt = require("bcrypt");

// Define el esquema del administrador en la base de datos
const adminSchema = new mongoose.Schema({
  // Campo 'usuario' de tipo String, obligatorio y único
  usuario: { type: String, required: true, unique: true },

  // Campo 'contraseña' de tipo String, obligatorio
  contraseña: { type: String, required: true },
});

// Método del esquema para verificar si la contraseña introducida es correcta
adminSchema.methods.comprobarPassword = function (inputPassword) {
  // Compara la contraseña introducida con la contraseña almacenada en la base de datos (ya hasheada)
  return bcrypt.compare(inputPassword, this.contraseña);
};

// Crea el modelo 'Admin' basado en el esquema definido
const Admin = mongoose.model("Admin", adminSchema);

// Exporta el modelo para poder usarlo en otros archivos
module.exports = Admin;
