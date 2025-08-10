const mongoose = require('mongoose');

const salidaSchema = new mongoose.Schema({
  nombre_perfume: {
    type: String,
    required: true
  },
  almacen_salida: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true
  },
  tipo: {
    type: String,
    enum: ['Venta', 'Merma'],
    required: true
  },
  fecha_salida: {
    type: Date,
    default: Date.now
  },
  usuario_registro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'salidas',
  versionKey: false
});

module.exports = mongoose.model('Salida', salidaSchema);
