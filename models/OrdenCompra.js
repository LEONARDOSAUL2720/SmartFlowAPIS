const mongoose = require('mongoose');

const ordenCompraSchema = new mongoose.Schema({
  id_perfume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Perfume',
    required: true
  },
  id_proveedor: {
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
  fecha_orden: {
    type: Date,
    required: true
  },
  estatus: {
    type: String,
    required: true,
    enum: ['pendiente', 'procesando', 'completada', 'cancelada'],
    default: 'pendiente'
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
    id_perfume: orden.id_perfume,
    id_proveedor: orden.id_proveedor,
    cantidad: orden.cantidad,
    precio_unitario: orden.precio_unitario,
    precio_total: orden.precio_total,
    fecha_orden: orden.fecha_orden,
    estatus: orden.estatus
  };
};

module.exports = mongoose.model('OrdenCompra', ordenCompraSchema);
