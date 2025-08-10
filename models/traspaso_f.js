const mongoose = require('mongoose');

const traspasoSchema = new mongoose.Schema({
  numero_traspaso: { type: String, required: true, unique: true },
  id_perfume: { type: mongoose.Schema.Types.ObjectId, ref: 'Perfume', required: true },
  cantidad: { type: Number, required: true },
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', required: true },
  fecha_salida: { type: Date, required: true },
  usuario_registro: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  almacen_salida: { type: mongoose.Schema.Types.Mixed, required: true }, // Puede ser ObjectId o String
  almacen_destino: { type: mongoose.Schema.Types.Mixed, required: true },  // Puede ser ObjectId o String
  estatus_validacion: { 
  type: String,
  enum: ['Pendiente', 'Validado', 'Rechazado'],
  default: 'Pendiente'
}

}, {
  collection: 'traspasos',
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Traspaso', traspasoSchema);
