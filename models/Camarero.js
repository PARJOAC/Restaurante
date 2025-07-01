const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const camareroSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
});

camareroSchema.methods.comprobarPassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.contraseña);
};
const Camarero = mongoose.model("Camarero", camareroSchema);
module.exports = Camarero;
