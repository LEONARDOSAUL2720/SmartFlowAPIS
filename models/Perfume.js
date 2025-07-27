const mongoose = require('mongoose');

const perfumeSchema = new mongoose.Schema({
  name_per: {
    type: String,
    required: true,
    trim: true
  },
  descripcion_per: {
    type: String,
    required: true
  },
  categoria_per: {
    type: String,
    required: true,
    enum: ['Dama', 'Caballero', 'Unisex']
  },
  precio_venta_per: {
    type: Number,
    required: true,
    min: 0
  },
  stock_per: {
    type: Number,
    required: true,
    min: 0
  },
  stock_minimo_per: {
    type: Number,
    required: true,
    min: 0
  },
  ubicacion_per: {
    type: String,
    required: true
  },
  fecha_expiracion: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    required: true,
    enum: ['Activo', 'Inactivo', 'Descontinuado'],
    default: 'Activo'
  },
  imagen_url: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'perfumes'
});

// Método para convertir a JSON público
perfumeSchema.methods.toPublicJSON = function() {
  const perfume = this.toObject();
  return {
    _id: perfume._id,
    name_per: perfume.name_per,
    descripcion_per: perfume.descripcion_per,
    categoria_per: perfume.categoria_per,
    precio_venta_per: perfume.precio_venta_per,
    stock_per: perfume.stock_per,
    stock_minimo_per: perfume.stock_minimo_per,
    ubicacion_per: perfume.ubicacion_per,
    fecha_expiracion: perfume.fecha_expiracion,
    estado: perfume.estado,
    imagen_url: perfume.imagen_url
  };
};

module.exports = mongoose.model('Perfume', perfumeSchema);
