const mongoose = require('mongoose');

const entradaSchema = new mongoose.Schema({
  numero_entrada: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  id_perfume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Perfume',
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true
  },
  fecha_entrada: {
    type: Date,
    default: Date.now
  },
  usuario_registro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orden_compra: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdenCompra',
    required: false
  },
  almacen_destino: {
    //type: mongoose.Schema.Types.ObjectId,
    //ref: 'Almacen',
    //default: null
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  tipo: {
    type: String,
    enum: ['Compra', 'Traspaso'],
    default: 'Compra'
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  referencia_traspaso: {
    type: String,
    default: ''
  }
}, {
  collection: 'entradas',
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model('Entrada', entradaSchema);
