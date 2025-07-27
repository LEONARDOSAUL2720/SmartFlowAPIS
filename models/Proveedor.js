const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema({
  nombre_proveedor: {
    type: String,
    required: true,
    trim: true
  },
  rfc: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  contacto: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  direccion: {
    type: String,
    required: true
  },
  fecha_registro: {
    type: Date,
    required: true,
    default: Date.now
  },
  estado: {
    type: String,
    required: true,
    enum: ['Activo', 'Inactivo', 'Suspendido'],
    default: 'Activo'
  }
}, {
  timestamps: true,
  collection: 'proveedores'
});

// Método para convertir a JSON público
proveedorSchema.methods.toPublicJSON = function() {
  const proveedor = this.toObject();
  return {
    _id: proveedor._id,
    nombre_proveedor: proveedor.nombre_proveedor,
    rfc: proveedor.rfc,
    contacto: proveedor.contacto,
    telefono: proveedor.telefono,
    email: proveedor.email,
    direccion: proveedor.direccion,
    fecha_registro: proveedor.fecha_registro,
    estado: proveedor.estado
  };
};

module.exports = mongoose.model('Proveedor', proveedorSchema);
