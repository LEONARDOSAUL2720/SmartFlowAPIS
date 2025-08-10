const mongoose = require('mongoose');

const perfumeSchema = new mongoose.Schema({
  name_per: {
    type: String,
    required: true
  },
  descripcion_per: {
    type: String
  },
  marca: String,
  precio_unitario: { type: Number, default: 0 },
  precio_venta_per: { type: Number, default: 0 },
  stock_minimo_per: Number,
  stock_per: Number,
  stock_actual:Number,
  ubicacion_per: String,
  fecha_expiracion: Date,
  sku: String,
  categoria_per: String,
  estado: String,
  
  almacen_id: {
    type: String,
    required: true
  }

}, {
  collection: 'perfumes',
  versionKey: false
});

module.exports = mongoose.model('Perfume', perfumeSchema);
