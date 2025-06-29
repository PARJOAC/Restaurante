const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
});

// Método para verificar contraseña
adminSchema.methods.comprobarPassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.contraseña);
};

module.exports = mongoose.model("Admin", adminSchema);
