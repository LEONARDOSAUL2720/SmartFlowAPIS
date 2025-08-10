const mongoose = require('mongoose');

const ordenCompraSchema = new mongoose.Schema({
  n_orden_compra: {
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
  usuario_solicitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  precio_unitario: {
    type: Number,
    default: 0
  },
  precio_total: {
    type: Number,
    default: 0
  },
  almacen: {
    type: String,
    default: ''
  }
}, {
  collection: 'ordenes_compra',
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model('OrdenCompra', ordenCompraSchema);
