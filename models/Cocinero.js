const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const cocineroSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
});

cocineroSchema.methods.comprobarPassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.contraseña);
};

const Cocinero = mongoose.model("Cocinero", cocineroSchema);
module.exports = Cocinero;
