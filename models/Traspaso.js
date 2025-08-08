const mongoose = require('mongoose');

const traspasoSchema = new mongoose.Schema({
  numero_traspaso: {
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
  estatus_validacion: {
    type: String,
    enum: ['Pendiente', 'Validado', 'Rechazado'],
    default: 'Pendiente'
  },
  fecha_salida: {
    type: Date,
    required: true
  },
  usuario_registro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  almacen_salida: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Almacen',
    required: true
  },
  // Campos de auditoría
  validado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fecha_validacion: {
    type: Date
  },
  observaciones_auditor: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

// Método para convertir a JSON público
traspasoSchema.methods.toPublicJSON = function() {
  const traspaso = this.toObject();
  
  return {
    _id: traspaso._id,
    numero_traspaso: traspaso.numero_traspaso,
    cantidad: traspaso.cantidad,
    estatus_validacion: traspaso.estatus_validacion,
    fecha_salida: traspaso.fecha_salida,
    observaciones_auditor: traspaso.observaciones_auditor,
    createdAt: traspaso.createdAt,
    updatedAt: traspaso.updatedAt
  };
};

module.exports = mongoose.model('Traspaso', traspasoSchema);
