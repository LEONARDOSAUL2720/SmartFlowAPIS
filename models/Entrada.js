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
    type: mongoose.Schema.Types.Mixed, // Permite tanto String como ObjectId
    required: true
  },
  fecha_entrada: {
    type: Date,
    required: true
  },
  usuario_registro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estatus_validacion: {
    type: String,
    required: true,
    enum: ['registrado', 'validado', 'rechazado'],
    default: 'registrado'
  },
  validado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fecha_validacion: {
    type: Date,
    default: null
  },
  observaciones_auditor: {
    type: String,
    default: '',
    trim: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['Compra', 'Traspaso'],
    default: 'Compra'
  },
  referencia_traspaso: {
    type: String,
    default: null,
    trim: true
  },
  fecha: {
    type: Date,
    required: true
  },
  almacen_origen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Almacen',
    default: null
  },
  almacen_destino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Almacen',
    required: true
  }
}, {
  timestamps: true,
  collection: 'entradas'
});

// Método para convertir a JSON público
entradaSchema.methods.toPublicJSON = function() {
  const entrada = this.toObject();
  return {
    _id: entrada._id,
    numero_entrada: entrada.numero_entrada,
    cantidad: entrada.cantidad,
    proveedor: entrada.proveedor,
    fecha_entrada: entrada.fecha_entrada,
    estatus_validacion: entrada.estatus_validacion,
    observaciones_auditor: entrada.observaciones_auditor,
    tipo: entrada.tipo,
    referencia_traspaso: entrada.referencia_traspaso,
    fecha: entrada.fecha,
    fecha_validacion: entrada.fecha_validacion,
    createdAt: entrada.createdAt,
    updatedAt: entrada.updatedAt
  };
};

module.exports = mongoose.model('Entrada', entradaSchema);