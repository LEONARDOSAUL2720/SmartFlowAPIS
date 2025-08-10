const mongoose = require('mongoose');

const almacenSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  direccion: String,
  telefono: String,
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'almacenes',
  versionKey: false
});

module.exports = mongoose.model('Almacen', almacenSchema);
