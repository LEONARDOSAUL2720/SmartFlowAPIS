const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema({
  nombre_proveedor: { type: String, required: true },
  contacto: String,
  telefono: String,
  direccion: String,
  correo: String,
  estado: { type: Boolean, default: true },
  fecha_creacion: { type: Date, default: Date.now }
}, {
  collection: 'proveedores',
  versionKey: false
});

module.exports = mongoose.model('Proveedor', proveedorSchema);
