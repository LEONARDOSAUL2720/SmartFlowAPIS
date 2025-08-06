const mongoose = require('mongoose');

const perfumeSchema = new mongoose.Schema({
  name_per: {
    type: String,
    required: true
  },
  descripcion_per: {
    type: String
  },
  categoria_per: {
    type: String,
    enum: ['Caballero', 'Dama', 'Unisex'],
    required: true
  },
  precio_venta_per: {
    type: Number,
    default: 0,
    required: true
  },
  stock_per: {
    type: Number,
    default: 0,
    required: true
  },
  stock_minimo_per: {
    type: Number,
    default: 0,
    required: true
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
    enum: ['Activo', 'Inactivo'],
    default: 'Activo'
  },
  imagen_url: {
    type: String,
    default: null
  },
  marca: {
    type: String,
    default: 'SmartFlow'
  }
}, {
  collection: 'perfumes',
  timestamps: true, // Esto agrega createdAt y updatedAt automáticamente
  versionKey: '__v'  // Esto mantiene el __v que tienes en tus documentos
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
    imagen_url: perfume.imagen_url,
    marca: perfume.marca,
    createdAt: perfume.createdAt,
    updatedAt: perfume.updatedAt
  };
};

module.exports = mongoose.model('Perfume', perfumeSchema);
