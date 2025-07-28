const mongoose = require('mongoose');

const almacenSchema = new mongoose.Schema({
  nombre_almacen: {
    type: String,
    required: true,
    trim: true
  },
  ubicacion: {
    type: String,
    required: true,
    trim: true
  },
  estado: {
    type: String,
    required: true,
    enum: ['Activo', 'Inactivo'],
    default: 'Activo'
  },
  descripcion: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true,
  collection: 'almacenes'
});

// Método para convertir a JSON público
almacenSchema.methods.toPublicJSON = function() {
  const almacen = this.toObject();
  return {
    _id: almacen._id,
    nombre_almacen: almacen.nombre_almacen,
    ubicacion: almacen.ubicacion,
    estado: almacen.estado,
    descripcion: almacen.descripcion,
    createdAt: almacen.createdAt,
    updatedAt: almacen.updatedAt
  };
};

module.exports = mongoose.model('Almacen', almacenSchema);
