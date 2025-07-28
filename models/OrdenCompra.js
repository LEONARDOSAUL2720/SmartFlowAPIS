const mongoose = require('mongoose');

const ordenCompraSchema = new mongoose.Schema({
  n_orden_compra: {  // CORREGIDO: sin punto, con guión bajo
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
  proveedor: {  // CORREGIDO: en la BD es 'proveedor', no 'id_proveedor'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  precio_unitario: {
    type: Number,
    required: true,
    min: 0
  },
  precio_total: {
    type: Number,
    required: true,
    min: 0
  },
  fecha: {  // CORREGIDO: era fecha_orden
    type: Date,
    required: true
  },
  estado: {  // CORREGIDO: era estatus
    type: String,
    required: true,
    enum: ['Pendiente', 'Procesando', 'Completada', 'Cancelada'],  // CORREGIDO: capitalizado
    default: 'Pendiente'
  },
  usuario_solicitante: {  // AGREGAR campo usuario_solicitante
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  observaciones: {  // AGREGAR campo observaciones
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true,
  collection: 'ordenes_compra'
});

// Método para convertir a JSON público
ordenCompraSchema.methods.toPublicJSON = function() {
  const orden = this.toObject();
  return {
    _id: orden._id,
    n_orden_compra: orden.n_orden_compra,  // CORREGIDO
    id_perfume: orden.id_perfume,
    proveedor: orden.proveedor,  // CORREGIDO: usar 'proveedor' en lugar de 'id_proveedor'
    cantidad: orden.cantidad,
    precio_unitario: orden.precio_unitario,
    precio_total: orden.precio_total,
    fecha: orden.fecha,  // CORREGIDO
    estado: orden.estado,  // CORREGIDO
    usuario_solicitante: orden.usuario_solicitante,
    observaciones: orden.observaciones
  };
};

module.exports = mongoose.model('OrdenCompra', ordenCompraSchema);
